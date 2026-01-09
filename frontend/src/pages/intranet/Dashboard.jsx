import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

const Dashboard = () => {
    const { user } = useAuthenticator((context) => [context.user]);

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <h1>Employee Dashboard</h1>
            <p>Welcome, {user?.attributes?.email}!</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="/intranet/directory">Employee Directory</a></li>
                        <li><a href="/intranet/resources">Resources</a></li>
                        <li><a href="/intranet/projects">Projects</a></li>
                    </ul>
                </div>
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Recent Updates</h3>
                    <p>No recent updates available.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;