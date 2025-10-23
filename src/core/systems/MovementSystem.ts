import { Player } from "../players/Player";
import { Plate } from "../plates/Plate.js";
import { GoldenPlate } from "../plates/GoldenPlate.js";
import { PressurePlate } from "../plates/PressurePlate.js";
import { Color } from "../enum/ColorEnum.js";

export type Door = { x: number; y: number; color: Color; open: boolean };

export type LevelState = {
    width: number;
    height: number;
    walls: Set<string>;
    doors: Door[];
    plates: Plate[];
    players: [Player, Player];
};

type Move = { dx: number; dy: number };

const keyToMoveP1: Record<string, Move> = {
    z: { dx: 0, dy: -1 }, Z: { dx: 0, dy: -1 }, w: { dx: 0, dy: -1 }, W: { dx: 0, dy: -1 },
    s: { dx: 0, dy: 1 },  S: { dx: 0, dy: 1 },
    q: { dx: -1, dy: 0 }, Q: { dx: -1, dy: 0 }, a: { dx: -1, dy: 0 }, A: { dx: -1, dy: 0 },
    d: { dx: 1, dy: 0 },  D: { dx: 1, dy: 0 },
};

const keyToMoveP2: Record<string, Move> = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 },
};

export class MovementSystem {
    private state: LevelState;
    private onChange?: () => void;
    private keydown = (e: KeyboardEvent) => this.handleKey(e);

    constructor(state: LevelState, onChange?: () => void) {
        this.state = state;
        this.onChange = onChange;
    }

    start() {
        window.addEventListener("keydown", this.keydown);
        this.refreshDoors();
    }

    stop() {
        window.removeEventListener("keydown", this.keydown);
    }

    private handleKey(e: KeyboardEvent) {
        const m1 = keyToMoveP1[e.key];
        const m2 = keyToMoveP2[e.key];

        let moved = false;

        if (m1) moved = this.tryMove(0, m1) || moved;
        if (m2) moved = this.tryMove(1, m2) || moved;

        if (moved) {
            this.refreshDoors();
            this.onChange?.();
        }
    }

    private tryMove(index: 0 | 1, { dx, dy }: Move): boolean {
        const p1 = this.state.players[index];
        const p2 = this.state.players[index === 0 ? 1 : 0];

        const tx = p1.coordonneesX + dx;
        const ty = p1.coordonneesY + dy;

        if (!this.inBounds(tx, ty)) return false;
        if (this.isWall(tx, ty)) return false;
        if (this.isClosedDoor(tx, ty)) return false;

        const golden = this.getGolden();
        const goingToGolden = golden && golden.coordonneesX === tx && golden.coordonneesY === ty;
        if (!goingToGolden && p2.coordonneesX === tx && p2.coordonneesY === ty) return false;

        this.leavePlateIfAny(p1.coordonneesX, p1.coordonneesY);

        p1.applyMove(tx, ty);

        // Gestion plaques: enter nouvelle case
        this.enterPlateIfAny(tx, ty);
        return true;
    }

    private inBounds(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.state.width && y < this.state.height;
    }

    private isWall(x: number, y: number) {
        return this.state.walls.has(`${x},${y}`);
    }

    private isClosedDoor(x: number, y: number) {
        return this.state.doors.some(d => d.x === x && d.y === y && !d.open);
    }

    private getPlateAt(x: number, y: number): Plate | undefined {
        return this.state.plates.find(p => p.coordonneesX === x && p.coordonneesY === y);
    }

    private getGolden(): GoldenPlate | undefined {
        return this.state.plates.find(p => p instanceof GoldenPlate) as GoldenPlate | undefined;
    }

    private leavePlateIfAny(x: number, y: number) {
        const plate = this.getPlateAt(x, y);
        if (plate) plate.onPlayerLeave();
    }

    private enterPlateIfAny(x: number, y: number) {
        const plate = this.getPlateAt(x, y);
        if (plate) plate.onPlayerEnter();
    }

    private refreshDoors() {
        // activeByColor: au moins une plaque de pression active → portes ouvertes
        const activeByColor = new Map<Color, boolean>();
        for (const plate of this.state.plates) {
            if (plate instanceof PressurePlate && plate.isActive) {
                activeByColor.set(plate.color, true);
            }
        }
        for (const door of this.state.doors) {
            door.open = !!activeByColor.get(door.color);
        }
    }
}
