import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import awsConfig from './aws-config';

// Configure Amplify
Amplify.configure(awsConfig);

export function AuthWrapper({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('employee');
    const [loading, setLoading] = useState(true);
    const [showSecurityWarning, setShowSecurityWarning] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showAccessRequest, setShowAccessRequest] = useState(false);
    const [requestName, setRequestName] = useState('');
    const [requestEmail, setRequestEmail] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();
            
            // Get user groups from token
            const groups = session.tokens?.accessToken?.payload['cognito:groups'] || [];
            
            // Determine role based on groups (priority: SuperAdmin > Admin > HR > Employee)
            let role = 'employee';
            if (groups.includes('SuperAdmin')) {
                role = 'superadmin';
            } else if (groups.includes('Admin')) {
                role = 'admin';
            } else if (groups.includes('HR')) {
                role = 'hr';
            }
            
            setUser(currentUser);
            setUserRole(role);
            setShowSecurityWarning(false);
            setShowLogin(false);
        } catch (err) {
            console.log('Not signed in');
            setShowSecurityWarning(true);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignIn(e) {
        e.preventDefault();
        setError('');
        try {
            await signIn({ username: email, password });
            await checkUser();
        } catch (err) {
            console.error('Sign in error:', err);
            setError(err.message || 'Failed to sign in');
        }
    }

    async function handleSignOut() {
        try {
            await signOut();
            setUser(null);
            setUserRole('employee');
            setShowSecurityWarning(true);
            setShowLogin(false);
        } catch (err) {
            console.error('Sign out error:', err);
        }
    }

    async function handleAccessRequest(e) {
        e.preventDefault();
        setError('');
        
        try {
            // Send access request email via API
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/access-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: requestName,
                    email: requestEmail,
                    reason: requestReason,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                setRequestSuccess(true);
                setTimeout(() => {
                    setShowAccessRequest(false);
                    setRequestSuccess(false);
                    setRequestName('');
                    setRequestEmail('');
                    setRequestReason('');
                }, 3000);
            } else {
                setError('Failed to submit access request. Please try again.');
            }
        } catch (err) {
            console.error('Access request error:', err);
            setError('Failed to submit access request. Please contact rachelle.briscoe@navontech.com directly.');
        }
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
            }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <div style={{ fontSize: '1.5rem' }}>Loading...</div>
                </div>
            </div>
        );
    }

    // If not authenticated, show security warning or login
    if (!user) {
        if (showLogin) {
            // Show login screen (defined below)
        } else if (showAccessRequest) {
            // Show access request (defined below)
        } else {
            // Force show security warning if no user
            if (!showSecurityWarning) {
                setShowSecurityWarning(true);
            }
        }
    }

    // Security Warning Screen
    if (showSecurityWarning && !showLogin && !showAccessRequest) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                zIndex: 9999
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    padding: '3rem',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    maxWidth: '600px',
                    width: '100%',
                    border: '3px solid #d4af37'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🔐</span> Secure Access Required
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6', margin: '1rem 0' }}>
                            Access to the employee portal requires authorization from Administrator.
                            <br />
                            All activities are logged and monitored for compliance.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => {
                                setShowSecurityWarning(false);
                                setShowLogin(true);
                            }}
                            style={{
                                flex: 1,
                                background: 'white',
                                color: '#1e3a8a',
                                padding: '1rem 2rem',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}>
                            🔑 Employee Login
                        </button>

                        <button
                            onClick={() => {
                                setShowSecurityWarning(false);
                                setShowAccessRequest(true);
                            }}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                color: 'white',
                                padding: '1rem 2rem',
                                border: '2px solid white',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}>
                            📧 Request Access
                        </button>
                    </div>

                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: 'white',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <strong>⚠️ Authorized Personnel Only</strong><br />
                        Unauthorized access attempts will be reported
                    </div>
                </div>
            </div>
        );
    }

    // Access Request Form
    if (showAccessRequest) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                zIndex: 9999
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    padding: '3rem',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    maxWidth: '500px',
                    width: '100%',
                    border: '2px solid rgba(212, 175, 55, 0.3)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>
                            Request Portal Access
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Submit your request to the administrator</p>
                    </div>

                    {requestSuccess ? (
                        <div style={{
                            background: '#dcfce7',
                            border: '2px solid #10b981',
                            borderRadius: '12px',
                            padding: '2rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ color: '#166534', marginBottom: '0.5rem' }}>Request Submitted!</h3>
                            <p style={{ color: '#166534', margin: 0 }}>
                                Your access request has been sent to the administrator. 
                                You will be contacted via email.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleAccessRequest}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={requestName}
                                    onChange={(e) => setRequestName(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        color: '#1e293b'
                                    }}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={requestEmail}
                                    onChange={(e) => setRequestEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        color: '#1e293b'
                                    }}
                                    placeholder="john.doe@example.com"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    Reason for Access
                                </label>
                                <textarea
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    required
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        color: '#1e293b'
                                    }}
                                    placeholder="Please explain why you need access to the employee portal..."
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: '#fee2e2',
                                    border: '1px solid #ef4444',
                                    color: '#991b1b',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAccessRequest(false);
                                        setShowSecurityWarning(true);
                                    }}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        padding: '1rem',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        background: '#d4af37',
                                        color: '#0f172a',
                                        padding: '1rem',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    if (showLogin) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                zIndex: 9999
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    padding: '3rem',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    maxWidth: '400px',
                    width: '100%',
                    border: '2px solid rgba(212, 175, 55, 0.3)'
                }}>
                    <button
                        onClick={() => {
                            setShowLogin(false);
                            setShowSecurityWarning(true);
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                        ← Back
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
                        <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>
                            Secure Sign In
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Navon Technologies Employee Portal</p>
                    </div>

                    <form onSubmit={handleSignIn}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                color: 'white',
                                fontWeight: '600'
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    color: '#1e293b'
                                }}
                                placeholder="your.email@navontech.com"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                color: 'white',
                                fontWeight: '600'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    color: '#1e293b'
                                }}
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: '#fee2e2',
                                border: '1px solid #ef4444',
                                color: '#991b1b',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                background: '#d4af37',
                                color: '#0f172a',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>
                            Sign In
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                alert('Please contact rachelle.briscoe@navontech.com to reset your password.');
                            }}
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                            Forgot Password?
                        </a>
                    </div>

                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <strong>Demo Credentials:</strong><br />
                        Email: rachelle.briscoe@navontech.com<br />
                        Password: TempPass123!
                    </div>
                </div>
            </div>
        );
    }

    return children({ user, userRole, handleSignOut });
}
