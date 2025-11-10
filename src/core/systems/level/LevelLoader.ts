import { Player } from "../../players/Player.js";
import { GoldenPlate } from "../../plates/GoldenPlate.js";
import { PressurePlate } from "../../plates/PressurePlate.js";
import { Plate } from "../../plates/Plate.js";
import { Door } from "../../Door.js";
import { Wall } from "../../Wall.js";
import { Color } from "../../enum/ColorEnum.js";
import { Shape } from "../../enum/ShapeEnum.js";

export type LevelState = {
    width: number;
    height: number;
    walls: Wall[];
    doors: Door[];
    plates: Plate[];
    players: [Player, Player];
};

// ---- helpers
const key = (x: number, y: number) => `${x},${y}`;

function colorFromId(id: number): Color {
    switch (id) {
        case 0: return Color.RED;
        case 1: return Color.BLUE;
        case 2: return Color.GREEN;
        case 3: return Color.PURPLE;
        case 4: return Color.CYAN;
        case 5: return Color.YELLOW;
        default: return Color.RED;
    }
}

export function buildLevelFromJson(json: any): LevelState {
    const [w, h] = json.Size as [number, number];

    // Murs
    const walls: Wall[] = [];
    for (const [x, y] of json.Walls as Array<[number, number]>) {
        const wall = new Wall(x, y);
        walls.push(wall);
    }

    // Portes
    const doors: Door[] = [];
    for (const [x, y, colorId] of (json.Doors as Array<[number, number, number]> ?? [])) {
        const color = colorFromId(colorId);
        const door = new Door(x, y, false, color);
        doors.push(door);
    }

    // Plaques
    const plates: Plate[] = [];

    // Plaque d'arrivée (dorée)
    if (Array.isArray(json.EndPlates) && json.EndPlates.length === 2) {
        const [gx, gy] = json.EndPlates as [number, number];
        const golden = new GoldenPlate(gx, gy);
        plates.push(golden);
    } else {
        console.warn("EndPlates manquant ou invalide dans le JSON du niveau.");
    }

    // Plaques de pression
    for (const [x, y, colorId] of (json.PressurePlates as Array<[number, number, number]> ?? [])) {
        const color = colorFromId(colorId);
        const plate = new PressurePlate(x, y, color);
        plates.push(plate);
    }

    // Joueurs
    const [p1start, p2start] = json.PlayersStart as [[number, number], [number, number]];
    const p1 = new Player(1, p1start[0], p1start[1], Color.BLUE, Shape.CIRCLE);
    const p2 = new Player(2, p2start[0], p2start[1], Color.RED, Shape.CIRCLE);

    return {
        width: w,
        height: h,
        walls,
        doors,
        plates,
        players: [p1, p2],
    };
}

export async function loadLevelFromUrl(url: string): Promise<LevelState> {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Impossible de charger ${url} (${resp.status})`);
    const data = await resp.json();
    return buildLevelFromJson(data);
}
