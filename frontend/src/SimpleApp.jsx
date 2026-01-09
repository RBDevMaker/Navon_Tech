import { useState, useEffect } from 'react';

function SimpleApp() {
    const s3BaseUrl = "https://navon-tech-images.s3.amazonaws.com";
    const [currentPage, setCurrentPage] = useState('home');

    // Handle hash changes for navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) || 'home';
            setCurrentPage(hash);
        };

        handleHashChange(); // Set initial page
        window.addEventListener('hashchange', handleHashChange);

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <div style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', lineHeight: '1.6' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                        src={`${s3BaseUrl}/public/images/logo_double_framed.jpeg`}
                        alt="Navon Technologies Logo"
                        style={{ height: '50px', marginRight: '15px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '600' }}>NAVON Technologies</h1>
                </div>
                <nav>
                    <a href="#home" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>Home</a>
                    <a href="#about" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>About</a>
                    <a href="#capabilities" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>Capabilities</a>
                    <a href="#aws" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>AWS</a>
                    <a href="#careers" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>Careers</a>
                    <a href="#contact" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>Contact</a>
                    <a href="#portal" style={{
                        background: 'white',
                        color: '#1e3a8a',
                        padding: '0.7rem 1.5rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        marginLeft: '1rem'
                    }}>Secure Portal</a>
                </nav>
            </header>

            {/* HOME PAGE */}
            {currentPage === 'home' && (
                <div>
                    {/* Hero Section */}
                    <section style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h1 style={{
                                fontSize: '3.5rem',
                                margin: '0 0 1.5rem 0',
                                color: '#1e3a8a',
                                fontWeight: '700'
                            }}>
                                Trusted Government Technology Solutions
                            </h1>
                            <p style={{
                                fontSize: '1.3rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                NAVON Technologies delivers mission-critical cloud infrastructure, cybersecurity,
                                and system engineering solutions to federal agencies and defense contractors.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <a href={`${s3BaseUrl}/public/images/NAVON_Technologies_Capability_Statement_2026.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '1rem 2rem',
                                        fontSize: '1.1rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'inline-block'
                                    }}>
                                    Download Capability Statement
                                </a>
                                <button style={{
                                    background: 'transparent',
                                    color: '#1e3a8a',
                                    border: '2px solid #1e3a8a',
                                    padding: '1rem 2rem',
                                    fontSize: '1.1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}>
                                    Request Proposal
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Trusted Partners Section */}
                    <section style={{ padding: '4rem 2rem', background: 'white' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Trusted Partners
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '2rem',
                                alignItems: 'center'
                            }}>
                                {[
                                    'AWS.jpeg',
                                    'microsoft.jpeg',
                                    'cisco.jpeg',
                                    'ratheon.jpeg',
                                    'gdit.jpeg',
                                    'jacobs.jpeg',
                                    'ingram_micro.jpeg',
                                    'vmware.jpeg'
                                ].map((partner, index) => (
                                    <div key={index} style={{
                                        background: 'white',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <img
                                            src={`${s3BaseUrl}/public/images/partners/${partner}`}
                                            alt={`Partner ${index + 1}`}
                                            style={{
                                                maxWidth: '100%',
                                                height: '80px',
                                                objectFit: 'contain'
                                            }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Certifications & AWS Badges Section */}
                    <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Certifications & AWS Badges
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '2rem',
                                alignItems: 'center'
                            }}>
                                {[
                                    'public_sector_partner.jpeg',
                                    'select_tier_partner.jpeg',
                                    'linux.jpeg'
                                ].map((cert, index) => (
                                    <div key={index} style={{
                                        background: 'white',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <img
                                            src={`${s3BaseUrl}/public/images/partners/${cert}`}
                                            alt={`Certification ${index + 1}`}
                                            style={{
                                                maxWidth: '100%',
                                                height: '100px',
                                                objectFit: 'contain'
                                            }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Contract Vehicles & SBA Section */}
                    <section style={{ padding: '4rem 2rem', background: 'white' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Contract Vehicles & SBA Certification
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '3rem',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}>
                                    <img
                                        src={`${s3BaseUrl}/public/images/partners/sba.jpeg`}
                                        alt="SBA Small Business Certification"
                                        style={{
                                            maxWidth: '100%',
                                            height: '120px',
                                            objectFit: 'contain',
                                            marginBottom: '1rem'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>
                                        SBA Certified Small Business
                                    </h3>
                                    <p style={{ color: '#475569', lineHeight: '1.6' }}>
                                        Certified Small Business Enterprise with SBA registration,
                                        enabling participation in federal set-aside contracts and
                                        small business procurement opportunities.
                                    </p>
                                </div>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}>
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', textAlign: 'center' }}>
                                        Available Contract Vehicles
                                    </h3>
                                    <div style={{ textAlign: 'left' }}>
                                        {[
                                            { name: 'GSA Schedule 70', desc: 'IT Products, Services & Solutions' },
                                            { name: 'SEWP VI', desc: 'Solutions for Enterprise-Wide Procurement' },
                                            { name: 'CIO-SP3', desc: 'Chief Information Officer-Solutions and Partners 3' },
                                            { name: 'Direct Awards', desc: 'Prime and subcontractor opportunities' }
                                        ].map((vehicle, index) => (
                                            <div key={index} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'white', borderRadius: '6px' }}>
                                                <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                                                    {vehicle.name}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                    {vehicle.desc}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ABOUT PAGE */}
            {currentPage === 'about' && (
                <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '3rem',
                            textAlign: 'center',
                            color: '#1e3a8a',
                            fontWeight: '600'
                        }}>
                            About NAVON Technologies
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '3rem',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                                    Mission-Critical Technology Solutions
                                </h3>
                                <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                    NAVON Technologies is a trusted government contractor specializing in secure,
                                    scalable technology solutions for federal agencies and defense organizations.
                                    We combine deep technical expertise with security clearance capabilities to
                                    deliver mission-critical systems.
                                </p>
                                <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                    Our team of certified engineers and security professionals brings decades of
                                    experience in government contracting, ensuring compliance with federal standards
                                    and regulations while delivering innovative solutions.
                                </p>
                                <div style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>Key Differentiators</h4>
                                    <ul style={{ color: '#475569', paddingLeft: '1.5rem' }}>
                                        <li style={{ marginBottom: '0.5rem' }}>Security clearance certified team</li>
                                        <li style={{ marginBottom: '0.5rem' }}>FedRAMP and NIST compliance expertise</li>
                                        <li style={{ marginBottom: '0.5rem' }}>24/7 mission-critical support</li>
                                        <li style={{ marginBottom: '0.5rem' }}>Proven government contracting track record</li>
                                    </ul>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <img
                                    src={`${s3BaseUrl}/public/images/Poster_no_logo.png`}
                                    alt="NAVON Technologies Overview"
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                                    }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {/* CAPABILITIES PAGE */}
            {currentPage === 'capabilities' && (
                <section style={{ padding: '4rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '3rem',
                            textAlign: 'center',
                            color: '#1e3a8a',
                            fontWeight: '600'
                        }}>
                            Core Capabilities
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem'
                        }}>
                            {[
                                {
                                    title: 'Cybersecurity Solutions',
                                    image: 'CyberSecurity.jpeg',
                                    description: 'Comprehensive security frameworks, risk assessment, and compliance solutions for federal agencies.'
                                },
                                {
                                    title: 'System Engineering',
                                    image: 'System_Engineering.jpeg',
                                    description: 'End-to-end system design, integration, and optimization for mission-critical applications.'
                                },
                                {
                                    title: 'Cloud Migration & DevOps',
                                    image: 'Virtualization_Cloud.jpeg',
                                    description: 'Secure cloud transformation and automated deployment pipelines for government workloads.'
                                },
                                {
                                    title: 'Project Management',
                                    image: 'Project_Management.jpeg',
                                    description: 'Agile project delivery with security clearance and compliance expertise.'
                                },
                                {
                                    title: 'Secure Networking',
                                    image: 'Secure_Networking_Building.jpeg',
                                    description: 'Enterprise-grade network architecture and security implementation.'
                                },
                                {
                                    title: 'Application Development',
                                    image: 'App_and_Software_Development.jpeg',
                                    description: 'Custom software solutions with security-first development practices.'
                                }
                            ].map((capability, index) => (
                                <div key={index} style={{
                                    background: '#f8fafc',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                    transition: 'transform 0.2s ease'
                                }}>
                                    <img
                                        src={`${s3BaseUrl}/public/images/solutions/${capability.image}`}
                                        alt={capability.title}
                                        style={{
                                            width: '100%',
                                            height: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            marginBottom: '1rem'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.3rem' }}>
                                        {capability.title}
                                    </h3>
                                    <p style={{ color: '#475569', lineHeight: '1.6' }}>
                                        {capability.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {/* AWS PAGE */}
            {currentPage === 'aws' && (
                <section style={{ padding: '4rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '3rem',
                            textAlign: 'center',
                            color: '#1e3a8a',
                            fontWeight: '600'
                        }}>
                            AWS Expertise & Services
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {[
                                { name: 'AWS Lambda', file: 'AWS_Lambda.jpeg' },
                                { name: 'Amazon S3', file: 'Amazon_S3.jpeg' },
                                { name: 'API Gateway', file: 'API_Gateway.jpg' },
                                { name: 'AWS Cognito', file: 'AWS_Cognito_and_Authentication.png' },
                                { name: 'AWS DevOps', file: 'AWS_DevOps.jpeg' },
                                { name: 'AWS Security Hub', file: 'AWS_Security_Hub.jpeg' },
                                { name: 'ECS & EKS', file: 'Amazon_ECS_and_EKS.jpg' },
                                { name: 'IAM', file: 'IAM.jpg' }
                            ].map((service, index) => (
                                <div key={index} style={{
                                    background: '#f8fafc',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <img
                                        src={`${s3BaseUrl}/public/images/services/${service.file}`}
                                        alt={service.name}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'contain',
                                            marginBottom: '1rem'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <h4 style={{ color: '#1e3a8a', margin: 0, fontSize: '1rem' }}>
                                        {service.name}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {/* CAREERS PAGE */}
            {currentPage === 'careers' && (
                <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '3rem',
                            textAlign: 'center',
                            color: '#1e3a8a',
                            fontWeight: '600'
                        }}>
                            Join Our Mission-Critical Team
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {[
                                {
                                    title: 'Senior Cloud Security Engineer',
                                    clearance: 'Secret Clearance Required',
                                    location: 'Remote/DC Metro',
                                    description: 'Lead cybersecurity initiatives for federal cloud infrastructure. AWS certifications preferred.',
                                    requirements: ['Security+ Certification', '5+ years AWS experience', 'Federal contracting experience']
                                },
                                {
                                    title: 'DevOps Systems Engineer',
                                    clearance: 'Public Trust',
                                    location: 'Hybrid - DC Area',
                                    description: 'Design and implement CI/CD pipelines for government applications using AWS services.',
                                    requirements: ['AWS Solutions Architect', 'Kubernetes experience', 'Infrastructure as Code']
                                },
                                {
                                    title: 'Project Manager - Federal Contracts',
                                    clearance: 'Secret Clearance Preferred',
                                    location: 'Remote',
                                    description: 'Manage complex government technology projects with agile methodologies.',
                                    requirements: ['PMP Certification', 'Government contracting', 'Agile/Scrum Master']
                                }
                            ].map((job, index) => (
                                <div key={index} style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}>
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.3rem' }}>
                                        {job.title}
                                    </h3>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <span style={{
                                            background: '#fef3c7',
                                            color: '#92400e',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            marginRight: '0.5rem'
                                        }}>
                                            {job.clearance}
                                        </span>
                                        <span style={{
                                            background: '#e0f2fe',
                                            color: '#0369a1',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                            {job.location}
                                        </span>
                                    </div>
                                    <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                        {job.description}
                                    </p>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ color: '#1e3a8a', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                            Key Requirements:
                                        </h4>
                                        <ul style={{ color: '#475569', paddingLeft: '1.5rem', margin: 0 }}>
                                            {job.requirements.map((req, reqIndex) => (
                                                <li key={reqIndex} style={{ marginBottom: '0.25rem' }}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}>
                                        Apply Now
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            background: 'white',
                            padding: '3rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                                Why Work at NAVON Technologies?
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '2rem',
                                marginTop: '2rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                                    <h4 style={{ color: '#1e3a8a', marginBottom: '0.5rem' }}>Security Clearance</h4>
                                    <p style={{ color: '#475569', fontSize: '0.9rem' }}>Sponsorship available for qualified candidates</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
                                    <h4 style={{ color: '#1e3a8a', marginBottom: '0.5rem' }}>Competitive Benefits</h4>
                                    <p style={{ color: '#475569', fontSize: '0.9rem' }}>Health, dental, 401k, and professional development</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                                    <h4 style={{ color: '#1e3a8a', marginBottom: '0.5rem' }}>Remote Flexibility</h4>
                                    <p style={{ color: '#475569', fontSize: '0.9rem' }}>Work from anywhere with secure access</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                                    <h4 style={{ color: '#1e3a8a', marginBottom: '0.5rem' }}>Mission Impact</h4>
                                    <p style={{ color: '#475569', fontSize: '0.9rem' }}>Support critical government operations</p>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <button style={{
                                    background: 'transparent',
                                    color: '#1e3a8a',
                                    border: '2px solid #1e3a8a',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    marginRight: '1rem'
                                }}>
                                    View All Positions
                                </button>
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}>
                                    Submit Resume
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {/* CONTACT PAGE */}
            {currentPage === 'contact' && (
                <section style={{
                    padding: '4rem 2rem',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                    color: 'white'
                }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}>
                            Ready to Secure Your Mission?
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '3rem',
                            marginTop: '3rem'
                        }}>
                            <div>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Government Contracting</h3>
                                <p style={{ marginBottom: '1rem', opacity: '0.9' }}>
                                    CAGE Code: Available upon request<br />
                                    DUNS Number: Available upon request<br />
                                    Security Clearance: Available
                                </p>
                            </div>
                            <div>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Contact Information</h3>
                                <p style={{ marginBottom: '1rem', opacity: '0.9' }}>
                                    Email: contracts@navontech.com<br />
                                    Phone: Available upon request<br />
                                    Response Time: 24 hours
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <a href={`${s3BaseUrl}/public/images/NAVON_Technologies_Capability_Statement_2026.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: 'white',
                                    color: '#1e3a8a',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    marginRight: '1rem'
                                }}>
                                Download Capability Statement
                            </a>
                            <button style={{
                                background: 'transparent',
                                color: 'white',
                                border: '2px solid white',
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}>
                                Request Security Briefing
                            </button>
                        </div>
                    </div>
                </section>
            )}
            {/* PORTAL PAGE - EXACTLY AS YOU LOVE IT */}
            {currentPage === 'portal' && (
                <section style={{ padding: '4rem 2rem', background: '#f1f5f9' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Secure Employee Portal
                            </h2>
                            <p style={{
                                fontSize: '1.1rem',
                                marginBottom: '2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Multi-factor authentication, role-based access control, and encrypted communications
                                for classified and sensitive project management.
                            </p>
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                display: 'inline-block'
                            }}>
                                <p style={{ color: '#64748b', margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                    🔒 Authentication powered by AWS Cognito
                                </p>
                                <p style={{ color: '#64748b', margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                    🛡️ Security clearance verification required
                                </p>
                                <p style={{ color: '#64748b', margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                    📋 End-to-end encrypted document management
                                </p>
                            </div>
                        </div>

                        {/* Portal Features Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* Tools Section */}
                            <div style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        marginRight: '1rem'
                                    }}>
                                        🛠️
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem' }}>
                                        Secure Tools & Applications
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    {[
                                        { name: 'AWS Console Access', status: 'Active', clearance: 'Secret' },
                                        { name: 'Project Management Suite', status: 'Active', clearance: 'Public Trust' },
                                        { name: 'Secure Code Repository', status: 'Active', clearance: 'Secret' },
                                        { name: 'Encrypted Communications', status: 'Active', clearance: 'Top Secret' },
                                        { name: 'Time Tracking System', status: 'Active', clearance: 'Public Trust' },
                                        { name: 'Security Compliance Dashboard', status: 'Active', clearance: 'Secret' }
                                    ].map((tool, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            background: '#f8fafc',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '0.9rem' }}>
                                                    {tool.name}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    Clearance: {tool.clearance}
                                                </div>
                                            </div>
                                            <span style={{
                                                background: '#10b981',
                                                color: 'white',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {tool.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    width: '100%'
                                }}>
                                    Access Tools Dashboard
                                </button>
                            </div>
                            {/* Employee Profile Section */}
                            <div style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        marginRight: '1rem'
                                    }}>
                                        👤
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem' }}>
                                        Employee Profile & Directory
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                background: '#1e3a8a',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.5rem',
                                                marginRight: '1rem'
                                            }}>
                                                JD
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1e3a8a' }}>John Doe</div>
                                                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Senior Cloud Engineer</div>
                                                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Clearance: Secret</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            <div style={{ marginBottom: '0.5rem' }}>📧 john.doe@navontech.com</div>
                                            <div style={{ marginBottom: '0.5rem' }}>📱 +1 (555) 123-4567</div>
                                            <div style={{ marginBottom: '0.5rem' }}>🏢 Remote - DC Metro Area</div>
                                            <div>📅 Start Date: January 15, 2024</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '0.5rem',
                                        fontSize: '0.85rem'
                                    }}>
                                        <div style={{
                                            background: '#fef3c7',
                                            color: '#92400e',
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            fontWeight: '600'
                                        }}>
                                            AWS Certified
                                        </div>
                                        <div style={{
                                            background: '#dcfce7',
                                            color: '#166534',
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            fontWeight: '600'
                                        }}>
                                            Security+ Cert
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        flex: 1,
                                        fontSize: '0.9rem'
                                    }}>
                                        Edit Profile
                                    </button>
                                    <button style={{
                                        background: 'transparent',
                                        color: '#1e3a8a',
                                        border: '2px solid #1e3a8a',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        flex: 1,
                                        fontSize: '0.9rem'
                                    }}>
                                        Directory
                                    </button>
                                </div>
                            </div>
                            {/* Documents Section */}
                            <div style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        marginRight: '1rem'
                                    }}>
                                        📁
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem' }}>
                                        Secure Document Management
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    {[
                                        {
                                            name: 'Project Alpha - Technical Specs',
                                            type: 'PDF',
                                            classification: 'Secret',
                                            modified: '2 hours ago',
                                            size: '2.4 MB'
                                        },
                                        {
                                            name: 'Security Compliance Report Q1',
                                            type: 'DOCX',
                                            classification: 'Confidential',
                                            modified: '1 day ago',
                                            size: '856 KB'
                                        },
                                        {
                                            name: 'AWS Architecture Diagrams',
                                            type: 'ZIP',
                                            classification: 'Internal',
                                            modified: '3 days ago',
                                            size: '15.2 MB'
                                        },
                                        {
                                            name: 'Employee Handbook 2026',
                                            type: 'PDF',
                                            classification: 'Unclassified',
                                            modified: '1 week ago',
                                            size: '1.8 MB'
                                        }
                                    ].map((doc, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            background: '#f8fafc',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontWeight: '600',
                                                    color: '#1e3a8a',
                                                    fontSize: '0.9rem',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {doc.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {doc.type} • {doc.size} • Modified {doc.modified}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                                                <span style={{
                                                    background: doc.classification === 'Secret' ? '#fecaca' :
                                                        doc.classification === 'Confidential' ? '#fed7aa' :
                                                            doc.classification === 'Internal' ? '#fef3c7' : '#e0f2fe',
                                                    color: doc.classification === 'Secret' ? '#991b1b' :
                                                        doc.classification === 'Confidential' ? '#9a3412' :
                                                            doc.classification === 'Internal' ? '#92400e' : '#0369a1',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    display: 'block',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {doc.classification}
                                                </span>
                                                <button style={{
                                                    background: 'transparent',
                                                    color: '#1e3a8a',
                                                    border: '1px solid #1e3a8a',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        flex: 1,
                                        fontSize: '0.9rem'
                                    }}>
                                        Upload Document
                                    </button>
                                    <button style={{
                                        background: 'transparent',
                                        color: '#1e3a8a',
                                        border: '2px solid #1e3a8a',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        flex: 1,
                                        fontSize: '0.9rem'
                                    }}>
                                        Browse All
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Portal Access Notice */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                            color: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                                🔐 Secure Access Required
                            </h3>
                            <p style={{ marginBottom: '1.5rem', opacity: '0.9' }}>
                                Access to the employee portal requires multi-factor authentication and valid security clearance.
                                All activities are logged and monitored for compliance.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button style={{
                                    background: 'white',
                                    color: '#1e3a8a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}>
                                    Employee Login
                                </button>
                                <button style={{
                                    background: 'transparent',
                                    color: 'white',
                                    border: '2px solid white',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}>
                                    Request Access
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer style={{
                padding: '3rem 2rem 2rem 2rem',
                background: '#0f172a',
                color: 'white'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <div>
                            <h4 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>NAVON Technologies</h4>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem' }}>
                                Trusted government technology solutions with security clearance and compliance expertise.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Services</h4>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem', margin: '0.5rem 0' }}>Cybersecurity</p>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem', margin: '0.5rem 0' }}>System Engineering</p>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem', margin: '0.5rem 0' }}>Cloud Migration</p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Compliance</h4>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem', margin: '0.5rem 0' }}>FedRAMP Ready</p>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem', margin: '0.5rem 0' }}>NIST Framework</p>
                            <p style={{ opacity: '0.8', fontSize: '0.9rem', margin: '0.5rem 0' }}>SOC 2 Compliant</p>
                        </div>
                    </div>
                    <div style={{
                        borderTop: '1px solid #334155',
                        paddingTop: '2rem',
                        textAlign: 'center',
                        opacity: '0.7'
                    }}>
                        <p>&copy; 2026 NAVON Technologies. Secure by Design. Built with AWS.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default SimpleApp;