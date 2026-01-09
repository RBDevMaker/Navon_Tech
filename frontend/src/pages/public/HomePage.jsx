import React from 'react';
import OptimizedImage from '../../components/OptimizedImage';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>Cloud-Native Technology Solutions</h1>
                        <p>
                            Empowering businesses with scalable, secure, and innovative
                            cloud infrastructure solutions built on AWS.
                        </p>
                        <div className="hero-buttons">
                            <button className="btn btn-primary">Get Started</button>
                            <button className="btn btn-secondary">Learn More</button>
                        </div>
                    </div>
                    <div className="hero-image">
                        <OptimizedImage
                            src="hero/cloud-infrastructure.jpg"
                            alt="Cloud Infrastructure"
                            size="large"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2>Why Choose Our Platform?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <OptimizedImage
                                src="icons/scalability.svg"
                                alt="Scalability"
                                size="thumbnail"
                            />
                            <h3>Scalable Architecture</h3>
                            <p>Built on AWS with auto-scaling capabilities to grow with your business.</p>
                        </div>
                        <div className="feature-card">
                            <OptimizedImage
                                src="icons/security.svg"
                                alt="Security"
                                size="thumbnail"
                            />
                            <h3>Enterprise Security</h3>
                            <p>Advanced security features with AWS Cognito and IAM integration.</p>
                        </div>
                        <div className="feature-card">
                            <OptimizedImage
                                src="icons/performance.svg"
                                alt="Performance"
                                size="thumbnail"
                            />
                            <h3>High Performance</h3>
                            <p>Optimized for speed with CloudFront CDN and serverless architecture.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solutions Preview */}
            <section className="solutions-preview">
                <div className="container">
                    <h2>Our Solutions</h2>
                    <div className="solutions-grid">
                        <div className="solution-card">
                            <OptimizedImage
                                src="solutions/cloud-migration.jpg"
                                alt="Cloud Migration"
                                size="medium"
                            />
                            <div className="solution-content">
                                <h3>Cloud Migration</h3>
                                <p>Seamless migration from legacy systems to modern cloud infrastructure.</p>
                                <a href="/solutions" className="learn-more">Learn More →</a>
                            </div>
                        </div>
                        <div className="solution-card">
                            <OptimizedImage
                                src="solutions/serverless.jpg"
                                alt="Serverless Architecture"
                                size="medium"
                            />
                            <div className="solution-content">
                                <h3>Serverless Architecture</h3>
                                <p>Cost-effective, scalable solutions with AWS Lambda and API Gateway.</p>
                                <a href="/solutions" className="learn-more">Learn More →</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <h2>Ready to Transform Your Business?</h2>
                    <p>Let's discuss how our cloud-native solutions can accelerate your growth.</p>
                    <button className="btn btn-primary btn-large">Contact Us Today</button>
                </div>
            </section>
        </div>
    );
};

export default HomePage;