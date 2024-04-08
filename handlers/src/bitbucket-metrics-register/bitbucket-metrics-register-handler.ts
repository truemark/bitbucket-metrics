import {Context} from 'aws-lambda';

interface CronEvent {
  version: string;
  id: string;
  'detail-type': string;
  source: string;
  account: string;
  time: string;
  region: string;
  resources: string[];
  detail: string;
}

export async function handler(
  event: CronEvent,
  context: Context
): Promise<{statusCode: number; body: string}> {
  console.info('Received event:', JSON.stringify(event, null, 2));
  console.info('Context:', JSON.stringify(context, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Cron Lambda executed successfully!',
      input: event,
    }),
  };
}
