import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuthenticator((context) => [context.user]);

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Please sign in to access the employee portal</h2>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;