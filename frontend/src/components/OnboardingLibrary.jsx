import React, { useState, useRef } from 'react';

// Interactive hotspot on the shelf - invisible overlay
function ShelfItem({ item, onClick, style }) {
    const [hover, setHover] = useState(false);
    
    return (
        <div
            onClick={() => onClick(item)}
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
            style={{
                position: 'absolute',
                ...style,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hover ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
                zIndex: hover ? 10 : 1,
                background: hover ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                border: hover ? '2px solid rgba(212, 175, 55, 0.6)' : '2px solid transparent',
                borderRadius: '12px',
                boxShadow: hover ? '0 0 30px rgba(212, 175, 55, 0.3), 0 10px 40px rgba(0,0,0,0.3)' : 'none',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px'
            }}
        >
            <div style={{
                color: '#d4af37', fontSize: '0.7rem', fontWeight: '700',
                textShadow: '0 1px 5px rgba(0,0,0,0.9)',
                background: 'rgba(0,0,0,0.6)',
                padding: '3px 8px',
                borderRadius: '6px'
            }}>
                {item.label}
            </div>
        </div>
    );
}

// Content panel with zoom-in animation
function ContentPanel({ item, onBack }) {
    const contentMap = {
        i9: { title: 'I-9 Employment Verification', body: 'Complete your I-9 form within 3 days of your start date. Bring valid identification documents — passport, driver\'s license + social security card, or other approved documents.\n\nYour HR representative will guide you through each section and verify your documents in person or via authorized representative.' },
        timerecords: { title: 'Time Record Management', body: 'Submit your timecard weekly through Rippling or your assigned prime contractor portal.\n\n⏰ Timecards are due every Friday by 5:00 PM\n📋 Log hours daily for accuracy\n💡 Contact your PM if unsure about charge codes\n\nLate timecards may delay payroll processing.' },
        benefits: { title: 'Benefits & Enrollment', body: '💙 Health, Dental & Vision — Enroll within 30 days of hire\n💰 401(k) through Voya — Company match available\n👁️ Vision — Included in benefits package\n🏥 EAP — Employee Assistance Program available\n\nBenefits are effective on your start date. Review the Benefits Overview in Document Management for full details.' },
        payroll: { title: 'Payroll & Direct Deposit', body: '💵 Pay Schedule: Bi-weekly (every other Friday)\n🏦 Direct Deposit: Set up through Rippling\n📄 First Check: May be paper until DD is verified\n📊 Pay Stubs: Available in Rippling dashboard\n\nQuestions? Contact payroll@navontech.com' },
        handbook: { title: 'Employee Handbook', body: 'The Employee Handbook covers:\n\n📋 Code of Conduct & Ethics\n👔 Dress Code & Workplace Standards\n🔒 Security Policies\n📱 Technology Use Policy\n⚖️ Equal Opportunity & Anti-Harassment\n\nAccess the full handbook in Secure Document Management.' },
        pto: { title: 'PTO & Leave Policies', body: '🏖️ PTO accrues based on tenure\n📅 Submit requests through Rippling\n🎄 Company holidays are listed in your offer letter\n🤒 Sick leave is separate from PTO\n👶 Parental leave available\n\nApproval required from your project manager before booking travel.' },
        policies: { title: 'Security & Compliance', body: '🛡️ Maintain your security clearance at all times\n🚨 Report incidents immediately to security@navontech.com\n📚 Annual security training is mandatory\n🔐 Follow clean desk policy\n💻 Lock workstation when away\n\nViolations may result in clearance revocation.' },
        training: { title: 'Required Training', body: '🎓 Complete within first 30 days:\n\n✅ Security Awareness Training\n✅ Insider Threat Training\n✅ Cyber Awareness Challenge\n✅ Company Orientation\n\n📚 O\'Reilly Media access for professional development\n🏆 Certifications are supported and reimbursed' },
        contacts: { title: 'Key Contacts', body: '📧 HR: hr@navontech.com\n🛡️ Security: security@navontech.com\n💻 IT Support: support@navontech.com\n💰 Payroll: payroll@navontech.com\n📋 General: info@navontech.com\n\n🏢 Navon Technologies\n📍 Leesburg, Virginia' },
        culture: { title: 'Our Culture & Values', body: '🏆 Navon Technologies is built on:\n\n⭐ Service — Veteran-owned, mission-first mindset\n🤝 Integrity — Do the right thing, always\n🚀 Innovation — Embrace new technologies\n💪 Excellence — Deliver quality in everything\n🎖️ Community — Support each other and give back\n\nWe\'re not just a company — we\'re a team.' },
        perks: { title: 'Employee Perks', body: '☕ What makes Navon special:\n\n📚 O\'Reilly Media unlimited access\n💻 Professional development budget\n🏠 Flexible work arrangements\n🎉 Team events & celebrations\n🎓 Certification reimbursement\n🏋️ Wellness resources\n🤝 Employee referral bonuses\n\nAsk HR about current programs!' },
        wellness: { title: 'Wellness Resources', body: '🌱 Your wellbeing matters:\n\n🧘 EAP Counseling Services (confidential)\n🏋️ Wellness Program\n💆 Mental Health Resources\n📞 24/7 Support Line\n\nSee the EAP Services Flyer in HR Documents for details.' },
        video: { title: 'Welcome to Navon Technologies', body: 'VIDEO_PLACEHOLDER' },
        qanda: { title: 'Questions & Answers', body: '❓ Frequently Asked Questions:\n\n📅 When do I get paid?\nBi-weekly, every other Friday.\n\n🏥 When do benefits start?\nEffective on your start date. Enroll within 30 days.\n\n⏰ How do I submit my timecard?\nThrough Rippling or your prime contractor portal, due Fridays by 5 PM.\n\n🏖️ How do I request time off?\nSubmit through Rippling. Get PM approval first.\n\n📞 Who do I contact for help?\nHR: hr@navontech.com\nIT: support@navontech.com\n\n🔐 What if my clearance status changes?\nNotify security@navontech.com immediately.' },
    };

    const content = contentMap[item?.id] || { title: 'Coming Soon', body: 'This section is being prepared.' };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(10, 15, 30, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
            animation: 'zoomIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{
                background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '24px', padding: '3rem', maxWidth: '550px', width: '90%',
                border: '2px solid #d4af37',
                boxShadow: '0 40px 100px rgba(212, 175, 55, 0.15), 0 0 60px rgba(212, 175, 55, 0.05)'
            }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem', textAlign: 'center' }}>{item?.icon}</div>
                <h2 style={{ color: '#d4af37', fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '0.5px' }}>
                    {content.title}
                </h2>
                <div style={{
                    color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.9', whiteSpace: 'pre-line',
                    marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto',
                    paddingRight: '0.5rem'
                }}>
                    {content.body === 'VIDEO_PLACEHOLDER' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '3rem 2rem', border: '1px solid #334155', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</div>
                                <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                                    Welcome video will appear here once uploaded.
                                </p>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Your HR representative will introduce you to Navon Technologies.
                                </p>
                            </div>
                        </div>
                    ) : (
                        content.body
                    )}
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button onClick={onBack} style={{
                        background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
                        color: '#0f172a', border: 'none',
                        padding: '0.85rem 2.5rem', borderRadius: '12px', fontSize: '1rem',
                        fontWeight: '700', cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(212, 175, 55, 0.4)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.3)'; }}
                    >
                        ← Back to Library
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingLibrary() {
    const [phase, setPhase] = useState('video'); // 'video' | 'library'
    const [selectedItem, setSelectedItem] = useState(null);

    const shelfItems = [
        // Top shelf
        { id: 'i9', icon: '🗂️', label: 'I-9 Forms', color: '#2563eb', pos: { top: '29%', left: '7%', width: '14%', height: '15%' } },
        { id: 'timerecords', icon: '⏰', label: 'Time & Attendance', color: '#7c3aed', pos: { top: '48%', left: '9%', width: '8%', height: '12%' } },
        { id: 'benefits', icon: '💙', label: 'Benefits', color: '#0891b2', pos: { top: '30%', left: '33%', width: '7%', height: '15%' } },
        { id: 'payroll', icon: '💰', label: 'Payroll', color: '#059669', pos: { top: '12%', left: '56%' } },
        { id: 'handbook', icon: '📖', label: 'Handbook', color: '#d97706', pos: { top: '12%', left: '73%' } },
        // Bottom shelf
        { id: 'pto', icon: '🏖️', label: 'PTO & Leave', color: '#db2777', pos: { top: '52%', left: '5%' } },
        { id: 'policies', icon: '🛡️', label: 'Policies', color: '#dc2626', pos: { top: '52%', left: '19%' } },
        { id: 'training', icon: '🎓', label: 'Training', color: '#0d9488', pos: { top: '42%', left: '43%' } },
        // Hidden discoveries
        { id: 'culture', icon: '🏆', label: 'Culture', color: '#b45309', pos: { top: '52%', left: '73%' } },
        { id: 'perks', icon: '☕', label: 'Perks', color: '#78350f', pos: { top: '12%', left: '89%' } },
        { id: 'wellness', icon: '🌱', label: 'Wellness', color: '#166534', pos: { top: '52%', left: '89%' } },
        // Picture frame - video
        { id: 'video', icon: '📸', label: 'Welcome Video', color: '#d4af37', pos: { top: '22%', left: '72%', width: '8%', height: '10%' } },
        // Q&A
        { id: 'qanda', icon: '❓', label: 'Questions & Answers', color: '#6366f1', pos: { top: '75%', left: '60%', width: '10%', height: '10%' } },
        // Contact Us
        { id: 'contacts', icon: '📞', label: 'Contact Us', color: '#4f46e5', pos: { top: '50%', left: '40%', width: '7%', height: '10%' } },
    ];

    return (
        <div style={{
            width: '100%', height: '80vh', minHeight: '600px', position: 'relative',
            borderRadius: '20px', overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
        }}>
            {/* Phase 1: Welcome Video */}
            {phase === 'video' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 20
                }}>
                    <div style={{
                        textAlign: 'center', padding: '3rem',
                        animation: 'fadeInUp 1s ease'
                    }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2rem auto',
                            boxShadow: '0 20px 60px rgba(212, 175, 55, 0.3)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            <span style={{ fontSize: '3.5rem' }}>🎬</span>
                        </div>
                        <h2 style={{
                            color: '#ffffff', fontSize: '2.5rem', fontWeight: '800',
                            marginBottom: '0.5rem', letterSpacing: '-0.5px'
                        }}>
                            Welcome to Navon Technologies
                        </h2>
                        <p style={{
                            color: '#d4af37', fontSize: '1.2rem', marginBottom: '1.5rem',
                            fontWeight: '600', letterSpacing: '1px'
                        }}>
                            Your Employee Resource Center
                        </p>
                        <p style={{
                            color: '#94a3b8', fontSize: '1rem', marginBottom: '2.5rem',
                            maxWidth: '450px', lineHeight: '1.6', fontStyle: 'italic'
                        }}>
                            "Let's take a look around your employee resource center..."
                        </p>
                        <button onClick={() => setPhase('library')} style={{
                            background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
                            color: '#0f172a', border: 'none', padding: '1.1rem 3rem',
                            borderRadius: '50px', fontSize: '1.1rem', fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '0 15px 40px rgba(212, 175, 55, 0.35)',
                            transition: 'all 0.3s ease',
                            letterSpacing: '0.5px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(212, 175, 55, 0.5)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(212, 175, 55, 0.35)'; }}
                        >
                            Enter the Library →
                        </button>
                    </div>
                </div>
            )}

            {/* Phase 2: Library with shelf background */}
            {phase === 'library' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.8s ease'
                }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img 
                            src="https://navon-tech-images.s3.us-east-1.amazonaws.com/bookcase%20room.png"
                            alt="Library"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                        {/* Hotspot container overlays the image exactly */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>

                            {/* Title */}
                            <div style={{
                                position: 'absolute', bottom: '3%', left: '50%', transform: 'translateX(-50%)',
                                color: '#d4af37', fontSize: '0.85rem', fontWeight: '700',
                                letterSpacing: '3px', textTransform: 'uppercase',
                                textShadow: '0 2px 10px rgba(212, 175, 55, 0.3)'
                            }}>
                                ✦ Click any item to explore ✦
                            </div>

                            {/* Interactive shelf items */}
                            {shelfItems.map((item) => (
                                <ShelfItem
                                    key={item.id}
                                    item={item}
                                    onClick={setSelectedItem}
                                    style={item.pos}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Content overlay */}
            {selectedItem && (
                <ContentPanel item={selectedItem} onBack={() => setSelectedItem(null)} />
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes pulse { 0%, 100% { transform: scale(1); box-shadow: 0 20px 60px rgba(212, 175, 55, 0.3); } 50% { transform: scale(1.05); box-shadow: 0 25px 70px rgba(212, 175, 55, 0.4); } }
            `}</style>
        </div>
    );
}
