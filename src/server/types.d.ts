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

declare module "socket.io" {
    export interface ServerOptions {
        path?: string;
        transports?: string[];
    }

    export class Server<ListenEvents = any, EmitEvents = any> {
        constructor(server: any, options?: ServerOptions);
        on(event: "connection", listener: (socket: Socket<ListenEvents, EmitEvents>) => void): this;
    }

    export class Socket<ListenEvents = any, EmitEvents = any> {
        handshake: { query?: Record<string, string | string[] | undefined> };
        emit<E extends keyof EmitEvents>(event: E, payload: EmitEvents[E]): boolean;
        emit(event: string, payload?: any): boolean;
        on<E extends keyof ListenEvents>(event: E, listener: (payload: ListenEvents[E]) => void): this;
        on(event: string, listener: (...args: any[]) => void): this;
        disconnect(): this;
    }

    export { Server as SocketIOServer };
}

declare module "socket.io-client" {
    export interface SocketOptions {
        path?: string;
        transports?: string[];
    }

    export class Socket<ListenEvents = any, EmitEvents = any> {
        connected: boolean;
        emit<E extends keyof EmitEvents>(event: E, payload: EmitEvents[E]): this;
        emit(event: string, payload?: any): this;
        on<E extends keyof ListenEvents>(event: E, listener: (payload: ListenEvents[E]) => void): this;
        on(event: string, listener: (...args: any[]) => void): this;
        disconnect(): this;
    }

    export function io<ListenEvents = any, EmitEvents = any>(url?: string, options?: SocketOptions): Socket<ListenEvents, EmitEvents>;
}

declare const process: {
    env: Record<string, string | undefined>;
    cwd(): string;
};
