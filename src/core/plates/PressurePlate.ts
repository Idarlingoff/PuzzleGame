import { Plate } from "./Plate.js";
import { Color } from "../enum/ColorEnum.js";
import { Shape } from "../enum/ShapeEnum.js";

export class PressurePlate extends Plate {

    private _linkedDoorId?: string;

    constructor(x: number, y: number, color: Color, linkedDoorId?: string) {
        super(x, y, color, Shape.SQUARE);
        this._linkedDoorId = linkedDoorId;
    }

    override onPlayerEnter(): void {
        super.onPlayerEnter();
    }

    override onPlayerLeave(): void {
        super.onPlayerLeave();
    }

    // ### GETTER - SETTER ### //
    get kind(): "golden" | "pressure" {
        return "pressure";
    }
}
