import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {BitBucketMetricsProcessor} from './metrics-processor';
import {initializeLogger, rootLogger} from '../logging-utils/logger';

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  await initializeLogger('metrics-publisher-handler');
  rootLogger
    .debug()
    .obj('event', event)
    .msg('Metrics Publisher Received event');

  await BitBucketMetricsProcessor.process(JSON.parse(event.body!));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      input: event,
    }),
  };
}
