import { useState, useEffect } from 'react';

function SimpleApp() {
    const s3BaseUrl = "https://navon-tech-images.s3.us-east-1.amazonaws.com";
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
            <style>{`
                button:hover, .btn:hover, a[style*="background"]:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.15) !important;
                    transition: all 0.3s ease;
                }
                button, .btn, a[style*="background"] {
                    transition: all 0.3s ease;
                }
            `}</style>
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
                        alt="Logo"
                        style={{ height: '50px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                <nav>
                    <a href="#home" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>Home</a>
                    <a href="#about" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>About</a>
                    <a href="#capabilities" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500' }}>Services</a>
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
                            
                            <div 
                                style={{
                                backgroundColor: '#f8fafc',
                                padding: '2rem',
                                borderRadius: '12px',
                                margin: '0 auto 2rem auto',
                                maxWidth: '900px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h2 style={{
                                    fontSize: '1.8rem',
                                    color: '#1e3a8a',
                                    fontStyle: 'italic',
                                    textAlign: 'center',
                                    margin: '0 0 1.5rem 0',
                                    fontWeight: '700'
                                }}>
                                    Welcome to wiser technology solutions, we take technology higher!
                                </h2>
                                
                                <p style={{
                                    fontSize: '1.1rem',
                                    color: '#475569',
                                    lineHeight: '1.7',
                                    marginBottom: '1.5rem'
                                }}>
                                    Navon Technologies is a Service-Disabled Veteran-Owned Small Business and AWS Partner serving both public and private sectors. We provide technical services for development, automation, testing, implementation, and maintenance support for our customers' mission and business for critical applications whether they are on-prem or in the cloud.
                                </p>
                                
                                <p style={{
                                    fontSize: '1.1rem',
                                    color: '#475569',
                                    lineHeight: '1.7',
                                    margin: '0'
                                }}>
                                    At Navon Technologies, we started as a small team of IT enthusiasts who wanted to help businesses overcome their technology challenges. We have partnered with AWS (Amazon Web Services) to provide our customers with the best cloud solutions in the industry. This partnership gained us access to over 200 AWS services. We specialize in Migration, Networking, Security, Web Site and App Development.
                                </p>
                            </div>
                            
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
                                    { file: 'AWS.jpeg', name: 'AWS' },
                                    { file: 'microsoft.jpeg', name: 'Microsoft' },
                                    { file: 'cisco.jpeg', name: 'Cisco' },
                                    { file: 'ratheon.jpeg', name: 'Raytheon' },
                                    { file: 'gdit.jpeg', name: 'GDIT' },
                                    { file: 'jacobs.jpeg', name: 'Jacobs' },
                                    { file: 'ingram_micro.jpeg', name: 'Ingram Micro' },
                                    { file: 'vmware.jpeg', name: 'VMware' },
                                    { file: 'archfield.jpeg', name: 'Archfield' },
                                    { file: 'saic.jpeg', name: 'SAIC' },
                                    { file: 'amentum.jpeg', name: 'Amentum' },
                                    { file: 'nightwing.jpeg', name: 'Nightwing' },
                                    { file: 'bae_systems.jpeg', name: 'BAE Systems' },
                                    { file: 'versa.jpeg', name: 'Versa' }
                                ].map((partner, index) => (
                                    <div key={index} style={{
                                        background: 'white',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        minHeight: '120px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <img
                                            src={`${s3BaseUrl}/public/images/partners/${partner.file}`}
                                            alt={partner.name}
                                            style={{
                                                maxWidth: '100%',
                                                height: '80px',
                                                objectFit: 'contain'
                                            }}
                                            onError={(e) => { 
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div style={{
                                            display: 'none',
                                            color: '#1e3a8a',
                                            fontWeight: '600',
                                            fontSize: '1.1rem'
                                        }}>
                                            {partner.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Certifications Section */}
                    <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Certifications
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '2rem',
                                alignItems: 'center'
                            }}>
                                {[
                                    'public_sector_partner.jpeg',
                                    'select_tier_partner.jpeg'
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

                                {/* AWS Certification Placeholders */}
                                {[
                                    'AWS Certified Cloud Practitioner',
                                    'AWS Certified Developer',
                                    'AWS Solutions Architect',
                                    'AWS Cloud Business Accreditation',
                                    'Scrum Alliance (CSM) Certified',
                                    'Agile Certified Practitioner',
                                    'CCIE Routing and Switching',
                                    'CCIE Service Provider',
                                    'CCIE Data Center',
                                    'Project Management Professional (PMP)'
                                ].map((awsCert, index) => (
                                    <div key={`aws-${index}`} style={{
                                        background: 'white',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        border: '2px dashed #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        minHeight: '140px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: '#f1f5f9',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem auto',
                                            color: '#64748b',
                                            fontSize: '1.5rem'
                                        }}>
                                            ☁️
                                        </div>
                                        <h4 style={{
                                            color: '#64748b',
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}>
                                            {awsCert}
                                        </h4>
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
                    
                    {/* Additional Home Sections */}
                    <section style={{ padding: '4rem 2rem', background: 'white' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                                gap: '3rem' 
                            }}>
                                {/* Satisfaction Guaranteed */}
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{ 
                                        color: '#1e3a8a', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.5rem',
                                        fontWeight: '600'
                                    }}>
                                        Satisfaction Guaranteed
                                    </h3>
                                    <p style={{ 
                                        color: '#475569', 
                                        lineHeight: '1.7',
                                        marginBottom: '1rem'
                                    }}>
                                        The world of technology can be fast-paced and scary. That's why our goal is to provide an experience that is tailored to your company's needs. No matter the budget, we pride ourselves on providing professional customer service.
                                    </p>
                                    <p style={{ 
                                        color: '#1e3a8a', 
                                        fontWeight: '600',
                                        margin: '0'
                                    }}>
                                        We guarantee you will be satisfied with our work.
                                    </p>
                                </div>
                                
                                {/* Services and Solutions */}
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{ 
                                        color: '#1e3a8a', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.5rem',
                                        fontWeight: '600'
                                    }}>
                                        Services and Solutions
                                    </h3>
                                    <p style={{ 
                                        color: '#475569', 
                                        lineHeight: '1.7',
                                        marginBottom: '1.5rem'
                                    }}>
                                        Do you spend most of your IT budget on maintaining your current system? Many companies find that constant maintenance eats into their budget for new technology. By outsourcing your IT management to us, you can focus on what you do best--running your business.
                                    </p>
                                    <div style={{ textAlign: 'center' }}>
                                        <a href="#capabilities" style={{
                                            background: '#1e3a8a',
                                            color: 'white',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            display: 'inline-block'
                                        }}>
                                            See Services
                                        </a>
                                    </div>
                                </div>
                                
                                {/* Technical Experience */}
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{ 
                                        color: '#1e3a8a', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.5rem',
                                        fontWeight: '600'
                                    }}>
                                        Technical Experience
                                    </h3>
                                    <p style={{ 
                                        color: '#475569', 
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Navon employees highly skilled personnel and maintains certifications at the highest level of expertise. We are well-versed in a variety of operating systems, networks, and databases. We have a history with working with complex projects with just about any technology that a business would encounter. We use this expertise to help customers with small to large projects.
                                    </p>
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
                            backgroundColor: '#f8fafc',
                            padding: '2rem',
                            borderRadius: '8px',
                            marginBottom: '3rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <p style={{ 
                                color: '#1e3a8a', 
                                lineHeight: '1.8', 
                                fontSize: '1.1rem',
                                margin: '0',
                                textAlign: 'center',
                                fontWeight: '500'
                            }}>
                                Navon Technologies is a Service-Disabled Veteran-Owned Small Business based in Leesburg, Virginia. We provide Network, System, and Security Engineering for Small, Medium, and Large businesses to include Federal/SLED (State, Local, Education) Government enterprise networks. We also specialize in Cable, Satellite, and Telco Internet Service Provider backbone networks in the US.
                            </p>
                        </div>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '3rem',
                            alignItems: 'flex-start',
                            marginBottom: '3rem'
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
                            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
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
                        
                        {/* Mission, Vision, Values, Brand */}
                        <div style={{ marginTop: '4rem' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                                gap: '2rem',
                                marginBottom: '3rem'
                            }}>
                                <div style={{ 
                                    backgroundColor: '#dbeafe', 
                                    padding: '2rem', 
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #3b82f6'
                                }}>
                                    <h3 style={{ color: '#1e40af', marginBottom: '1rem', fontSize: '1.3rem' }}>Our Mission</h3>
                                    <p style={{ color: '#1e3a8a', lineHeight: '1.6', margin: '0' }}>
                                        We strive to exceed the highest standards of excellence in all we do; while strategically creating and delivering reliable, secure, and innovative technology solutions.
                                    </p>
                                </div>
                                
                                <div style={{ 
                                    backgroundColor: '#e0f2fe', 
                                    padding: '2rem', 
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #0ea5e9'
                                }}>
                                    <h3 style={{ color: '#0c4a6e', marginBottom: '1rem', fontSize: '1.3rem' }}>Our Vision</h3>
                                    <p style={{ color: '#075985', lineHeight: '1.6', margin: '0' }}>
                                        To bring the best innovation and highest value to our customers.
                                    </p>
                                </div>
                                
                                <div style={{ 
                                    backgroundColor: '#f0f9ff', 
                                    padding: '2rem', 
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #0284c7'
                                }}>
                                    <h3 style={{ color: '#0c4a6e', marginBottom: '1rem', fontSize: '1.3rem' }}>Our Values</h3>
                                    <ul style={{ color: '#075985', margin: '0', paddingLeft: '1.5rem' }}>
                                        <li style={{ marginBottom: '0.5rem' }}>Reliability</li>
                                        <li style={{ marginBottom: '0.5rem' }}>Security</li>
                                        <li style={{ marginBottom: '0.5rem' }}>Innovation</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Brand Story */}
                            <div style={{
                                backgroundColor: 'white',
                                padding: '2rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Our Brand</h3>
                                <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '1rem' }}>
                                    Our logo was inspired by a plane (F-117 Nighthawk, Stealth Aircraft) and our founders' prior service in the US Air Force. Our name Navon means wisdom.
                                </p>
                                <p style={{ color: '#475569', lineHeight: '1.8', margin: '0' }}>
                                    Like a plane and a wise owl, we strive to reach the highest point of excellence. Our goal is to soar in every component of business; in the technology aspect, like the plane and in our behaviors, like a wise owl.
                                </p>
                            </div>
                        </div>
                        
                        {/* Capability Statement Link */}
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <a href={`${s3BaseUrl}/public/images/NAVON_Technologies_Capability_Statement_2026.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    fontSize: '1.1rem'
                                }}>
                                📄 Download Our Capability Statement
                            </a>
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
                                    title: 'Application & Software Development',
                                    image: 'App_and_Software_Development.jpeg',
                                    description: 'Custom software solutions with security-first development practices.'
                                },
                                {
                                    title: 'Hardware & Product Development',
                                    image: 'Hardware_and_Product_Development.jpeg',
                                    description: 'Custom hardware solutions and product development for specialized government requirements.'
                                },
                                {
                                    title: 'Artificial Intelligence & Machine Learning',
                                    image: 'AI_Machine_Learning.jpeg',
                                    description: 'Advanced AI/ML solutions for data analysis, automation, and intelligent decision-making systems.'
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

                        {/* Professional IT Services Section */}
                        <section style={{ marginTop: '4rem' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Professional IT Services for Your Business
                            </h2>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                gap: '2rem'
                            }}>
                                {/* Managed IT Services */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Managed IT Services
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our Managed IT Services provide comprehensive IT support and management for your business. We will proactively monitor your network and systems, handle all updates and patches, and provide fast and reliable support when you need it.
                                    </p>
                                </div>

                                {/* Cloud Services */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Cloud Services
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our Cloud Services provide a reliable and scalable solution for your business needs. We offer cloud migration, secure data storage, and cloud-based software solutions to help your business operate more efficiently and effectively.
                                    </p>
                                </div>

                                {/* Cybersecurity Services */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Cybersecurity Services
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our Cybersecurity Services provide comprehensive protection for your business against cyber threats. We offer risk assessments, vulnerability testing, threat monitoring, and training to ensure your business is secure.
                                    </p>
                                </div>

                                {/* Network Design and Implementation */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Network Design and Implementation
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our Network Design and Implementation services provide customized network solutions for your business. We will assess your needs, design a network architecture, and implement the solution to ensure your business runs smoothly.
                                    </p>
                                </div>

                                {/* Data Backup and Recovery */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Data Backup and Recovery
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our Data Backup and Recovery services provide peace of mind knowing your business data is secure and recoverable. We will set up automatic backups, test recovery processes, and ensure your data is safe in the event of a disaster.
                                    </p>
                                </div>

                                {/* IT Consulting Services */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        IT Consulting Services
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our IT Consulting Services provide expert advice and guidance to help your business make informed decisions about technology. We will assess your current systems, identify areas for improvement, and provide recommendations to help your business grow.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>
            )}
            {/* AWS PAGE */}
            {currentPage === 'aws' && (
                <section style={{ padding: '4rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            color: '#1e3a8a',
                            fontWeight: '600'
                        }}>
                            AWS Expertise & Services
                        </h2>
                        
                        {/* NEWS FLASH - AWS Partnership Announcement */}
                        <div style={{
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            marginBottom: '3rem',
                            border: '3px solid #3b82f6',
                            boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                height: '4px',
                                background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)',
                                animation: 'pulse 2s infinite'
                            }}></div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ 
                                    fontSize: '1.5rem', 
                                    marginRight: '1rem',
                                    animation: 'pulse 1.5s infinite'
                                }}>🚨</span>
                                <h3 style={{ 
                                    color: '#fbbf24', 
                                    margin: '0', 
                                    fontSize: '1.4rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    BREAKING NEWS
                                </h3>
                            </div>
                            
                            <h4 style={{ 
                                color: 'white', 
                                marginBottom: '1.5rem', 
                                fontSize: '1.6rem',
                                fontWeight: '600',
                                lineHeight: '1.3'
                            }}>
                                Navon Technologies Achieves AWS Select Tier and Public Sector Partnership
                            </h4>
                            
                            <div style={{ fontSize: '1rem', lineHeight: '1.7', color: '#e2e8f0' }}>
                                <p style={{ marginBottom: '1rem' }}>
                                    At Navon Technologies, we started as a small team of IT enthusiasts who wanted to help small businesses overcome their technology challenges. Today, we have grown into a leading provider of IT services.
                                </p>
                                
                                <p style={{ marginBottom: '1rem' }}>
                                    We have partnered with Ingram Micro and AWS (Amazon Web Services) to provide our customers with the best cloud solutions in the industry. This partnership gained us access to over 200 services, greatly expanded Navon Technologies' ability to offer a comprehensive range of solutions to our customers.
                                </p>
                                
                                <p style={{ marginBottom: '1rem' }}>
                                    Having access to a wide array of services from AWS has clearly enhanced Navon Technologies' solutions across several key dimensions: speed, cost-effectiveness, security, reliability, and availability. These improvements are crucial for small businesses looking to optimize their IT infrastructure and operations.
                                </p>
                                
                                <div style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                    padding: '1.5rem', 
                                    borderRadius: '8px',
                                    marginTop: '1.5rem'
                                }}>
                                    <h5 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                        Key Partnership Benefits:
                                    </h5>
                                    <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#cbd5e0' }}>
                                        <li style={{ marginBottom: '0.5rem' }}>
                                            <strong>Data Validation & Integrity:</strong> Built-in validation mechanisms and automatic error handling during migration
                                        </li>
                                        <li style={{ marginBottom: '0.5rem' }}>
                                            <strong>Cost Optimization:</strong> Right-sized data storage and processing solutions using Amazon S3 and AWS Lambda
                                        </li>
                                        <li style={{ marginBottom: '0.5rem' }}>
                                            <strong>DevSecOps Services:</strong> Integrated security measures throughout the entire development lifecycle
                                        </li>
                                        <li style={{ marginBottom: '0' }}>
                                            <strong>Automated Compliance:</strong> AWS Config and Security Hub for automated compliance checks and security best practices
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
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
                                { name: 'IAM', file: 'IAM.jpg' },
                                { name: 'React & Amplify', file: 'React_and_Amplify.jpg' },
                                { name: 'Route 53 & Domains', file: 'Route_53_Domains.jpg' },
                                { name: 'DynamoDB', file: 'Dynamo_DB.jpeg' },
                                { name: 'AWS Shield / WAF', file: 'AWS_Shield_WAF.jpeg' }
                            ].map((service, index) => {
                                const getImageSrc = (service) => {
                                    if (service.name === 'DynamoDB') return `${s3BaseUrl}/Dynamo_DB.jpeg`;
                                    if (service.name === 'AWS Shield / WAF') return `${s3BaseUrl}/AWS_Shield_WAF.jpeg`;
                                    return `${s3BaseUrl}/public/images/services/${service.file}`;
                                };
                                
                                return (
                                <div key={index} style={{
                                    background: '#f8fafc',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <img
                                        src={getImageSrc(service)}
                                        alt={service.name}
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            objectFit: 'contain',
                                            marginBottom: '1rem'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <h4 style={{ color: '#1e3a8a', margin: 0, fontSize: '1rem' }}>
                                        {service.name}
                                    </h4>
                                </div>
                                );
                            })}
                        </div>
                        
                        {/* And many more text */}
                        <div style={{ 
                            textAlign: 'center', 
                            marginTop: '2rem',
                            fontSize: '1.2rem',
                            color: '#1e3a8a',
                            fontWeight: '600',
                            fontStyle: 'italic'
                        }}>
                            ...and many more!
                        </div>

                        {/* IT Services Section */}
                        <div style={{ marginTop: '4rem' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#1e3a8a',
                                fontWeight: '600'
                            }}>
                                Boost Your Project with Navon Technologies IT Services
                            </h2>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                gap: '2rem'
                            }}>
                                {/* Custom Software Development */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Custom Software Development
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        Our team of developers can help you create custom software tailored to your project needs. From web applications to mobile apps, we can develop software that can help streamline your project processes.
                                    </p>
                                </div>

                                {/* Hardware Procurement and Installation */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Hardware Procurement and Installation
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        We help small businesses procure and install hardware that is best suited to their business needs. Our team can provide expert advice on hardware selection and installation.
                                    </p>
                                </div>

                                {/* IT Training and Support */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        IT Training and Support
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        We provide IT training and support to ensure that your employees can make the most of the technology available to them. Our training and support services include on-site training, virtual training, and support via phone and email.
                                    </p>
                                </div>

                                {/* Website Design and Development */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Website Design and Development
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        We specialize in designing and developing websites that are visually appealing, user-friendly, and optimized for search engines. Our websites are designed to help small businesses establish a strong online presence.
                                    </p>
                                </div>

                                {/* Cloud Migration */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        Cloud Migration
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        We help small businesses migrate to the cloud to enable greater flexibility and scalability. Our team can help you choose the best cloud solution for your business and ensure a smooth migration process.
                                    </p>
                                </div>

                                {/* IT Project Management */}
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        marginBottom: '1rem',
                                        fontSize: '1.3rem',
                                        fontWeight: '600'
                                    }}>
                                        IT Project Management
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0'
                                    }}>
                                        We provide IT project management services to ensure that your IT projects are completed on time, within budget, and to your satisfaction. Our project management services include project planning, resource allocation, and risk management.
                                    </p>
                                </div>
                            </div>
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
                        
                        {/* Social Media Section */}
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Connect With Us</h3>
                            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                <a href="https://facebook.com/navontechnologies" target="_blank" rel="noopener noreferrer" style={{
                                    color: 'white',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    📘 Facebook
                                </a>
                                <a href="https://instagram.com/navontechnologies" target="_blank" rel="noopener noreferrer" style={{
                                    color: 'white',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    📷 Instagram
                                </a>
                                <a href="https://linkedin.com/company/navon-technologies" target="_blank" rel="noopener noreferrer" style={{
                                    color: 'white',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    💼 LinkedIn
                                </a>
                            </div>
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
                padding: '1rem',
                background: '#1e3a8a',
                color: 'white'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        gap: '2rem'
                    }}>
                        <div style={{ textAlign: 'left' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#e2e8f0' }}>
                                Navon Technologies
                            </h4>
                            <div style={{ margin: '0', fontSize: '0.9rem', fontStyle: 'italic', color: '#94a3b8' }}>
                                <div>A wiser technology solutions,</div>
                                <div>we take technology higher!</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#e2e8f0' }}>
                                Contact us
                            </h4>
                            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                161 Fort Evans Rd NE Suite 210, Leesburg, VA 20176
                            </p>
                            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                Phone: 571-477-2727 &nbsp;&nbsp; Fax: 571-477-2727
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#e2e8f0' }}>
                                Compliance & Trust
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                                <a href="#accessibility" style={{
                                    color: '#cbd5e0',
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    transition: 'color 0.3s ease'
                                }}>
                                    Accessibility Statement
                                </a>
                                <a href="#security-compliance" style={{
                                    color: '#cbd5e0',
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    transition: 'color 0.3s ease'
                                }}>
                                    Security & Compliance
                                </a>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', borderTop: '1px solid white', paddingTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: '0.8' }}>
                            Copyright © 2021 Navon Technologies - All Rights Reserved | Secure by Design | Built with AWS.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default SimpleApp;