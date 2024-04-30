import {
  CloudWatchClient,
  CloudWatchClientConfig,
  Dimension,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import {logger} from '../logging-utils/logger';

export abstract class MetricPublisherBase {
  protected namespace: string;
  protected configuration?: CloudWatchClientConfig;
  private client: CloudWatchClient;

  protected constructor(
    namespace: string,
    configuration?: CloudWatchClientConfig
  ) {
    this.namespace = namespace;
    this.configuration = configuration;
    this.client = new CloudWatchClient(this.getOrDefaultConfig());
  }

  public async publish(
    metricName: string,
    dimensions: Dimension[],
    unitType: StandardUnit,
    unitValue: number,
    timestamp: Date
  ): Promise<void> {
    logger.debug('Publishing metric');

    const command = new PutMetricDataCommand({
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: dimensions,
          Unit: unitType,
          Timestamp: timestamp,
          Value: unitValue,
          StorageResolution: 60,
        },
      ],
      Namespace: this.namespace,
    });
    logger.debug(`PutMetricDataCommand data: ${JSON.stringify(command)}`);
    await this.client
      .send(command)
      .then(() => logger.info('Successfully published metric'))
      .catch(error => {
        logger.error('Failed to publish metric.', {error});
        throw new Error('Failed to publish metric');
      });
  }

  private getOrDefaultConfig(): CloudWatchClientConfig {
    return this.configuration
      ? this.configuration
      : {region: process.env.AWS_REGION};
  }
}
