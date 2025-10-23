import { Plate } from "./Plate.js";
import { Color } from "../enum/ColorEnum.js";
import { Shape } from "../enum/ShapeEnum.js";

export class GoldenPlate extends Plate {

    constructor(x: number, y: number) {
        super(x, y, Color.GOLD, Shape.CIRCLE);
    }

    override onPlayerEnter(): void {
        this._occupancy++;
        if (this._occupancy >= 2) {
            this._isActive = true;
            console.log("Les deux joueurs sont sur la plaque dorée !");
        } else {
            this._isActive = false;
            console.log("Un joueur est sur la plaque dorée (en attente du second)");
        }
    }

    override onPlayerLeave(): void {
        this._occupancy = Math.max(0, this._occupancy - 1);
        if (this._occupancy < 2) {
            if (this._isActive) console.log("La plaque dorée se désactive.");
            this._isActive = false;
        }
    }

    // ### GETTER - SETTER ### //
    get kind(): "golden" | "pressure" {
        return "golden";
    }
}
