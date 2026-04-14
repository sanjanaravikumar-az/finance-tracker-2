"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cdkStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
//import * as iam from 'aws-cdk-lib/aws-iam';
//import * as sns from 'aws-cdk-lib/aws-sns';
//import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
//import * as sqs from 'aws-cdk-lib/aws-sqs';
class cdkStack extends cdk.Stack {
    constructor(scope, id, props, amplifyResourceProps) {
        super(scope, id, props);
        /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
        new cdk.CfnParameter(this, 'env', {
            type: 'String',
            description: 'Current Amplify CLI env name',
        });
        /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
        // Example 1: Set up an SQS queue with an SNS topic 
        /*
        const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();
        const sqsQueueResourceNamePrefix = `sqs-queue-${amplifyProjectInfo.projectName}`;
        const queue = new sqs.Queue(this, 'sqs-queue', {
          queueName: `${sqsQueueResourceNamePrefix}-${cdk.Fn.ref('env')}`
        });
        // 👇create sns topic
        
        const snsTopicResourceNamePrefix = `sns-topic-${amplifyProjectInfo.projectName}`;
        const topic = new sns.Topic(this, 'sns-topic', {
          topicName: `${snsTopicResourceNamePrefix}-${cdk.Fn.ref('env')}`
        });
        // 👇 subscribe queue to topic
        topic.addSubscription(new subs.SqsSubscription(queue));
        new cdk.CfnOutput(this, 'snsTopicArn', {
          value: topic.topicArn,
          description: 'The arn of the SNS topic',
        });
        */
        // Example 2: Adding IAM role to the custom stack 
        /*
        const roleResourceNamePrefix = `CustomRole-${amplifyProjectInfo.projectName}`;
        
        const role = new iam.Role(this, 'CustomRole', {
          assumedBy: new iam.AccountRootPrincipal(),
          roleName: `${roleResourceNamePrefix}-${cdk.Fn.ref('env')}`
        });
        */
        // Example 3: Adding policy to the IAM role
        /*
        role.addToPolicy(
          new iam.PolicyStatement({
            actions: ['*'],
            resources: [topic.topicArn],
          }),
        );
        */
        // Access other Amplify Resources 
        /*
        const retVal:AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this,
          amplifyResourceProps.category,
          amplifyResourceProps.resourceName,
          [
            {category: <insert-amplify-category>, resourceName: <insert-amplify-resourcename>},
          ]
        );
        */
    }
}
exports.cdkStack = cdkStack;
