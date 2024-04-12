import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {BitBucketMetricsProcessor} from './metrics-processor';

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  console.info(
    'Metrics Publisher Received event:',
    JSON.stringify(event.body, null, 2)
  );

  await BitBucketMetricsProcessor.process(JSON.parse(event.body!));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      input: event,
    }),
  };
}
