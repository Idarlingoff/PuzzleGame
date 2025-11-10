import type { Color } from "../enum/ColorEnum.js";
import type { Shape } from "../enum/ShapeEnum.js";
import type { LevelState } from "../systems/MovementSystem.js";
import type { Move } from "../systems/MovementSystem.js";
import type { Plate } from "../plates/Plate.js";

export type SerializedDoor = {
    x: number;
    y: number;
    color: Color;
    open: boolean;
};

export type SerializedPlate = {
    x: number;
    y: number;
    color: Color;
    shape: Shape;
    kind: "golden" | "pressure";
    isActive: boolean;
};

export type SerializedPlayer = {
    id: 1 | 2;
    x: number;
    y: number;
    color: Color;
    shape: Shape;
};

export type SerializedLevelState = {
    width: number;
    height: number;
    walls: Array<{ x: number; y: number }>;
    doors: SerializedDoor[];
    plates: SerializedPlate[];
    players: SerializedPlayer[];
};

export type SerializedMove = Move;

export function serializeLevelState(state: LevelState): SerializedLevelState {
    return {
        width: state.width,
        height: state.height,
        walls: state.walls.map(w => ({ x: w.coordonneesX, y: w.coordonneesY })),
        doors: state.doors.map(d => ({
            x: d.coordonneesX,
            y: d.coordonneesY,
            color: d.color,
            open: d.open,
        })),
        plates: state.plates.map(serializePlate),
        players: state.players.map(p => ({
            id: p.id,
            x: p.coordonneesX,
            y: p.coordonneesY,
            color: p.color,
            shape: p.shape,
        })),
    };
}

function serializePlate(plate: Plate): SerializedPlate {
    const kind = (plate as any).kind ?? "pressure";
    return {
        x: plate.coordonneesX,
        y: plate.coordonneesY,
        color: plate.color,
        shape: plate.shape,
        kind,
        isActive: plate.isActive,
    };
}
