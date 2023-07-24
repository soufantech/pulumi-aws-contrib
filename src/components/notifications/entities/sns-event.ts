export interface SnsEvent {
    Records: Array<EventRecord>;
}

interface EventRecord {
    EventSource: string;
    EventVersion: string;
    EventSubscriptionArn: string;
    Sns: SnsEventRecord;
}

interface SnsEventRecord {
    Type: string;
    MessageId: string;
    TopicArn: string;
    Subject: string;
    Message: string;
    Timestamp: string;
    SignatureVersion: string;
    Signature: string;
    SigningCertUrl: string;
    UnsubscribeUrl: string;
    MessageAttributes: Record<string, { Type: string; Value: string }>;
}
