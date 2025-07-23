import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6879cef7486338d842f8c00c", 
  requiresAuth: true // Ensure authentication is required for all operations
});
