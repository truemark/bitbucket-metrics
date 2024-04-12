import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {publishBitbucketMetrics} from './metrics-publisher-service';

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  console.info(
    'Metrics Publisher Received event:',
    JSON.stringify(event.body, null, 2)
  );

  await publishBitbucketMetrics(JSON.parse(event.body!));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      input: event,
    }),
  };
}
