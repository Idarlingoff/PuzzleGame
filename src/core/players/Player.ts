import {Point} from "../../Point.js";
import {Color} from "../enum/ColorEnum.js";
import {Shape} from "../enum/ShapeEnum.js";

export class Player extends Point {
    private readonly _id: 1 | 2;

    constructor(id: 1 | 2, x: number, y: number, color: Color, shape: Shape = Shape.CIRCLE) {
        super(x, y, color, shape);
        this._id = id;
    }

    wantMove(dx: number, dy: number): { x: number; y: number } {
        return {
            x: this.coordonneesX + dx,
            y: this.coordonneesY + dy,
        };
    }

    applyMove(x: number, y: number): void {
        this.coordonneesX = x;
        this.coordonneesY = y;
    }

    teleportTo(x: number, y: number): void {
        this.coordonneesX = x;
        this.coordonneesY = y;
    }

    isAt(x: number, y: number): boolean {
        return this.coordonneesX === x && this.coordonneesY === y;
    }

    // ### GETTER - SETTER ### //
    get id(): 1 | 2 {
        return this._id;
    }

    get position(): { x: number; y: number } {
        return { x: this.coordonneesX, y: this.coordonneesY };
    }
}
