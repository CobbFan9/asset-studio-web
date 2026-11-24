export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
};

export interface LoggerOptions {
    level?: LogLevel;
    prefix?: string;
}

export class Logger {
    private level: LogLevel;
    private prefix: string;

    constructor(options: LoggerOptions = {}) {
        this.level = options.level ?? "info";
        this.prefix = options.prefix ?? "AssetStudioWeb";
    }

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}]`;

        switch (level) {
            case "debug":
                console.debug(formatted, message, ...args);
                break;
            case "info":
                console.info(formatted, message, ...args);
                break;
            case "warn":
                console.warn(formatted, message, ...args);
                break;
            case "error":
                console.error(formatted, message, ...args);
                break;
        }
    }

    debug(message: string, ...args: unknown[]): void {
        this.log("debug", message, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.log("info", message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log("warn", message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        this.log("error", message, ...args);
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    child(prefix: string): Logger {
        return new Logger({
            level: this.level,
            prefix: `${this.prefix}:${prefix}`,
        });
    }

    trace(value: unknown): void {
        if (LOG_LEVELS.trace < LOG_LEVELS[this.level]) return;
        console.log(value);
    }
}
