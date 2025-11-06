import { Point } from "../Point";
import { Color } from "./enum/ColorEnum";
import { Shape } from "./enum/ShapeEnum";

export class Wall extends Point {

    constructor (x: number, y:number){
        super(x, y, Color.BLACK, Shape.SQUARE );
    }
}