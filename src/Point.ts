import {Color} from "./core/enum/ColorEnum.js";
import {Shape} from "./core/enum/ShapeEnum.js";

export class Point {

    private _coordonneesX : number;
    private _coordonneesY : number;
    private _color : Color;
    private _shape : Shape;

    constructor(x: number, y: number, color: Color, shape: Shape) {
        this._coordonneesX = x;
        this._coordonneesY = y;
        this._color = color;
        this._shape = shape;
    }

    // ### GETTER - SETTER ### //
    get coordonneesX(): number {
        return this._coordonneesX;
    }

    set coordonneesX(value: number) {
        this._coordonneesX = value;
    }

    get coordonneesY(): number {
        return this._coordonneesY;
    }

    set coordonneesY(value: number) {
        this._coordonneesY = value;
    }

    get color(): Color {
        return this._color;
    }

    set color(value: Color) {
        this._color = value;
    }

    get shape(): Shape {
        return this._shape;
    }
}
