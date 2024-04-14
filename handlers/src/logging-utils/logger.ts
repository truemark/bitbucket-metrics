import pino from 'pino';

// Pino logger with asynchronous transport
export const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label: string) {
      return {level: label};
    },
  },
});
