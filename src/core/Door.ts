import { Point } from "../Point";
import { Color } from "../core/enum/ColorEnum";
import { Shape } from "../core/enum/ShapeEnum";

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