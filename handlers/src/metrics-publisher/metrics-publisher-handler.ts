import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {BitBucketMetricsProcessor} from './metrics-processor';
import * as logging from '@nr1e/logging';

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  await logging.initialize({svc: 'metrics-publisher-handler', level: 'debug'});

  await BitBucketMetricsProcessor.process(JSON.parse(event.body!));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      input: event,
    }),
  };
}
