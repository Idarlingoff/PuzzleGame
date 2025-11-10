import type { SerializedLevelState, SerializedMove } from "./serialization.js";
import type { PlayerIndex } from "../systems/MovementSystem.js";

export type ClientMessage =
    | { type: "join"; payload?: { desired?: PlayerIndex | null } }
    | { type: "move"; payload: SerializedMove };

export type ServerInitMessage = {
    type: "init";
    payload: {
        you: PlayerIndex | null;
        levelIndex: number;
        state: SerializedLevelState;
        slots: PlayerSlotSummary[];
    };
};

export type ServerStateMessage = {
    type: "state";
    payload: {
        levelIndex: number;
        state: SerializedLevelState;
    };
};

export type ServerSlotsMessage = {
    type: "slots";
    payload: {
        slots: PlayerSlotSummary[];
    };
};

export type ServerErrorMessage = {
    type: "error";
    payload: { message: string };
};

export type ServerMessage =
    | ServerInitMessage
    | ServerStateMessage
    | ServerSlotsMessage
    | ServerErrorMessage;

export type PlayerSlotSummary = {
    index: PlayerIndex;
    occupied: boolean;
};
