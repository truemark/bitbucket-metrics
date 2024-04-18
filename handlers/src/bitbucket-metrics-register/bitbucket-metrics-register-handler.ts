import {Context} from 'aws-lambda';
import {BitbucketWebhookRegistrar} from './bitbucket-webhook-registrar';
import {logger} from '../logging-utils/logger';
import {ThrottlingError} from '../metrics-utilities/throttling-error';
import {EventBridgeUtils} from '../metrics-utilities/event-bridge-utils';

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
  logger.debug(`Received Cron event: ${JSON.stringify(event, null, 2)}`);
  logger.debug(`Context: ${JSON.stringify(context, null, 2)}`);

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
      console.error('ThrottlingError occurred:', error.message);
      const currentDate = new Date();
      currentDate.setMinutes(currentDate.getMinutes() + 61); // Start after an hour
      const retryTime = currentDate;
      await EventBridgeUtils.scheduleCron(
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
