import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, WidgetExtraConfigs } from '../../../types';
import {
    ExpressionBuilder,
    MetricBuilder,
    MetricWidgetBuilder,
    TextWidgetBuilder,
} from '../../builders';

export function sqs(queues?: string[], extraConfigs?: WidgetExtraConfigs): pulumi.Output<Widget>[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const namespace = 'AWS/SQS';

    return (queues || [])
        .map((queueName) => {
            const ageOfOldestMessageMetric = new MetricBuilder({
                namespace,
                metricName: 'ApproximateAgeOfOldestMessage',
                dimensions: { QueueName: queueName },
            })
                .stat('Maximum')
                .label('AgeOfOldestMessage');

            const numberOfMessagesVisibleMetric = new MetricBuilder({
                namespace,
                metricName: 'ApproximateNumberOfMessagesVisible',
                dimensions: { QueueName: queueName },
            })
                .stat('Maximum')
                .label('NumberOfMessagesVisible');

            const sentMessageSizeMetric = new MetricBuilder({
                namespace,
                metricName: 'SentMessageSize',
                dimensions: { QueueName: queueName },
            })
                .stat('Maximum')
                .label('SentMessageSize');

            const numberOfMessagesSentMetric = new MetricBuilder({
                namespace,
                metricName: 'NumberOfMessagesSent',
                dimensions: { QueueName: queueName },
            })
                .stat('Sum')
                .label('NumberOfMessagesSent');

            const numberOfMessagesReceivedMetric = new MetricBuilder({
                namespace,
                metricName: 'NumberOfMessagesReceived',
                dimensions: { QueueName: queueName },
            })
                .stat('Sum')
                .label('NumberOfMessagesReceived');

            const numberOfMessagesDeletedMetric = new MetricBuilder({
                namespace,
                metricName: 'NumberOfMessagesDeleted',
                dimensions: { QueueName: queueName },
            })
                .stat('Sum')
                .label('NumberOfMessagesDeleted');

            const receivedToSentRatioExpression = new ExpressionBuilder({
                expression: 'm2/m1',
            })
                .label('ReceivedToSentRatio')
                .id('e1');

            const numberOfEmptyReceivesMetric = new MetricBuilder({
                namespace,
                metricName: 'NumberOfEmptyReceives',
                dimensions: { QueueName: queueName },
            })
                .stat('Sum')
                .label('NumberOfEmptyReceives');

            return [
                new TextWidgetBuilder()
                    .width(24)
                    .height(1)
                    .markdown(`**SQS: ${queueName}**`)
                    .build(),
                new MetricWidgetBuilder()
                    .title('Unprocessed Status')
                    .view('singleValue')
                    .width(3)
                    .height(6)
                    .addMetric(ageOfOldestMessageMetric.period(shortPeriod).build())
                    .addMetric(numberOfMessagesVisibleMetric.period(shortPeriod).build())
                    .build(),
                new MetricWidgetBuilder()
                    .title('Queue Health Status')
                    .view('singleValue')
                    .width(3)
                    .height(6)
                    .addMetric(
                        numberOfMessagesSentMetric
                            .id('m1')
                            .period(longPeriod)
                            .visible(false)
                            .build()
                    )
                    .addMetric(
                        numberOfMessagesReceivedMetric
                            .id('m2')
                            .period(longPeriod)
                            .visible(false)
                            .build()
                    )
                    .addMetric(sentMessageSizeMetric.id('m3').period(longPeriod).build())
                    .addMetric(receivedToSentRatioExpression.build())
                    .build(),
                new MetricWidgetBuilder()
                    .title('Sent x Received x Deleted')
                    .width(9)
                    .height(6)
                    .addMetric(numberOfMessagesSentMetric.period(longPeriod).build())
                    .addMetric(numberOfMessagesReceivedMetric.period(longPeriod).build())
                    .addMetric(numberOfMessagesDeletedMetric.period(longPeriod).build())
                    .build(),
                new MetricWidgetBuilder()
                    .title('Empty Receives')
                    .width(9)
                    .height(6)
                    .addMetric(numberOfEmptyReceivesMetric.period(longPeriod).build())
                    .build(),
            ];
        })
        .flat();
}
