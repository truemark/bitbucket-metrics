#!/usr/bin/env node
import 'source-map-support/register';
import {BitbucketMetricsStack} from '../lib/bitbucket-metrics-stack';
import {ExtendedApp} from 'truemark-cdk-lib/aws-cdk';

const app = new ExtendedApp({
  standardTags: {
    automationTags: {
      id: 'bitbucket-metrics',
      url: 'https://github.com/truemark/bitbucket-metrics',
    },
  },
});

new BitbucketMetricsStack(app, 'BitbucketMetrics', {
  // nothing to see here
});
