import type { SerializedLevelState, SerializedMove } from "./serialization.js";
import type { PlayerIndex } from "../systems/MovementSystem.js";

export type PlayerSlotSummary = {
    index: PlayerIndex;
    occupied: boolean;
};

export type ClientToServerEvents = {
    join: { desired?: PlayerIndex | null } | undefined;
    move: SerializedMove;
};

export type ServerInitPayload = {
    you: PlayerIndex | null;
    levelIndex: number;
    state: SerializedLevelState;
    slots: PlayerSlotSummary[];
};

export type ServerStatePayload = {
    levelIndex: number;
    state: SerializedLevelState;
};

export type ServerSlotsPayload = {
    slots: PlayerSlotSummary[];
};

export type ServerErrorPayload = { message: string };

export type ServerToClientEvents = {
    init: ServerInitPayload;
    state: ServerStatePayload;
    slots: ServerSlotsPayload;
    error: ServerErrorPayload;
};
