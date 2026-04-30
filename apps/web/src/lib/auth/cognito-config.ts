/**
 * AWS Cognito Configuration
 *
 * These values should be set in environment variables:
 * - VITE_AWS_REGION
 * - VITE_AWS_USER_POOL_ID
 * - VITE_AWS_USER_POOL_WEB_CLIENT_ID
 */

export const cognitoConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || '',
  userPoolWebClientId: import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID || '',
  identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '',
};

export const isCognitoConfigured = (): boolean => {
  return !!(cognitoConfig.userPoolId && cognitoConfig.userPoolWebClientId && cognitoConfig.region);
};
