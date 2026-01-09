import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navigation">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <h2 style={{ color: '#007bff', margin: 0 }}>Navon Tech</h2>
                </Link>

                <div className={`nav-menu ${isMenuOpen ? 'nav-menu-active' : ''}`}>
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