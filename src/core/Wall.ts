import { Point } from "../Point.ts";
import { Color } from "./enum/ColorEnum.ts";
import { Shape } from "./enum/ShapeEnum.ts";

export class Wall extends Point {

    constructor (x: number, y:number){
        super(x, y, Color.BLACK, Shape.SQUARE );
    }
}