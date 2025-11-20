import { Display } from "./Display.ts";
import { MovementSystem } from "./core/systems/MovementSystem.ts";
import { LevelManager } from "./core/systems/level/LevelManager.ts";
import type { Socket } from "socket.io-client";

// Obtenir le serveur HTTP à partir de l'URL actuelle
const getServerURL = () => {
    if (typeof window === 'undefined') {
        return "http://localhost:8080";
    }
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? "http://localhost:8080"
        : `http://${window.location.hostname}:8080`;
};

const BASE_URL = getServerURL();

const LEVEL_URLS: string[] = [
    `${BASE_URL}/assets/json/level0.json`,
    `${BASE_URL}/assets/json/level1.json`,
    `${BASE_URL}/assets/json/level2.json`,
    `${BASE_URL}/assets/json/level3.json`,
    `${BASE_URL}/assets/json/level4.json`,
    `${BASE_URL}/assets/json/level5.json`,
];

export class PuzzleGame {
    private display?: Display;
    private movement?: MovementSystem;
    private manager: LevelManager;
    private localPlayerIndex: number | null;
    private socket: Socket;

    constructor(socket: Socket, localPlayerIndex?: number) {
        this.socket = socket;
        this.manager = new LevelManager(LEVEL_URLS);
        this.localPlayerIndex = localPlayerIndex !== undefined ? localPlayerIndex : null;
        this.init().catch(err => console.error(err));
    }

    private async init() {
        const level = await this.manager.load(0);

        this.display = new Display(level.width, level.height, 32);

        this.render();

        this.movement = new MovementSystem(level, async (playerIndex: number) => {
            this.render();

            // Envoyer le mouvement au serveur UNIQUEMENT si c'est le joueur local
            if (this.localPlayerIndex === playerIndex) {
                const player = level.players[playerIndex];
                this.socket.emit("playerMove", {
                    playerIndex: playerIndex,
                    x: player.coordonneesX,
                    y: player.coordonneesY
                });
            }

            if (this.manager.isCompleted()) {
                console.log(`Niveau ${this.manager.levelIndex} terminé !`);
                this.socket.emit("levelCompleted", { levelIndex: this.manager.levelIndex });
            }
        }, this.localPlayerIndex !== null ? this.localPlayerIndex : undefined);

        this.movement.start();
    }

    private async loadNextLevel() {
        this.movement?.stop();

        const level = await this.manager.next();

        this.movement = new MovementSystem(level, async (playerIndex: number) => {
            this.render();

            // Envoyer le mouvement au serveur UNIQUEMENT si c'est le joueur local
            if (this.localPlayerIndex === playerIndex) {
                const player = level.players[playerIndex];
                this.socket.emit("playerMove", {
                    playerIndex: playerIndex,
                    x: player.coordonneesX,
                    y: player.coordonneesY
                });
            }

            if (this.manager.isCompleted()) {
                console.log(`Niveau ${this.manager.levelIndex} terminé !`);
                this.socket.emit("levelCompleted", { levelIndex: this.manager.levelIndex });
            }
        }, this.localPlayerIndex !== null ? this.localPlayerIndex : undefined);

        if (!this.display || (this.display as any).resize) {
            this.display = new Display(level.width, level.height, 32);
        }

        this.render();
        this.movement.start();
    }

    private render() {
        if (!this.display || !this.manager.level) return;
        const lvl = this.manager.level;
        this.display.render({
            walls: lvl.walls,
            doors: lvl.doors,
            plates: lvl.plates,
            players: lvl.players
        });

        const levelIndex = this.manager.levelIndex;
        const scoreElement = document.getElementById("score");
        if (scoreElement) {
            scoreElement.textContent = `${levelIndex}`;
        }
    }

    applyRemotePlayerMove(playerIndex: number, x: number, y: number) {
        if (!this.manager.level) return;
        const player = this.manager.level.players[playerIndex];
        if (player) {
            // Gérer les plaques : quitter l'ancienne position
            const oldPos = this.getPlateAt(player.coordonneesX, player.coordonneesY);
            if (oldPos) oldPos.onPlayerLeave();

            // Appliquer le nouveau mouvement
            player.applyMove(x, y);

            // Gérer les plaques : entrer la nouvelle position
            const newPos = this.getPlateAt(x, y);
            if (newPos) newPos.onPlayerEnter();

            this.render();
        }
    }

    async loadNextLevelRemote() {
        console.log("Serveur demande le passage au niveau suivant");
        await this.loadNextLevel();
    }

    async loadSpecificLevel(levelIndex: number) {
        console.log(`Chargement du niveau ${levelIndex}`);
        this.movement?.stop();
        const level = await this.manager.load(levelIndex);

        this.movement = new MovementSystem(level, async (playerIndex: number) => {
            this.render();

            // Envoyer le mouvement au serveur UNIQUEMENT si c'est le joueur local
            if (this.localPlayerIndex === playerIndex) {
                const player = level.players[playerIndex];
                this.socket.emit("playerMove", {
                    playerIndex: playerIndex,
                    x: player.coordonneesX,
                    y: player.coordonneesY
                });
            }

            if (this.manager.isCompleted()) {
                console.log(`Niveau ${this.manager.levelIndex} terminé !`);
                this.socket.emit("levelCompleted", { levelIndex: this.manager.levelIndex });
            }
        }, this.localPlayerIndex !== null ? this.localPlayerIndex : undefined);

        if (!this.display || (this.display as any).resize) {
            this.display = new Display(level.width, level.height, 32);
        }

        this.render();
        this.movement.start();
    }

    private getPlateAt(x: number, y: number) {
        if (!this.manager.level) return undefined;
        return this.manager.level.plates.find(p => p.coordonneesX === x && p.coordonneesY === y);
    }
}
export {};