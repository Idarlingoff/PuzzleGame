import { Display } from "./Display.js";
import { MovementSystem } from "./core/systems/MovementSystem.js";
import { LevelManager } from "./core/systems/level/LevelManager.js";

const LEVEL_URLS: string[] = [
    "./dist/assets/json/level0.json",
    "./dist/assets/json/level1.json",
    "./dist/assets/json/level2.json",
    "./dist/assets/json/level3.json",
    "./dist/assets/json/level4.json",
    "./dist/assets/json/level5.json",
];

class PuzzleGameTest {
    private display?: Display;
    private movement?: MovementSystem;
    private manager: LevelManager;

    constructor() {
        this.manager = new LevelManager(LEVEL_URLS);
        this.init().catch(err => console.error(err));
    }

    private async init() {
        const level = await this.manager.load(0);

        this.display = new Display(level.width, level.height, 32);

        this.render();

        this.movement = new MovementSystem(level, async () => {
            this.render();

            if (this.manager.isCompleted()) {
                console.log(`Niveau ${this.manager.levelIndex} terminé !`);
                await this.loadNextLevel();
            }
        });

        this.movement.start();
    }

    private async loadNextLevel() {
        this.movement?.stop();

        const level = await this.manager.next();

        this.movement = new MovementSystem(level, async () => {
            this.render();
            if (this.manager.isCompleted()) {
                console.log(`Niveau ${this.manager.levelIndex} terminé !`);
                await this.loadNextLevel();
            }
        });

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
    }
}

new PuzzleGameTest();
export {};