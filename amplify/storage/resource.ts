import { defineStorage } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `financetracker2360d09927a0346a8934cad9be891d5fbecd2b-${branchName}`,
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
  }),
});
