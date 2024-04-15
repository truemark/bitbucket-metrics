import {
  CloudWatchClient,
  CloudWatchClientConfig,
  Dimension,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import * as logging from '../logging-utils/logger';

const logger = logging.getLogger('metric-publisher-base');

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
    logger.debug().msg('Publishing metric');

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
    logger.debug().obj('command', command).msg('PutMetricDataCommand data');
    await this.client
      .send(command)
      .then(() => logger.info().msg('Successfully published metric'))
      .catch(err => {
        logger.error().err(err).msg('Failed to publish metric.');
        throw new Error('Failed to publish metric');
      });
  }

  private getOrDefaultConfig(): CloudWatchClientConfig {
    return this.configuration
      ? this.configuration
      : {region: process.env.AWS_REGION};
  }
}
