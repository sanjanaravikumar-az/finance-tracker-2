import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const financetracker2ceb6de29 = defineFunction({
  entry: './index.js',
  name: `financetracker2ceb6de29-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  bundling: {
    nodeModules: [
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/lib-dynamodb',
      '@aws-sdk/client-sns',
    ],
  },
  environment: {
    BUDGET_ALERT_TOPIC_ARN:
      'arn:aws:sns:us-east-1:079385506759:amplify-financetracker2-main-ecd2b-custommonthlyreport-1ODLZESAI3Z3E-BudgetAlertTopicF20DF526-qEamb6bGOzep',
    MONTHLY_REPORT_TOPIC_ARN:
      'arn:aws:sns:us-east-1:079385506759:amplify-financetracker2-main-ecd2b-custommonthlyreport-1ODLZESAI3Z3E-MonthlyReportTopic8D223100-hCD3uhGPjJIn',
    ENV: `${branchName}`,
    REGION: 'us-east-1',
  },
  runtime: 22,
});
