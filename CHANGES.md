# Deployment Fixes Changelog

## 2026-04-16

### 1. Orphaned SNS Topics Deleted
- `finance-budget-alerts-main` and `finance-monthly-reports-main` were leftover from a previous failed deployment of the `customfinance` stack.
- They were manually deleted via `aws sns delete-topic` to unblock CloudFormation from recreating them.

### 2. Duplicate Custom Stack Removed
- Two custom stacks (`customfinance` and `monthlyreport`) contained identical code creating the same SNS topics.
- `customfinance` was removed; only `monthlyreport` remains.

### 3. Hardcoded SNS Topic Names Removed (`monthlyreport/cdk-stack.ts`)
- Removed `topicName` from both `BudgetAlertTopic` and `MonthlyReportTopic` SNS constructs.
- CloudFormation now auto-generates unique names, preventing naming collisions on redeploy.

### 4. Added Missing `aws-amplify` Dependency (`package.json`)
- `aws-amplify` was not listed in `package.json`, causing TypeScript build failures in Amplify Hosting: `Cannot find module 'aws-amplify'`.
- Installed via `npm install aws-amplify`.

### 5. Properly Wired Custom Resource → Lambda Function (the big fix)

The Lambda function reads `process.env.BUDGET_ALERT_TOPIC_ARN` and `process.env.MONTHLY_REPORT_TOPIC_ARN`, but these env vars were never wired through CloudFormation. The Amplify CLI kept failing with `Parameters: [dependsOn, lambdaLayers] do not exist in the template`.

Root cause: `function-parameters.json` declared a `dependsOn` on the custom resource, which told Amplify CLI to pass the custom resource outputs as CloudFormation parameters — but the CFN template didn't declare those parameters, and didn't map them to Lambda env vars.

Changes made across 3 files:

**a) `function-parameters.json`** — declares the dependency (updated `resourceName` from `customfinance` → `monthlyreport`):
```json
{
  "lambdaLayers": [],
  "dependsOn": [
    {
      "category": "custom",
      "resourceName": "monthlyreport",
      "attributes": ["BudgetAlertTopicArn", "MonthlyReportTopicArn"]
    }
  ]
}
```

**b) `financetracker2ceb6de29-cloudformation-template.json` Parameters** — added parameters the CLI passes:
```json
"custommonthlyreportBudgetAlertTopicArn": { "Type": "String" },
"custommonthlyreportMonthlyReportTopicArn": { "Type": "String" },
"dependsOn": { "Type": "String", "Default": "" },
"lambdaLayers": { "Type": "String", "Default": "" }
```
Naming convention: `{category}{resourceName}{attribute}` → `custommonthlyreportBudgetAlertTopicArn`.
`dependsOn` and `lambdaLayers` are always passed by the Amplify CLI as metadata; they need to exist as parameters with defaults so CFN doesn't reject them.

**c) `financetracker2ceb6de29-cloudformation-template.json` Environment Variables** — wired to Lambda:
```json
"BUDGET_ALERT_TOPIC_ARN": { "Ref": "custommonthlyreportBudgetAlertTopicArn" },
"MONTHLY_REPORT_TOPIC_ARN": { "Ref": "custommonthlyreportMonthlyReportTopicArn" }
```

**d) `backend-config.json`** — added the custom resource dependency to the function entry:
```json
{
  "category": "custom",
  "resourceName": "monthlyreport",
  "attributes": ["BudgetAlertTopicArn", "MonthlyReportTopicArn"]
}
```

**e) `parameters.json`** — cleared to `{}` (this file is for static parameter overrides, not for `dependsOn`/`lambdaLayers` metadata).

All changes were mirrored in `amplify/#current-cloud-backend/` to keep local state in sync.
