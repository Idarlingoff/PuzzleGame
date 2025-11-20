import { Point } from "../../Point.ts";
import { Color } from "../enum/ColorEnum.ts";
import { Shape } from "../enum/ShapeEnum.ts";

export abstract class Plate extends Point {

    protected _isActive: boolean = false;
    protected _occupancy: number = 0;

    protected constructor(x: number, y: number, color: Color, shape: Shape) {
        super(x, y, color, shape);
    }

    onPlayerEnter(): void {
        this._occupancy++;
        if (this._occupancy > 0) {
            this._isActive = true;
        }
    }

    onPlayerLeave(): void {
        this._occupancy = Math.max(0, this._occupancy - 1);
        if (this._occupancy === 0) {
            this._isActive = false;
        }
    }

    // ### GETTER - SETTER ### //
    abstract get kind(): "golden" | "pressure";

    get isActive(): boolean {
        return this._isActive;
    }
}
