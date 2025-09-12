import Werelogs from 'werelogs';

// Configure werelogs
Werelogs.configure({
    level: (process.env.LOG_LEVEL as any) || 'info',
    dump: (process.env.LOG_DUMP_LEVEL as any) || 'error',
});

export const logger = new Werelogs.Logger('ZenkoSetup').newRequestLogger();
