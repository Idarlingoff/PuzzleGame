import { Display } from "./Display.js";
import { keyToMoveP1, keyToMoveP2, type Move, type PlayerIndex } from "./core/systems/MovementSystem.js";
import type { SerializedLevelState } from "./core/network/serialization.js";
import type {
    ClientToServerEvents,
    PlayerSlotSummary,
    ServerInitPayload,
    ServerStatePayload,
    ServerToClientEvents,
} from "./core/network/messages.js";
import type { Color } from "./core/enum/ColorEnum.js";
import type { Shape } from "./core/enum/ShapeEnum.js";
import type { Socket } from "socket.io-client";

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
    private socket?: Socket<ServerToClientEvents, ClientToServerEvents>;
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
        const { url, path } = this.resolveServerEndpoint();
        this.socket = io<ServerToClientEvents, ClientToServerEvents>(url, {
            path,
            transports: ["websocket"],
        });

        this.socket.on("connect", () => {
            this.socket?.emit("join");
        });

        this.socket.on("init", payload => this.applyInit(payload));
        this.socket.on("state", payload => this.applyState(payload));
        this.socket.on("slots", payload => this.applySlots(payload.slots));
        this.socket.on("error", payload => {
            console.error("Serveur:", payload.message);
        });

        this.socket.on("disconnect", () => {
            this.socket = undefined;
            console.warn("Connexion fermée, tentative de reconnexion dans 3s");
            setTimeout(() => this.connect(), 3000);
        });

        this.socket.on("connect_error", err => {
            console.error("Erreur Socket.IO", err);
        });
    }

    private resolveServerEndpoint(): { url: string; path: string } {
        const explicit = (window as any).__PUZZLE_WS__ as string | undefined;
        if (explicit) {
            try {
                const parsed = new URL(explicit, window.location.href);
                const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/ws";
                parsed.pathname = "";
                parsed.search = "";
                parsed.hash = "";
                const base = parsed.toString().replace(/\/$/, "");
                return { url: base, path };
            } catch {
                return { url: explicit, path: "/ws" };
            }
        }
        const { protocol, host } = window.location;
        const base = host ? `${protocol}//${host}` : `${protocol === "https:" ? "https:" : "http:"}//localhost:8080`;
        return { url: base, path: "/ws" };
    }

    private applyInit(payload: ServerInitPayload) {
        this.playerIndex = payload.you;
        this.levelIndex = payload.levelIndex;
        this.level = payload.state;
        this.ensureDisplay();
        this.render();
        this.updateScore();
        this.applySlots(payload.slots);
    }

    private applyState(payload: ServerStatePayload) {
        this.levelIndex = payload.levelIndex;
        this.level = payload.state;
        this.ensureDisplay();
        this.render();
        this.updateScore();
    }

    private applySlots(slots: PlayerSlotSummary[]) {
        const available = slots.filter(slot => !slot.occupied).map(slot => slot.index);
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
        if (!this.socket || !this.socket.connected) return;
        if (this.playerIndex === null) return;
        const move = this.resolveMove(event.key);
        if (!move) return;
        this.socket.emit("move", move);
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

}

new PuzzleGameClient();
export {};