import * as pulumi from '@pulumi/pulumi';

import { AbstractFunction, AbstractFunctionArgs } from './abstract-function';

export type SimpleFunctionArgs = AbstractFunctionArgs;

export class SimpleFunction extends AbstractFunction {
    constructor(name: string, args: SimpleFunctionArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:SimpleFunction', name, args, opts);
    }
}
