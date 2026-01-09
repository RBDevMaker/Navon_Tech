import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Pages
import HomePage from './pages/public/HomePage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import SolutionsPage from './pages/public/SolutionsPage.jsx';
import PartnersPage from './pages/public/PartnersPage.jsx';
import CareersPage from './pages/public/CareersPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';

// Components
import Navigation from './components/Navigation.js';
import Footer from './components/Footer.jsx';

import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Navigation />
                <main className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/solutions" element={<SolutionsPage />} />
                        <Route path="/partners" element={<PartnersPage />} />
                        <Route path="/careers" element={<CareersPage />} />
                        <Route path="/contact" element={<ContactPage />} />

                        {/* Intranet placeholder */}
                        <Route path="/intranet" element={
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <h1>Employee Portal</h1>
                                <p>Authentication will be added with Amplify Gen 2</p>
                            </div>
                        } />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;