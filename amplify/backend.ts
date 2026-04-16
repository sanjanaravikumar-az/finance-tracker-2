import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { cdkStack } from './custom/monthlyreport/resource';
import { financetracker2ceb6de29 } from './function/financetracker2ceb6de29/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  storage,
  financetracker2ceb6de29,
});
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ['email'];
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    temporaryPasswordValidityDays: 7,
  },
};
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(30),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
new cdkStack(backend.createStack('monthlyreport'), 'monthlyreport');
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.financetracker2ceb6de29.resources.cfnResources.cfnFunction.functionName = `financetracker2ceb6de29-${branchName}`;
backend.financetracker2ceb6de29.addEnvironment(
  'API_FINANCETRACKER2_GRAPHQLAPIIDOUTPUT',
  backend.data.apiId
);
backend.financetracker2ceb6de29.addEnvironment(
  'API_FINANCETRACKER2_TRANSACTIONTABLE_ARN',
  backend.data.resources.tables['Transaction'].tableArn
);
backend.financetracker2ceb6de29.addEnvironment(
  'API_FINANCETRACKER2_TRANSACTIONTABLE_NAME',
  backend.data.resources.tables['Transaction'].tableName
);
backend.data.resources.tables['Transaction'].grant(
  backend.financetracker2ceb6de29.resources.lambda,
  'dynamodb:Put*',
  'dynamodb:Create*',
  'dynamodb:BatchWriteItem',
  'dynamodb:PartiQLInsert',
  'dynamodb:Get*',
  'dynamodb:BatchGetItem',
  'dynamodb:List*',
  'dynamodb:Describe*',
  'dynamodb:Scan',
  'dynamodb:Query',
  'dynamodb:PartiQLSelect',
  'dynamodb:Update*',
  'dynamodb:RestoreTable*',
  'dynamodb:PartiQLUpdate',
  'dynamodb:Delete*',
  'dynamodb:PartiQLDelete'
);
backend.financetracker2ceb6de29.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:Publish'],
    resources: ['*'],
  })
);
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'financetracker2360d09927a0346a8934cad9be891d5fbecd2b-main';
s3Bucket.bucketEncryption = {
  serverSideEncryptionConfiguration: [
    {
      serverSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
      bucketKeyEnabled: false,
    },
  ],
};
