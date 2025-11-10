export {};

declare global {
    const io: typeof import("socket.io-client").io;
}
