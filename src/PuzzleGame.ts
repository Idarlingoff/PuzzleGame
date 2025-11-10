import { Display } from "./Display.js";
import { keyToMoveP1, keyToMoveP2, type Move, type PlayerIndex } from "./core/systems/MovementSystem.js";
import type { SerializedLevelState } from "./core/network/serialization.js";
import type { ClientMessage, ServerMessage, ServerInitMessage, ServerStateMessage, ServerSlotsMessage } from "./core/network/messages.js";
import type { Color } from "./core/enum/ColorEnum.js";
import type { Shape } from "./core/enum/ShapeEnum.js";

type DrawableDoorLike = {
    coordonneesX: number;
    coordonneesY: number;
    color: Color;
    open: boolean;
};

type DrawablePlateLike = {
    coordonneesX: number;
    coordonneesY: number;
    color: Color;
    shape: Shape;
    kind: "golden" | "pressure";
    isActive: boolean;
};

type DrawablePlayerLike = {
    coordonneesX: number;
    coordonneesY: number;
    color: Color;
    shape: Shape;
};

class PuzzleGameClient {
    private display?: Display;
    private socket?: WebSocket;
    private playerIndex: PlayerIndex | null = null;
    private level?: SerializedLevelState;
    private levelIndex = 0;
    private readonly scoreEl: HTMLElement | null;
    private gridWidth?: number;
    private gridHeight?: number;

    constructor() {
        this.scoreEl = document.getElementById("score");
        window.addEventListener("keydown", this.handleKey);
        this.connect();
    }

    private connect() {
        const url = this.resolveWebSocketUrl();
        this.socket = new WebSocket(url);

        this.socket.addEventListener("open", () => {
            this.send({ type: "join" });
        });

        this.socket.addEventListener("message", event => {
            const message = this.parseMessage(event.data);
            if (!message) return;
            this.handleServerMessage(message);
        });

        this.socket.addEventListener("close", () => {
            this.socket = undefined;
            console.warn("Connexion fermée, tentative de reconnexion dans 3s");
            setTimeout(() => this.connect(), 3000);
        });

        this.socket.addEventListener("error", err => {
            console.error("Erreur WebSocket", err);
        });
    }

    private resolveWebSocketUrl(): string {
        const explicit = (window as any).__PUZZLE_WS__ as string | undefined;
        if (explicit) return explicit;
        const { protocol, host } = window.location;
        const scheme = protocol === "https:" ? "wss" : "ws";
        if (host) {
            return `${scheme}://${host}/ws`;
        }
        return `${scheme}://localhost:8080/ws`;
    }

    private handleServerMessage(message: ServerMessage) {
        switch (message.type) {
            case "init":
                this.applyInit(message);
                break;
            case "state":
                this.applyState(message);
                break;
            case "slots":
                this.applySlots(message);
                break;
            case "error":
                console.error("Serveur:", message.payload.message);
                break;
            default:
                break;
        }
    }

    private applyInit(message: ServerInitMessage) {
        this.playerIndex = message.payload.you;
        this.levelIndex = message.payload.levelIndex;
        this.level = message.payload.state;
        this.ensureDisplay();
        this.render();
        this.updateScore();
        this.applySlots(message);
    }

    private applyState(message: ServerStateMessage) {
        this.levelIndex = message.payload.levelIndex;
        this.level = message.payload.state;
        this.ensureDisplay();
        this.render();
        this.updateScore();
    }

    private applySlots(message: ServerInitMessage | ServerSlotsMessage) {
        const available = message.payload.slots.filter(slot => !slot.occupied).map(slot => slot.index);
        if (available.length === 0) {
            console.info("Toutes les places joueurs sont occupées");
        } else {
            console.info("Places disponibles:", available.join(", "));
        }
    }

    private ensureDisplay() {
        if (!this.level) return;
        if (!this.display || this.gridWidth !== this.level.width || this.gridHeight !== this.level.height) {
            this.display = new Display(this.level.width, this.level.height, 32);
            this.gridWidth = this.level.width;
            this.gridHeight = this.level.height;
        }
    }

    private render() {
        if (!this.display || !this.level) return;
        const walls = new Set(this.level.walls.map(w => `${w.x},${w.y}`));
        const doors: DrawableDoorLike[] = this.level.doors.map(d => ({
            coordonneesX: d.x,
            coordonneesY: d.y,
            color: d.color,
            open: d.open,
        }));
        const plates: DrawablePlateLike[] = this.level.plates.map(p => ({
            coordonneesX: p.x,
            coordonneesY: p.y,
            color: p.color,
            shape: p.shape,
            kind: p.kind,
            isActive: p.isActive,
        }));
        const players: DrawablePlayerLike[] = this.level.players.map(p => ({
            coordonneesX: p.x,
            coordonneesY: p.y,
            color: p.color,
            shape: p.shape,
        }));

        this.display.render({
            walls,
            doors: doors as any,
            plates: plates as any,
            players: players as any,
        });
    }

    private updateScore() {
        if (!this.scoreEl) return;
        this.scoreEl.textContent = (this.levelIndex + 1).toString();
    }

    private handleKey = (event: KeyboardEvent) => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        if (this.playerIndex === null) return;
        const move = this.resolveMove(event.key);
        if (!move) return;
        const message: ClientMessage = { type: "move", payload: move };
        this.send(message);
    };

    private resolveMove(key: string): Move | null {
        if (this.playerIndex === 0) {
            return keyToMoveP1[key] ?? null;
        }
        if (this.playerIndex === 1) {
            return keyToMoveP2[key] ?? null;
        }
        return null;
    }

    private send(message: ClientMessage) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify(message));
    }

    private parseMessage(data: unknown): ServerMessage | null {
        const text = typeof data === "string"
            ? data
            : data instanceof ArrayBuffer
                ? new TextDecoder().decode(data)
                : data instanceof Uint8Array
                    ? new TextDecoder().decode(data)
                    : typeof data === "object" && data !== null && "toString" in data
                        ? (data as any).toString()
                        : null;
        if (!text) {
            console.warn("Type de message inattendu", data);
            return null;
        }
        try {
            return JSON.parse(text) as ServerMessage;
        } catch (err) {
            console.error("Message serveur invalide", err);
            return null;
        }
    }
}

new PuzzleGameClient();
export {};