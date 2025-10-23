import {Color} from "./core/enum/ColorEnum.js";
import {Point} from "./Point.js";
import {Plate} from "./core/plates/Plate.js";
import {Drawer} from "./Drawer.js";
import {GoldenPlate} from "./core/plates/GoldenPlate.js";
import {Shape} from "./core/enum/ShapeEnum.js";


export interface DrawableDoor {
    x: number;
    y: number;
    color: Color;
    open: boolean;
}

export interface DrawableWall {
    x: number;
    y: number;
}

export type DrawablePlayer = Point;

export type DrawablePlate = Plate;

export class Display {
    private drawer: Drawer;

    /**
     * @param gridWidth  largeur de la grille en cases
     * @param gridHeight hauteur de la grille en cases
     * @param scale      taille d’une case (pixels par case) - dépend de ton Drawer
     */
    constructor(gridWidth: number, gridHeight: number, scale = 32) {
        this.drawer = new Drawer(gridWidth, gridHeight, scale);
    }

    clear(): void {
        this.drawer.clear();
    }

    render(params: {
        walls?: DrawableWall[] | Set<string>;
        doors?: DrawableDoor[];
        plates?: DrawablePlate[];
        players?: DrawablePlayer[];
    }): void {
        const { walls, doors, plates, players } = params;
        this.clear();

        if (walls) this.drawWalls(walls);
        if (doors) this.drawDoors(doors);
        if (plates) this.drawPlates(plates);
        if (players) this.drawPlayers(players);
    }

    drawWalls(walls: DrawableWall[] | Set<string>): void {
        if (walls instanceof Set) {
            // format Set "x,y"
            for (const key of walls) {
                const [x, y] = key.split(",").map(Number);
                this.drawer.drawRectangle(x, y, "#333333", 1);
            }
        } else {
            for (const w of walls) {
                this.drawer.drawRectangle(w.x, w.y, "#333333", 1);
            }
        }
    }

    drawDoors(doors: DrawableDoor[]): void {
        for (const d of doors) {
            const base = colorToHex(d.color);
            const color = d.open ? withAlpha(base, 0.25) : base;
            this.drawer.drawRectangle(d.x, d.y, color, 1);
        }
    }

    drawPlates(plates: DrawablePlate[]): void {
        for (const p of plates) {
            const base = p instanceof GoldenPlate ? colorToHex(Color.GOLD) : colorToHex(p.color);
            const active = p.isActive;
            const color = active ? lighten(base, 0.35) : base;

            const size = 0.8;

            switch (p.shape) {
                case Shape.CIRCLE:
                    this.drawer.drawCircle(p.coordonneesX, p.coordonneesY, color, size);
                    break;
                case Shape.SQUARE:
                    this.drawer.drawRectangle(p.coordonneesX, p.coordonneesY, color, size);
                    break;
                case Shape.DIAMOND:
                    this.drawer.drawDiamond(p.coordonneesX, p.coordonneesY, color, size);
                    break;
                default:
                    this.drawer.drawRectangle(p.coordonneesX, p.coordonneesY, color, size);
            }
        }
    }

    drawPlayers(players: DrawablePlayer[]): void {
        for (const pl of players) {
            const color = colorToHex(pl.color);
            const size = 0.7;
            switch (pl.shape) {
                case Shape.CIRCLE:
                    this.drawer.drawCircle(pl.coordonneesX, pl.coordonneesY, color, size);
                    break;
                case Shape.SQUARE:
                    this.drawer.drawRectangle(pl.coordonneesX, pl.coordonneesY, color, size);
                    break;
                case Shape.DIAMOND:
                    this.drawer.drawDiamond(pl.coordonneesX, pl.coordonneesY, color, size);
                    break;
                default:
                    this.drawer.drawCircle(pl.coordonneesX, pl.coordonneesY, color, size);
            }
        }
    }
}

/* ------------------------------ Helpers couleurs ------------------------------ */

function colorToHex(c: Color): string {
    switch (c) {
        case Color.GOLD:   return "#F1C40F";
        case Color.RED:    return "#E74C3C";
        case Color.GREEN:  return "#27AE60";
        case Color.BLUE:   return "#2980B9";
        case Color.YELLOW: return "#F4D03F";
        case Color.PURPLE: return "#8E44AD";
        case Color.CYAN:   return "#16A085";
        case Color.BLACK:  return "#2C3E50";
        case Color.WHITE:  return "#ECF0F1";
        default:           return "#7f8c8d";
    }
}

function lighten(hex: string, amount = 0.25) {
    const [r, g, b] = hexToRgb(hex);
    const lr = Math.round(r + (255 - r) * amount);
    const lg = Math.round(g + (255 - g) * amount);
    const lb = Math.round(b + (255 - b) * amount);
    return `rgb(${lr},${lg},${lb})`;
}

function withAlpha(hex: string, alpha = 0.3) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): [number, number, number] {
    const c = hex.replace("#", "");
    const n = parseInt(c, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
