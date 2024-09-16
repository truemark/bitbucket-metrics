/** @internal */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios';
import {ThrottlingError} from './throttling-error';
import * as logging from '@nr1e/logging';

const log = logging.getLogger('timed-exponential-backoff');

export class TimedExponentialBackoff {
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly multiplier: number;
  private readonly jitter: number;
  private readonly remainingTimeHeader: string;

  private nextDelay: number;
  private nextDelayWithJitter: number;

  constructor(remainingTimeHeader: string) {
    this.initialDelay = 60000; //ms
    this.maxDelay = 180_0000; // Maximum delay between retries
    this.multiplier = 2; // Exponential backoff multiplier
    this.jitter = Math.floor(Math.random() * 10);

    this.nextDelay = this.initialDelay;
    this.nextDelayWithJitter = this.initialDelay;
    this.remainingTimeHeader = remainingTimeHeader;
  }

  reset() {
    this.nextDelay = this.initialDelay;
    this.nextDelayWithJitter = this.initialDelay;
  }

  private delay() {
    const delay = this.nextDelayWithJitter;
    this.nextDelay = Math.min(this.nextDelay * this.multiplier, this.maxDelay);
    this.nextDelayWithJitter =
      this.nextDelay + Math.floor(Math.random() * this.jitter);
    return delay;
  }

  public async makeRequest(
    url: string,
    method: Method,
    headers: {[key: string]: string},
    data?: any,
    retries = 3
  ): Promise<AxiosResponse<any>> {
    log.debug().num('retries', retries).msg('Retries left');
    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      headers,
      data: data,
    };

    try {
      return await axios(config);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 429) {
        if (retries > 0) {
          // Handle rate limit exceeded, with retry-after support
          let retryAfter = parseInt(
            axiosError.response.headers[this.remainingTimeHeader],
            10
          );

          if (retryAfter) {
            retryAfter = retryAfter * 1000;
            log
              .info()
              .num('retryAfter', retryAfter)
              .msg('API Timed Back off:: Rate limit exceeded');
          } else {
            retryAfter = this.delay();
            log.info().num('retryAfter', retryAfter).msg('Rate limit exceeded');
          }
          log.info().num('retryAfter', retryAfter).msg('Rate limit exceeded');
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return this.makeRequest(url, method, headers, data, retries - 1); // Retry the request
        } else {
          throw new ThrottlingError('Rate limit exceeded');
        }
      } else {
        throw axiosError;
      }
    }
  }
}
