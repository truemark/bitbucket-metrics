import {Context} from 'aws-lambda';
import {BitbucketWebhookRegistrar} from './bitbucket-webhook-registrar';
import {initializeLogger, rootLogger} from '../logging-utils/logger';

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
  await initializeLogger('bitbucket-metrics-register-handler');
  rootLogger.debug().obj('event', event).msg('Received Cron event');
  rootLogger.debug().obj('context', context).msg('Received context');

  // Register webhooks for Bitbucket repositories
  const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
  await bitbucketWebhookRegistrar.register('BitbucketMetricsCallback', [
    'repo:commit_status_created',
    'repo:commit_status_updated',
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Cron Lambda executed successfully!',
      input: event,
    }),
  };
}
