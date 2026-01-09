import React from 'react';
import OptimizedImage from '../../components/OptimizedImage';

const AboutPage = () => {
    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            {/* AWS Partnership Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                    <h1>Navon Technologies Achieves AWS Public Sector Partnership</h1>
                    <OptimizedImage
                        src="badges/aws-public-sector-partner.png"
                        alt="AWS Public Sector Partner Badge"
                        size="thumbnail"
                        style={{ maxHeight: '80px' }}
                    />
                </div>
            </div>

            {/* Our Services & Solutions */}
            <section style={{ marginBottom: '40px' }}>
                <h2>Our Services</h2>
                <h3>Our Solutions</h3>
                <p>
                    Navon Technologies provides the experience and technical expertise to help design, implement and maintain enterprise and service provider Infrastructure or service offerings. We are designed to help achieve and sustain operational excellence for Large Enterprise and service provider networks utilizing automated scalable, reliable and secure solutions from our technology partners.
                </p>
                
                {/* Technology Partners */}
                <div style={{ marginBottom: '30px' }}>
                    <h4>Our Partners Include:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                        {['AWS', 'Cisco', 'VMware', 'Microsoft', 'Red Hat Linux', 'Ansible', 'Puppet', 'KVM', 'Vagrant', 'Palo Alto', 'IXIA', 'Spirent', 'HP', 'Dell', 'Splunk', 'Citrix', 'Oracle'].map(partner => (
                            <span key={partner} style={{ 
                                backgroundColor: '#e3f2fd', 
                                padding: '5px 12px', 
                                borderRadius: '15px', 
                                fontSize: '0.9em',
                                border: '1px solid #1976d2'
                            }}>
                                {partner}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Government Services */}
                <div style={{ backgroundColor: '#f1f8e9', padding: '25px', borderRadius: '8px', marginBottom: '30px' }}>
                    <h4 style={{ color: '#388e3c' }}>Government Services</h4>
                    <p>
                        We strive to deliver unmatched IT engineering and support services to government agencies. Today Navon's experience supporting the government has been in a subcontracting role working with medium to large prime contract companies.
                    </p>
                </div>

                {/* Core Specialties */}
                <div style={{ marginBottom: '30px' }}>
                    <h4>Our Specialties Include:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <h5 style={{ color: '#1976d2', marginBottom: '15px' }}>Architecture & Consulting</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>Campus Data Center</li>
                                <li>Cloud (AWS & Microsoft Azure)</li>
                                <li>Service Provider Environments</li>
                            </ul>
                        </div>
                        
                        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <h5 style={{ color: '#1976d2', marginBottom: '15px' }}>Networking Solutions</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>Software Defined Networking (SDN)</li>
                                <li>Network Function Virtualization (NFV)</li>
                                <li>Quality of Service (QoS)</li>
                                <li>Capacity Planning</li>
                                <li>Segment Routing (SR) MPLS</li>
                            </ul>
                        </div>
                        
                        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <h5 style={{ color: '#1976d2', marginBottom: '15px' }}>Virtualization & Infrastructure</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>KVM & Hyper-V</li>
                                <li>Virtual Desktop Infrastructure (VDI)</li>
                                <li>Network/System Testing</li>
                                <li>CI/CD Implementation</li>
                            </ul>
                        </div>
                        
                        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <h5 style={{ color: '#1976d2', marginBottom: '15px' }}>Development & Automation</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>Java & Python Development</li>
                                <li>Automation & Orchestration</li>
                                <li>Network Security</li>
                                <li>Firewall & IPS</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Project Management */}
                <div style={{ backgroundColor: '#e8f5e8', padding: '25px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#388e3c' }}>Project Management Excellence</h4>
                    <p>
                        All our projects are managed by experienced and certified project managers, using Agile/Scrum and Waterfall methods to ensure our customers' projects are delivered with high-quality, on time and under budget.
                    </p>
                </div>
            </section>

            {/* Main Partnership Announcement */}
            <section style={{ marginBottom: '40px' }}>
                <h2>Navon Technologies Achieves AWS Select Tier and Public Sector Partnership</h2>
                <p>
                    At Navon Technologies, we started as a small team of IT enthusiasts who wanted to help small businesses overcome their technology challenges. Today, we have grown into a leading provider of IT services.
                </p>
                <p>
                    We have partnered with Ingram Micro and AWS (Amazon Web Services) to provide our customers with the best cloud solutions in the industry.
                </p>
                <p>
                    This partnership gained us access to over 200 services, greatly expanded Navon Technologies' ability to offer a comprehensive range of solutions to our customers. This breadth of services allows us to tailor solutions more precisely to meet the diverse needs of businesses, enhancing their efficiency and competitiveness in the market.
                </p>
                <p>
                    Having access to a wide array of services from AWS has clearly enhanced Navon Technologies' solutions across several key dimensions: speed, cost-effectiveness, security, reliability, and availability. These improvements are crucial for small businesses looking to optimize their IT infrastructure and operations.
                </p>
            </section>

            {/* Company Background */}
            <section style={{ marginBottom: '40px', backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
                <h2>About Navon Technologies</h2>
                <p>
                    Navon Technologies is a Service-Disabled Veteran-Owned Small Business based in Leesburg, Virginia. We provide Network, System, and Security Engineering for Small, Medium, and Large businesses to include Federal/SLED (State, Local, Education) Government enterprise networks. We also specialize in Cable, Satellite, and Telco Internet Service Provider backbone networks in the US.
                </p>
            </section>

            {/* Mission, Vision, Values */}
            <section style={{ marginBottom: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <div style={{ padding: '25px', backgroundColor: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                        <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>Our Mission</h3>
                        <p>
                            We strive to exceed the highest standards of excellence in all we do; while strategically creating and delivering reliable, secure, and innovative technology solutions.
                        </p>
                    </div>
                    <div style={{ padding: '25px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #388e3c' }}>
                        <h3 style={{ color: '#388e3c', marginBottom: '15px' }}>Our Vision</h3>
                        <p>
                            To bring the best innovation and highest value to our customers.
                        </p>
                    </div>
                    <div style={{ padding: '25px', backgroundColor: '#fff3e0', borderRadius: '8px', borderLeft: '4px solid #f57c00' }}>
                        <h3 style={{ color: '#f57c00', marginBottom: '15px' }}>Our Values</h3>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Reliability</li>
                            <li>Security</li>
                            <li>Innovation</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Brand Story */}
            <section style={{ marginBottom: '40px' }}>
                <h3>Our Brand</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <p>
                            Our logo was inspired by a plane (F-117 Nighthawk, Stealth Aircraft) and our founders' prior service in the US Air Force. Our name Navon means wisdom.
                        </p>
                        <p>
                            Like a plane and a wise owl, we strive to reach the highest point of excellence. Our goal is to soar in every component of business; in the technology aspect, like the plane and in our behaviors, like a wise owl.
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <OptimizedImage
                            src="brand/f117-nighthawk.jpg"
                            alt="F-117 Nighthawk Stealth Aircraft"
                            size="medium"
                            style={{ marginBottom: '10px' }}
                        />
                        <p style={{ fontSize: '0.9em', color: '#666', fontStyle: 'italic' }}>
                            F-117 Nighthawk - Our Logo Inspiration
                        </p>
                    </div>
                </div>
            </section>

            {/* Key Benefits */}
            <section style={{ marginBottom: '40px' }}>
                <h3>Our AWS Partnership Benefits</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <h4>Data Validation and Integrity</h4>
                        <p>We ensure data integrity through built-in validation mechanisms and automatic error handling during migration.</p>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <h4>Cost Optimization</h4>
                        <p>We optimize costs by selecting the right data storage and processing solutions post-migration, such as Amazon S3 and AWS Lambda.</p>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <h4>DevSecOps Services</h4>
                        <p>We manage cybersecurity and integrate security measures throughout the entire development lifecycle, from code creation to deployment.</p>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <h4>Automated Compliance</h4>
                        <p>We leverage AWS services like AWS Config and AWS Security Hub to automate compliance checks and ensure adherence to security best practices.</p>
                    </div>
                </div>
            </section>

            {/* Our Specialties */}
            <section>
                <h3>Our Specialties</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <OptimizedImage
                            src="specialties/networking.jpg"
                            alt="Secure Networking"
                            size="medium"
                            style={{ marginBottom: '15px' }}
                        />
                        <h4>Networking</h4>
                        <p>Secure Networking Solutions</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <OptimizedImage
                            src="specialties/app-development.jpg"
                            alt="App Development"
                            size="medium"
                            style={{ marginBottom: '15px' }}
                        />
                        <h4>App Development</h4>
                        <p>Custom Solutions</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <OptimizedImage
                            src="specialties/migrations.jpg"
                            alt="Cloud Migrations"
                            size="medium"
                            style={{ marginBottom: '15px' }}
                        />
                        <h4>Migrations</h4>
                        <p>Migration to the Cloud</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;