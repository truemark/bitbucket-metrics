import {
  CloudWatchClient,
  CloudWatchClientConfig,
  Dimension,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('metrics-publisher-base');

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
    log.debug().msg('Publishing metric');

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
    log.debug().obj('command', command).msg('PutMetricDataCommand');
    await this.client
      .send(command)
      .then(() => log.info().msg('Successfully published metric'))
      .catch(error => {
        log.error().err(error).msg('Failed to publish metric');
        throw new Error('Failed to publish metric');
      });
  }

  private getOrDefaultConfig(): CloudWatchClientConfig {
    return this.configuration
      ? this.configuration
      : {region: process.env.AWS_REGION};
  }
}
