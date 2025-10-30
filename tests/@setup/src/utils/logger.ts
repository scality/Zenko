import Werelogs from 'werelogs';

type LogLevel = 'info' | 'trace' | 'debug' | 'warn' | 'error' | 'fatal';

// Configure werelogs
Werelogs.configure({
    level: (process.env.LOG_LEVEL as LogLevel | undefined) || 'info',
    dump: (process.env.LOG_DUMP_LEVEL as LogLevel | undefined) || 'error',
});

export const logger = new Werelogs.Logger('ZenkoSetup').newRequestLogger();
