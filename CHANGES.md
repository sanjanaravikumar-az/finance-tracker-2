# Deployment Fixes Changelog

## Gen 1 (main branch)


### 5. Wired Custom Resource Outputs → Lambda Function (Gen 1)
- The Lambda reads `process.env.BUDGET_ALERT_TOPIC_ARN` and `process.env.MONTHLY_REPORT_TOPIC_ARN`, but these were never wired through CloudFormation.
- Necessary: Yes. This is the correct Amplify Gen 1 pattern for passing custom resource outputs to Lambda functions.



**b) `financetracker2ceb6de29-cloudformation-template.json` Parameters** — added parameters the CLI passes. Naming convention: `{category}{resourceName}{attribute}`. `dependsOn`/`lambdaLayers` are metadata the CLI always passes — they must exist or CFN rejects them:
```json
"custommonthlyreportBudgetAlertTopicArn": { "Type": "String" },
"custommonthlyreportMonthlyReportTopicArn": { "Type": "String" },
"dependsOn": { "Type": "String", "Default": "" },
"lambdaLayers": { "Type": "String", "Default": "" }
```

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

---

## Gen 2 (gen2-main branch — Post Migration)


### 10. Installed AWS SDK Packages as Dependencies (`package.json`)
- Amplify Gen 2 uses esbuild to bundle Lambda functions. esbuild couldn't resolve `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, and `@aws-sdk/client-sns`.
- Initially tried `bundling.externalPackages` and `bundling.nodeModules` in `defineFunction()` — neither exists on the Gen 2 `FunctionBundlingOptions` type (which only has `minify`).
- Final fix: installed the SDK packages so esbuild can resolve and bundle them. Adds bundle size but works reliably.
- Necessary: Yes. Better option: if Gen 2 adds `externalPackages` support in future, use that instead since the SDK is already in the Lambda runtime.

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-sns
```

### 11. Updated TypeScript Version (`package.json`)
- `package.json` had `"typescript": "^4.9.5"` but tsconfig used TS 5.8+ features (`es2023`, `bundler` moduleResolution, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Initially tried `~5.7.0` but `erasableSyntaxOnly` is a 5.8 feature.
- Necessary: Yes.

Before:
```json
"typescript": "^4.9.5"
```

After:
```json
"typescript": "~5.8.0"
```


### 13. Fixed AppSync Authorization for Custom Resolvers (`data/resource.ts`, `App.tsx`)
- Custom queries/mutations returned "Not Authorized" due to three issues. All three fixes were required.

**Issue 1:** `globalAuthRule` (`allow: public`) only applies to `@model` types, not custom Query/Mutation fields.

Fix — added `@auth` to each custom field in the schema:
```graphql
type Query {
  calculateFinancialSummary: CalculatedSummary
    @function(name: "financetracker2ceb6de29-gen2-main")
    @auth(rules: [{ allow: public }])
}

type Mutation {
  sendMonthlyReport(email: String!): NotificationResult
    @function(name: "financetracker2ceb6de29-gen2-main")
    @auth(rules: [{ allow: public }])
  sendBudgetAlert(email: String!, category: String!, exceeded: Float!): NotificationResult
    @function(name: "financetracker2ceb6de29-gen2-main")
    @auth(rules: [{ allow: public }])
}
```

**Issue 2:** Frontend defaulted to Cognito auth when signed in.

Fix — added `authMode: 'apiKey'` to Lambda-backed GraphQL calls in `App.tsx`:
```ts
const result: any = await client.graphql({
  query: sendMonthlyReportMutation,
  variables: { email: userEmail },
  authMode: 'apiKey',
});
```

Same change applied to `calculateFinancialSummary` and `sendBudgetAlert` calls.

**Issue 3:** `@function` directive referenced Gen 1 function name.

Fix — updated from `financetracker2ceb6de29-main` to `financetracker2ceb6de29-gen2-main` in all `@function` directives.

### 14. Used `@aws_api_key` on Custom Return Types (`data/resource.ts`)
- Field-level `@auth` on Query/Mutation didn't propagate to return type fields, causing "Not Authorized to access success on type NotificationResult".
- Can't use Amplify's `@auth` on non-`@model` types (causes `Types annotated with @auth must also be annotated with @model`).
- Used AppSync-native `@aws_api_key` directive instead. This is the correct approach for non-model return types.
- Necessary: Yes.

```graphql
type CalculatedSummary @aws_api_key {
  totalIncome: Float!
  totalExpenses: Float!
  balance: Float!
  savingsRate: Float!
}

type NotificationResult @aws_api_key {
  success: Boolean!
  message: String!
}

type TransactionConnection @aws_api_key {
  items: [Transaction]
  nextToken: String
}
```

### 15. Granted Lambda SNS Publish Permission (`backend.ts`)
- Gen 2 Lambda didn't have IAM permission to publish to SNS (Gen 1 used `custom-policies.json` which doesn't apply in Gen 2).
- Necessary: Yes.
- Better option: Scope the resource to specific topic ARNs instead of `*` for least-privilege.

```ts
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

backend.financetracker2ceb6de29.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:Publish'],
    resources: ['*'],
  })
);
```

---

## Known Issues / Future Improvements
- SNS topic ARNs are hardcoded in `resource.ts` `environment` block — these are Gen 1 topic ARNs. If the Gen 2 `monthlyreport` custom stack creates new topics, the ARNs need updating.
- `sns:Publish` resource is `*` — should be scoped to specific topic ARNs for production.
- `input AMPLIFY { globalAuthRule }` is marked "FOR TESTING ONLY" — production should use proper per-model auth rules.
- `adminCreateUserConfig` override (#12) — verify it is committed in `backend.ts`.
