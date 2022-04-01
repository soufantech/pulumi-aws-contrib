import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch/widget';

const fixedPeriod = 60;
const dinamicPeriod = 60;

export default function createSqsWidgets(queues: string[] = []): Widget[] {
    return queues
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
                        ageOfOldestMessage.withPeriod(fixedPeriod),
                        numberOfMessagesVisibleMetric.withPeriod(fixedPeriod),
                    ],
                }),
                new awsx.cloudwatch.SingleNumberMetricWidget({
                    title: 'Queue Health Status',
                    width: 3,
                    height: 6,
                    metrics: [
                        numberOfMessagesSentMetric
                            .withId('m1')
                            .withPeriod(dinamicPeriod)
                            .withVisible(false),
                        numberOfMessagesReceivedMetric
                            .withId('m2')
                            .withPeriod(dinamicPeriod)
                            .withVisible(false),
                        sentMessageSizeMetric.withId('m3').withPeriod(dinamicPeriod),
                        receivedToSentRatioExpression,
                    ],
                }),
                new awsx.cloudwatch.LineGraphMetricWidget({
                    title: 'Sent x Received x Deleted',
                    width: 9,
                    height: 6,
                    metrics: [
                        numberOfMessagesSentMetric.withPeriod(dinamicPeriod),
                        numberOfMessagesReceivedMetric.withPeriod(dinamicPeriod),
                        numberOfMessagesDeletedMetric.withPeriod(dinamicPeriod),
                    ],
                }),
                new awsx.cloudwatch.LineGraphMetricWidget({
                    title: 'Empty Receives',
                    width: 9,
                    height: 6,
                    metrics: [numberOfEmptyReceivesMetric.withPeriod(dinamicPeriod)],
                }),
            ];
        })
        .flat();
}
