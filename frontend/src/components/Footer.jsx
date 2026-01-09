import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: '#f8f9fa',
            padding: '40px 0',
            marginTop: '60px',
            borderTop: '1px solid #e9ecef'
        }}>
            <div className="container">
                <div style={{ textAlign: 'center' }}>
                    <p>&copy; 2024 Tech Company Platform. All rights reserved.</p>
                    <p>Built with React, AWS Amplify, and modern cloud technologies.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;