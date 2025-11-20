import { loadLevelFromUrl, LevelState } from "./LevelLoader.ts";
import { GoldenPlate } from "../../plates/GoldenPlate.ts";

export class LevelManager {
    private urls: string[];
    private index = 0;
    private current?: LevelState;

    constructor(urls: string[]) {
        this.urls = urls;
    }

    get level(): LevelState | undefined {
        return this.current;
    }

    get levelIndex(): number {
        return this.index;
    }

    async load(index = this.index): Promise<LevelState> {
        if (index < 0 || index >= this.urls.length) {
            throw new Error(`Index de niveau invalide: ${index}`);
        }
        this.index = index;
        this.current = await loadLevelFromUrl(this.urls[this.index]);
        return this.current;
    }

    async next(): Promise<LevelState> {
        const nextIndex = (this.index + 1) % this.urls.length;
        return this.load(nextIndex);
    }

    isCompleted(): boolean {
        if (!this.current) return false;
        const golden = this.current.plates.find(p => p instanceof GoldenPlate) as GoldenPlate | undefined;
        return !!golden?.isActive;
    }
}

