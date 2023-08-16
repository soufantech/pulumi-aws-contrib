export interface EcsDeployEvent {
    version: string;
    id: string;
    'detail-type': string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: Detail;
}

export interface Detail {
    eventType: string;
    eventName:
        | 'SERVICE_DEPLOYMENT_IN_PROGRESS'
        | 'SERVICE_DEPLOYMENT_COMPLETED'
        | 'SERVICE_DEPLOYMENT_FAILED';
    deploymentId: string;
    updatedAt: string;
    reason: string;
}
