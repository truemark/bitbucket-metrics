import {
  CloudWatchClient,
  CloudWatchClientConfig,
  Dimension,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';

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
    try {
      console.debug('publishing metric');

      const command = new PutMetricDataCommand({
        MetricData: [
          {
            MetricName: metricName,
            Dimensions: dimensions,
            Unit: unitType,
            Timestamp: timestamp,
            Value: unitValue,
          },
        ],
        Namespace: this.namespace,
      });

      await this.client.send(command);
      console.info('Successfully published metric');
    } catch (err) {
      console.warn('Failed to publish metric ', err);
      return;
    }
  }

  private getOrDefaultConfig(): CloudWatchClientConfig {
    return this.configuration
      ? this.configuration
      : {region: process.env.AWS_REGION};
  }
}
