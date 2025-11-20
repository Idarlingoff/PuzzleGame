import { Point } from "../Point.ts";
import { Color } from "./enum/ColorEnum.ts";
import { Shape } from "./enum/ShapeEnum.ts";

export class Door extends Point {
    public open: boolean;
    
    constructor(x: number, y:number, open:boolean = false, color: Color){
        super(x, y, color, Shape.SQUARE);
        this.open = open;
    }

    toogle() :void {
        this.open = !this.open;
    }

    isBlocking() : boolean {
        return !this.open;
    }
}