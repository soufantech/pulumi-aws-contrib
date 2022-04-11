import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { WidgetExtraConfigs } from '../../types';

export default function createWidgets(
    queues?: string[],
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    return (queues || [])
        .map((queueName) => {
            const ageOfOldestMessage = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'ApproximateAgeOfOldestMessage',
                label: 'AgeOfOldestMessage',
                dimensions: { QueueName: queueName },
                statistic: 'Maximum',
            });

            const numberOfMessagesVisibleMetric = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'ApproximateNumberOfMessagesVisible',
                label: 'NumberOfMessagesVisible',
                dimensions: { QueueName: queueName },
                statistic: 'Maximum',
            });

            const sentMessageSizeMetric = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'SentMessageSize',
                label: 'SentMessageSize',
                dimensions: { QueueName: queueName },
                statistic: 'Maximum',
            });

            const numberOfMessagesSentMetric = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'NumberOfMessagesSent',
                label: 'NumberOfMessagesSent',
                dimensions: { QueueName: queueName },
                statistic: 'Sum',
            });

            const numberOfMessagesReceivedMetric = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'NumberOfMessagesReceived',
                label: 'NumberOfMessagesReceived',
                dimensions: { QueueName: queueName },
                statistic: 'Sum',
            });

            const numberOfMessagesDeletedMetric = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'NumberOfMessagesDeleted',
                label: 'NumberOfMessagesDeleted',
                dimensions: { QueueName: queueName },
                statistic: 'Sum',
            });

            const receivedToSentRatioExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
                'm2/m1',
                'ReceivedToSentRatio',
                'e1'
            );

            const numberOfEmptyReceivesMetric = new awsx.cloudwatch.Metric({
                namespace: 'AWS/SQS',
                name: 'NumberOfEmptyReceives',
                label: 'NumberOfEmptyReceives',
                dimensions: { QueueName: queueName },
                statistic: 'Sum',
            });

            return [
                new awsx.cloudwatch.TextWidget({
                    width: 24,
                    height: 1,
                    markdown: `**SQS: ${queueName}**`,
                }),
                new awsx.cloudwatch.SingleNumberMetricWidget({
                    title: 'Unprocessed Status',
                    width: 3,
                    height: 6,
                    metrics: [
                        ageOfOldestMessage.withPeriod(shortPeriod),
                        numberOfMessagesVisibleMetric.withPeriod(shortPeriod),
                    ],
                }),
                new awsx.cloudwatch.SingleNumberMetricWidget({
                    title: 'Queue Health Status',
                    width: 3,
                    height: 6,
                    metrics: [
                        numberOfMessagesSentMetric
                            .withId('m1')
                            .withPeriod(longPeriod)
                            .withVisible(false),
                        numberOfMessagesReceivedMetric
                            .withId('m2')
                            .withPeriod(longPeriod)
                            .withVisible(false),
                        sentMessageSizeMetric.withId('m3').withPeriod(longPeriod),
                        receivedToSentRatioExpression,
                    ],
                }),
                new awsx.cloudwatch.LineGraphMetricWidget({
                    title: 'Sent x Received x Deleted',
                    width: 9,
                    height: 6,
                    metrics: [
                        numberOfMessagesSentMetric.withPeriod(longPeriod),
                        numberOfMessagesReceivedMetric.withPeriod(longPeriod),
                        numberOfMessagesDeletedMetric.withPeriod(longPeriod),
                    ],
                }),
                new awsx.cloudwatch.LineGraphMetricWidget({
                    title: 'Empty Receives',
                    width: 9,
                    height: 6,
                    metrics: [numberOfEmptyReceivesMetric.withPeriod(longPeriod)],
                }),
            ];
        })
        .flat();
}
