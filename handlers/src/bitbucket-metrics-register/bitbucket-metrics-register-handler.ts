import {Context} from 'aws-lambda';
import {BitbucketWebhookRegistrar} from './bitbucket-webhook-registrar';
import {ThrottlingError} from '../metrics-utilities/throttling-error';
import {EventBridgeUtils} from '../metrics-utilities/event-bridge-utils';
import * as logging from '@nr1e/logging';

const log = logging.getRootLogger();

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
  await logging.initialize({
    svc: 'bitbucket-metrics-register-handler',
    level: 'debug',
  });
  log
    .debug()
    .obj('event', event)
    .obj('context', context)
    .msg('Received cron event');
  try {
    // Register webhooks for Bitbucket repositories
    const bitbucketWebhookRegistrar = await BitbucketWebhookRegistrar.create();
    await bitbucketWebhookRegistrar.register('BitbucketMetricsCallback', [
      'repo:commit_status_created',
      'repo:commit_status_updated',
    ]);
  } catch (error) {
    if (error instanceof ThrottlingError) {
      // Handle ThrottlingError
      log.error().err(error).msg('ThrottlingError occurred');
      const retryTime = new Date();
      retryTime.setMinutes(retryTime.getMinutes() + 61); // Start after an hour
      await EventBridgeUtils.scheduleCron(
        'BitBucketMetricsRegister',
        context.functionName,
        context.invokedFunctionArn,
        retryTime
      );
    } else {
      // Rethrow the error
      throw error;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Cron Lambda executed successfully!',
      input: event,
    }),
  };
}
