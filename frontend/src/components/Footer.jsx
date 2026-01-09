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
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    {/* Company Branding */}
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1976d2'
                        }}>
                            Navon Technologies
                        </h3>
                        <p style={{ 
                            margin: '0', 
                            fontSize: '1.1rem',
                            fontStyle: 'italic',
                            color: '#666'
                        }}>
                            A wiser technology solutions, we take technology higher!
                        </p>
                    </div>

                    {/* Contact Us */}
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1976d2'
                        }}>
                            Contact Us
                        </h3>
                        <p style={{ margin: '0', color: '#666' }}>
                            Leesburg, Virginia
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e9ecef'
                }}>
                    <p style={{ margin: '0', color: '#666' }}>
                        &copy; 2024 Navon Technologies. All rights reserved.
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                        Built with React, AWS Amplify, and modern cloud technologies.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;