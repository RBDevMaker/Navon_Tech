import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import './Navigation.css';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { user, signOut } = useAuthenticator((context) => [context.user]);

    const isActive = (path) => location.pathname === path;
    const isIntranet = location.pathname.startsWith('/intranet');

    return (
        <nav className="navigation">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <img src="/logo.png" alt="Company Logo" />
                </Link>

                <div className={`nav-menu ${isMenuOpen ? 'nav-menu-active' : ''}`}>
                    {!isIntranet ? (
                        // Public Navigation
                        <>
                            <Link
                                to="/"
                                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                to="/about"
                                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                to="/solutions"
                                className={`nav-link ${isActive('/solutions') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Solutions
                            </Link>
                            <Link
                                to="/partners"
                                className={`nav-link ${isActive('/partners') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Partners
                            </Link>
                            <Link
                                to="/careers"
                                className={`nav-link ${isActive('/careers') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Careers
                            </Link>
                            <Link
                                to="/contact"
                                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <Link
                                to="/intranet"
                                className="nav-link nav-intranet-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Employee Portal
                            </Link>
                        </>
                    ) : (
                        // Intranet Navigation
                        <>
                            <Link
                                to="/intranet"
                                className={`nav-link ${isActive('/intranet') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/intranet/directory"
                                className={`nav-link ${isActive('/intranet/directory') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Directory
                            </Link>
                            <Link
                                to="/intranet/resources"
                                className={`nav-link ${isActive('/intranet/resources') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Resources
                            </Link>
                            <Link
                                to="/intranet/projects"
                                className={`nav-link ${isActive('/intranet/projects') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Projects
                            </Link>
                            <Link
                                to="/"
                                className="nav-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Public Site
                            </Link>
                            {user && (
                                <button
                                    onClick={signOut}
                                    className="nav-link nav-signout"
                                >
                                    Sign Out
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div
                    className="nav-hamburger"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;