// AWS Amplify Configuration for Navon Technologies Portal

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-1_ku7FhV68P',
            userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '35id1evrkmfcarmqj7sjgk22p1',
            region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
            loginWith: {
                email: true
            },
            signUpVerificationMethod: 'code',
            userAttributes: {
                email: {
                    required: true
                }
            },
            allowGuestAccess: false,
            passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: true
            }
        }
    }
};

export default awsConfig;
