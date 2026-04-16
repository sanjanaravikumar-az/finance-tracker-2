import { defineData } from '@aws-amplify/backend';

const schema = `# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: https://docs.amplify.aws/cli/graphql/authorization-rules
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!

type Transaction @model {
  id: ID!
  description: String!
  amount: Float!
  type: TransactionType!
  category: String!
  date: AWSDateTime!
  receiptUrl: String
  owner: String
}

enum TransactionType {
  INCOME
  EXPENSE
}

type Budget @model {
  id: ID!
  category: String!
  limit: Float!
  month: String!
  owner: String
}

type FinancialSummary @model {
  id: ID!
  totalIncome: Float!
  totalExpenses: Float!
  balance: Float!
  month: String!
  owner: String
}

# Custom query to calculate financial summary using Lambda
type CalculatedSummary @auth(rules: [{ allow: public }]) {
  totalIncome: Float!
  totalExpenses: Float!
  balance: Float!
  savingsRate: Float!
}

type NotificationResult @auth(rules: [{ allow: public }]) {
  success: Boolean!
  message: String!
}

type TransactionConnection @auth(rules: [{ allow: public }]) {
  items: [Transaction]
  nextToken: String
}

type Query {
  calculateFinancialSummary: CalculatedSummary @function(name: "financetracker2ceb6de29-gen2-main") @auth(rules: [{ allow: public }])
  getTransactionsByCategory(category: String!, limit: Int): TransactionConnection
}

type Mutation {
  sendMonthlyReport(email: String!): NotificationResult @function(name: "financetracker2ceb6de29-gen2-main") @auth(rules: [{ allow: public }])
  sendBudgetAlert(email: String!, category: String!, exceeded: Float!): NotificationResult @function(name: "financetracker2ceb6de29-gen2-main") @auth(rules: [{ allow: public }])
}`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'main',
      modelNameToTableNameMapping: {
        Transaction: 'Transaction-sepsn22rqzcdhapssgvpnov6du-main',
        Budget: 'Budget-sepsn22rqzcdhapssgvpnov6du-main',
        FinancialSummary: 'FinancialSummary-sepsn22rqzcdhapssgvpnov6du-main',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 100, description: 'graphql' },
  },
  schema,
});
