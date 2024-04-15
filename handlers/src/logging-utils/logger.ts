import * as logging from '@nr1e/logging';

export const rootLogger = logging.getRootLogger();
export function getLogger(callerName: string) {
  return logging.getLogger(callerName);
}

export async function initializeLogger(
  callerName: string
): Promise<logging.Logger> {
  return await logging.initialize({
    svc: 'BitbucketMetrics',
    name: callerName,
    level: 'info',
  });
}
