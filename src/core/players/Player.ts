import {Point} from "../../Point.ts";
import {Color} from "../enum/ColorEnum.ts";
import {Shape} from "../enum/ShapeEnum.ts";

export class Player extends Point {
    private readonly _id: 1 | 2;

    constructor(id: 1 | 2, x: number, y: number, color: Color, shape: Shape = Shape.CIRCLE) {
        super(x, y, color, shape);
        this._id = id;
    }

    applyMove(x: number, y: number): void {
        this.coordonneesX = x;
        this.coordonneesY = y;
    }

    // ### GETTER - SETTER ### //
    get id(): 1 | 2 {
        return this._id;
    }

    get position(): { x: number; y: number } {
        return { x: this.coordonneesX, y: this.coordonneesY };
    }
}
