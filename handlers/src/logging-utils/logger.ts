import pino from 'pino';

export const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label: string) {
      return {level: label};
    },
  },
});
