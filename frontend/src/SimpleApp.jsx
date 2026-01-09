function SimpleApp() {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <header style={{
                background: '#007bff',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ margin: 0 }}>Navon Tech</h1>
                <nav>
                    <a href="#home" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>Home</a>
                    <a href="#about" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>About</a>
                    <a href="#solutions" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>Solutions</a>
                    <a href="#careers" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>Careers</a>
                    <a href="#contact" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>Contact</a>
                    <a href="#portal" style={{
                        background: 'white',
                        color: '#007bff',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }}>Employee Portal</a>
                </nav>
            </header>

            {/* Hero Section */}
            <section id="home" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '4rem 2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>Cloud-Native Technology Solutions</h1>
                <p style={{ fontSize: '1.2rem', margin: '0 0 2rem 0' }}>
                    Empowering businesses with scalable, secure, and innovative cloud infrastructure solutions built on AWS.
                </p>
                <button style={{
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>Get Started</button>
            </section>

            {/* About Section */}
            <section id="about" style={{ padding: '4rem 2rem', background: '#f8f9fa' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>About Navon Tech</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                        We are a cloud-native technology company specializing in AWS solutions.
                        Our platform migrated from GoDaddy to AWS, rebuilt with React and AWS Amplify
                        for better performance, security, and scalability.
                    </p>
                </div>
            </section>

            {/* Solutions Section */}
            <section id="solutions" style={{ padding: '4rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Our Solutions</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <h3>Cloud Migration</h3>
                            <p>Seamless migration from legacy systems to modern cloud infrastructure.</p>
                        </div>
                        <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <h3>Serverless Architecture</h3>
                            <p>Cost-effective, scalable solutions with AWS Lambda and API Gateway.</p>
                        </div>
                        <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <h3>AWS Amplify</h3>
                            <p>Full-stack development platform for building scalable web applications.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Employee Portal Section */}
            <section id="portal" style={{ padding: '4rem 2rem', background: '#f8f9fa' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Employee Portal</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Secure intranet for employees with authentication, directory, resources, and project management.
                    </p>
                    <p style={{ color: '#666' }}>Authentication will be added with Amplify Gen 2</p>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" style={{ padding: '4rem 2rem', background: '#007bff', color: 'white' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Contact Us</h2>
                    <p style={{ fontSize: '1.1rem' }}>Ready to transform your business with cloud-native solutions?</p>
                    <p>Email: support@navontech.com</p>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem', background: '#333', color: 'white', textAlign: 'center' }}>
                <p>&copy; 2024 Navon Tech Platform. Built with React + AWS Amplify.</p>
            </footer>
        </div>
    );
}

export default SimpleApp;