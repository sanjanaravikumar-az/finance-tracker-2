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

### 6. Gitignored `amplify/#current-cloud-backend`
- This directory is auto-managed by the Amplify CLI after each successful push/pull.
- It was being tracked in git, causing manual sync issues. Added to `.gitignore` and removed from git tracking via `git rm -r --cached`.

### 7. Fixed DynamoDB Table Name Env Var Typo (`index.js`)
- Lambda code referenced `process.env.API_FINANCETRACKER_TRANSACTIONTABLE_NAME` (missing the `2`).
- Corrected to `process.env.API_FINANCETRACKER2_TRANSACTIONTABLE_NAME` in all three functions: `calculateSummaryFromDB`, `sendMonthlyReport`, and `sendBudgetAlert`.
- This caused a runtime error: `Value null at 'tableName' failed to satisfy constraint: Member must not be null`.

### 8. Re-triggered SNS Subscription Confirmations
- After the SNS topics were recreated with auto-generated names, the email subscriptions were stuck in `PendingConfirmation` because the original confirmation emails had expired.
- Re-triggered via `aws sns subscribe` for both topics.

## 2026-04-16 (Gen 2 Branch — Post Migration)

### 9. Changed `npm ci` to `npm install` in `amplify.yml`
- The Amplify build environment's npm version resolves bundled transitive dependencies differently than the local npm (v10.8.2).
- `npm ci` requires an exact lock file match and kept failing with `Missing: fast-xml-parser@4.4.1 from lock file` and similar errors.
- Switched both backend and frontend install phases to `npm install` which is more tolerant of lock file differences.

### 10. Marked AWS SDK Packages as External in Lambda Bundling (`resource.ts`)
- Amplify Gen 2 uses esbuild to bundle Lambda functions. esbuild failed with `Could not resolve "@aws-sdk/client-dynamodb"` (and similar for `lib-dynamodb` and `client-sns`).
- These packages are pre-installed in the Node.js 22 Lambda runtime and don't need to be bundled.
- Added `bundling.externalPackages` to `defineFunction()` in `resource.ts` to exclude them from the bundle.

### 11. Updated TypeScript Version (`package.json`)
- `package.json` had `"typescript": "^4.9.5"` but the tsconfig files used TS 5+ features (`es2023` target, `bundler` moduleResolution, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- The Amplify build environment installed TS 4.9.5 which doesn't support these options, causing frontend build failures.
- Updated to `"typescript": "~5.8.0"` (initially tried 5.7 but `erasableSyntaxOnly` requires 5.8+).
