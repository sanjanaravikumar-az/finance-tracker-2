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

### 4. Invalid Keys Removed from Function `parameters.json`
- `amplify/backend/function/financetracker2ceb6de29/parameters.json` contained `dependsOn` and `lambdaLayers` keys.
- These are Amplify metadata and not valid CloudFormation parameters — CloudFormation rejected them with: `Parameters: [dependsOn, lambdaLayers] do not exist in the template`.
- File was cleaned to `{}`.

### 5. `backend-config.json` Left Unchanged
- The function's `dependsOn` in `backend-config.json` keeps only the API dependency (`GraphQLAPIIdOutput`), which matches the CFN template's declared parameters.
- The SNS topic ARNs are not wired as CFN parameters; the Lambda uses `sns:Publish` with wildcard resource via `custom-policies.json` instead.

### 6. Added Missing `aws-amplify` Dependency (`package.json`)
- `aws-amplify` was not listed in `package.json`, causing TypeScript build failures in Amplify Hosting: `Cannot find module 'aws-amplify'`.
- Installed via `npm install aws-amplify`.
