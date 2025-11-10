declare module "node:http" {
    export interface RequestListener {
        (req: any, res: any): void;
    }

    export interface Server {
        listen(port: number, callback?: () => void): void;
        on(event: string, listener: (...args: any[]) => void): this;
    }

    export function createServer(listener?: RequestListener): Server;
}

declare module "node:https" {
    export interface ServerOptions {
        cert: Uint8Array | string;
        key: Uint8Array | string;
    }

    export interface Server {
        listen(port: number, callback?: () => void): void;
        on(event: string, listener: (...args: any[]) => void): this;
    }

    export function createServer(options: ServerOptions): Server;
}

declare module "node:fs" {
    export function readFileSync(path: string, options?: any): Buffer;
    export function existsSync(path: string): boolean;
    export type Buffer = any;
}

declare module "node:fs/promises" {
    export function readFile(path: string, encoding: string): Promise<string>;
}

declare module "node:path" {
    export function resolve(...segments: string[]): string;
    export function join(...segments: string[]): string;
}

declare module "ws" {
    export type RawData = string | ArrayBuffer | Uint8Array;

    export class WebSocket {
        static readonly OPEN: number;
        readyState: number;
        send(data: string): void;
        close(): void;
        on(event: "message", listener: (data: RawData) => void): this;
        on(event: "close", listener: () => void): this;
        on(event: "error", listener: (err: unknown) => void): this;
    }

    export interface WebSocketServerOptions {
        server: any;
    }

    export class WebSocketServer {
        constructor(options: WebSocketServerOptions);
        on(event: "connection", listener: (socket: WebSocket, request: any) => void): this;
    }
}

declare const process: {
    env: Record<string, string | undefined>;
    cwd(): string;
};
