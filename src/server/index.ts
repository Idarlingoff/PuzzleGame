import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { WebSocketServer, WebSocket, type RawData } from "ws";

import { MovementSystem, type Move, type PlayerIndex } from "../core/systems/MovementSystem.js";
import { buildLevelFromJson, type LevelState } from "../core/systems/level/LevelLoader.js";
import { GoldenPlate } from "../core/plates/GoldenPlate.js";
import { serializeLevelState } from "../core/network/serialization.js";
import type { ClientMessage, PlayerSlotSummary, ServerMessage } from "../core/network/messages.js";

type ClientContext = {
    socket: WebSocket;
    playerIndex: PlayerIndex | null;
};

const LEVEL_FILE_NAMES = [
    "level0.json",
    "level1.json",
    "level2.json",
    "level3.json",
    "level4.json",
    "level5.json",
];

const ASSET_DIR_CANDIDATES = [
    path.resolve(process.cwd(), "dist/assets/json"),
    path.resolve(process.cwd(), "src/assets/json"),
];

const ASSET_DIR = resolveExistingDir(ASSET_DIR_CANDIDATES);

const LEVEL_PATHS = LEVEL_FILE_NAMES.map(name => path.join(ASSET_DIR, name));

class GameRoom {
    private readonly clients = new Set<ClientContext>();
    private readonly playerSlots: Array<ClientContext | null> = [null, null];
    private levelIndex = 0;
    private level!: LevelState;
    private movement!: MovementSystem;
    private initialized = false;

    constructor(private readonly id: string) {}

    async initialize() {
        if (this.initialized) return;
        this.level = await loadLevelFromFile(LEVEL_PATHS[this.levelIndex]);
        this.movement = new MovementSystem(this.level);
        this.movement.syncDoors();
        this.initialized = true;
    }

    addClient(ctx: ClientContext) {
        this.clients.add(ctx);
        this.sendInit(ctx);
        this.broadcastSlots();
    }

    removeClient(ctx: ClientContext) {
        this.clients.delete(ctx);
        if (ctx.playerIndex !== null && this.playerSlots[ctx.playerIndex] === ctx) {
            this.playerSlots[ctx.playerIndex] = null;
            ctx.playerIndex = null;
            this.broadcastSlots();
        }
        if (!this.clients.size) {
            this.playerSlots[0] = null;
            this.playerSlots[1] = null;
            this.broadcastSlots();
        }
    }

    join(ctx: ClientContext, desired?: PlayerIndex | null) {
        if (ctx.playerIndex !== null) return;
        const available = desired ?? this.firstAvailableSlot();
        if (available === null) {
            this.sendError(ctx, "Toutes les places sont occupées");
            return;
        }
        if (this.playerSlots[available]) {
            this.sendError(ctx, "La place demandée est déjà prise");
            return;
        }
        this.playerSlots[available] = ctx;
        ctx.playerIndex = available;
        this.sendInit(ctx);
        this.broadcastSlots();
    }

    handleMove(ctx: ClientContext, move: Move) {
        if (ctx.playerIndex === null) return;
        const moved = this.movement.applyMove(ctx.playerIndex, move);
        if (!moved) return;

        this.broadcastState();

        if (isLevelCompleted(this.level)) {
            void this.advanceLevel();
        }
    }

    private async advanceLevel() {
        this.levelIndex = (this.levelIndex + 1) % LEVEL_PATHS.length;
        this.level = await loadLevelFromFile(LEVEL_PATHS[this.levelIndex]);
        this.movement = new MovementSystem(this.level);
        this.movement.syncDoors();
        this.broadcastState();
    }

    private sendInit(ctx: ClientContext) {
        const message: ServerMessage = {
            type: "init",
            payload: {
                you: ctx.playerIndex,
                levelIndex: this.levelIndex,
                state: serializeLevelState(this.level),
                slots: this.slotSummary(),
            },
        };
        safeSend(ctx.socket, message);
    }

    private broadcastState() {
        const message: ServerMessage = {
            type: "state",
            payload: {
                levelIndex: this.levelIndex,
                state: serializeLevelState(this.level),
            },
        };
        this.broadcast(message);
    }

    private broadcastSlots() {
        const message: ServerMessage = {
            type: "slots",
            payload: {
                slots: this.slotSummary(),
            },
        };
        this.broadcast(message);
    }

    private broadcast(message: ServerMessage) {
        const payload = JSON.stringify(message);
        for (const client of this.clients) {
            if (client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(payload);
            }
        }
    }

    private sendError(ctx: ClientContext, message: string) {
        safeSend(ctx.socket, { type: "error", payload: { message } } satisfies ServerMessage);
    }

    private slotSummary(): PlayerSlotSummary[] {
        return this.playerSlots.map((ctx, index) => ({
            index: index as PlayerIndex,
            occupied: ctx !== null,
        }));
    }

    private firstAvailableSlot(): PlayerIndex | null {
        const index = this.playerSlots.findIndex(ctx => ctx === null);
        return index === -1 ? null : (index as PlayerIndex);
    }

    hasClients(): boolean {
        return this.clients.size > 0;
    }
}

const rooms = new Map<string, GameRoom>();

async function getOrCreateRoom(id: string): Promise<GameRoom> {
    let room = rooms.get(id);
    if (room) {
        await room.initialize();
        return room;
    }
    room = new GameRoom(id);
    await room.initialize();
    rooms.set(id, room);
    return room;
}

function resolveExistingDir(candidates: string[]): string {
    for (const dir of candidates) {
        if (existsSync(dir)) return dir;
    }
    return candidates[candidates.length - 1];
}

async function loadLevelFromFile(filePath: string): Promise<LevelState> {
    const content = await readFile(filePath, "utf-8");
    const json = JSON.parse(content);
    return buildLevelFromJson(json);
}

function isLevelCompleted(level: LevelState): boolean {
    const golden = level.plates.find(plate => plate instanceof GoldenPlate) as GoldenPlate | undefined;
    return !!golden?.isActive;
}

function safeSend(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(message));
}

function parseClientMessage(data: RawData): ClientMessage | null {
    const text = typeof data === "string"
        ? data
        : data instanceof ArrayBuffer
            ? new TextDecoder().decode(data)
            : data instanceof Uint8Array
                ? new TextDecoder().decode(data)
                : data && typeof (data as any).toString === "function"
                    ? (data as any).toString()
                    : null;
    if (!text) {
        console.error("Données client intraduisibles", data);
        return null;
    }
    try {
        return JSON.parse(text) as ClientMessage;
    } catch (err) {
        console.error("Message client invalide", err);
        return null;
    }
}

const certPath = process.env.TLS_CERT_PATH;
const keyPath = process.env.TLS_KEY_PATH;
const useTls = !!(certPath && keyPath);

const server = useTls
    ? createHttpsServer({
        cert: readFileSync(certPath!),
        key: readFileSync(keyPath!),
    })
    : createHttpServer();

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
    const { searchParams } = new URL(req.url ?? "/", "https://localhost");
    const gameId = searchParams.get("game") ?? "default";
    const context: ClientContext = { socket, playerIndex: null };

    void (async () => {
        const room = await getOrCreateRoom(gameId);
        room.addClient(context);

        socket.on("message", data => {
            const message = parseClientMessage(data);
            if (!message) return;
            switch (message.type) {
                case "join":
                    room.join(context, message.payload?.desired ?? null);
                    break;
                case "move":
                    room.handleMove(context, message.payload);
                    break;
                default:
                    break;
            }
        });

        socket.on("close", () => {
            room.removeClient(context);
            if (!room.hasClients()) {
                rooms.delete(gameId);
            }
        });
    })().catch(err => {
        console.error("Erreur lors de la connexion au salon", err);
        safeSend(socket, { type: "error", payload: { message: "Impossible de rejoindre la partie" } } satisfies ServerMessage);
        socket.close();
    });
});

const port = Number(process.env.PORT ?? (useTls ? 443 : 8080));

server.listen(port, () => {
    const protocol = useTls ? "wss" : "ws";
    console.log(`PuzzleGame serveur ${protocol} prêt sur port ${port}`);
});
