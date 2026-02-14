import { useState, useEffect } from 'react';

function SimpleApp() {
    const s3BaseUrl = "https://navon-tech-images.s3.us-east-1.amazonaws.com";
    const [currentPage, setCurrentPage] = useState('home');
    const [scrollY, setScrollY] = useState(0);
    const [showSecureModal, setShowSecureModal] = useState(false);
    const [isHRView, setIsHRView] = useState(false);
    const [showTimeOffModal, setShowTimeOffModal] = useState(false);
    const [userRole, setUserRole] = useState('employee'); // 'employee', 'hr', 'admin'
    const [uploadedFiles, setUploadedFiles] = useState({
        employeeHandbook: [],
        benefits: [],
        forms: []
    });

    // Handle hash changes for navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) || 'home';
            setCurrentPage(hash);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        handleHashChange(); // Set initial page
        window.addEventListener('hashchange', handleHashChange);

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Handle scroll for parallax effects
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Permission functions
    const canDeleteHandbook = () => userRole === 'hr' || userRole === 'admin';
    const canUploadHandbook = () => userRole === 'hr' || userRole === 'admin';
    
    // Handle file upload
    const handleFileUpload = (category, files) => {
        if (!canUploadHandbook()) {
            alert('❌ Access Denied: Only HR and Admin users can upload files to the Employee Handbook.');
            return;
        }

        const fileArray = Array.from(files);
        const processedFiles = fileArray.map(file => {
            console.log('Processing file:', file.name, 'Type:', file.type); // Debug log
            return {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString(),
                uploadedBy: userRole.toUpperCase(),
                file: file
            };
        });

        setUploadedFiles(prev => {
            const newState = {
                ...prev,
                [category]: [...prev[category], ...processedFiles]
            };
            console.log('Updated files state:', newState); // Debug log
            return newState;
        });

        alert(`✅ Successfully uploaded ${fileArray.length} file(s) to Employee Handbook!`);
        
        // Force a small delay to ensure state update
        setTimeout(() => {
            console.log('Current uploaded files:', uploadedFiles);
        }, 100);
    };

    // Handle file deletion
    const handleFileDelete = (category, fileId, fileName) => {
        if (!canDeleteHandbook()) {
            alert(`❌ Access Denied: Only HR and Admin users can delete files from the Employee Handbook.\n\nCurrent Role: ${userRole.toUpperCase()}\nRequired Role: HR or ADMIN`);
            return;
        }

        if (confirm(`🗑️ Are you sure you want to delete "${fileName}"?\n\nThis action cannot be undone.`)) {
            setUploadedFiles(prev => ({
                ...prev,
                [category]: prev[category].filter(f => f.id !== fileId)
            }));
            alert(`✅ File "${fileName}" has been deleted successfully.`);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get file type badge
    const getFileTypeBadge = (fileName) => {
        if (!fileName) return { color: '#6b7280', label: 'FILE' };
        
        const extension = fileName.split('.').pop().toLowerCase();
        console.log('File:', fileName, 'Extension:', extension); // Debug log
        
        const typeMap = {
            pdf: { color: '#ef4444', label: 'PDF' },
            doc: { color: '#2563eb', label: 'DOC' },
            docx: { color: '#2563eb', label: 'DOCX' },
            txt: { color: '#6b7280', label: 'TXT' },
            xls: { color: '#059669', label: 'XLS' },
            xlsx: { color: '#059669', label: 'XLSX' },
            ppt: { color: '#dc2626', label: 'PPT' },
            pptx: { color: '#dc2626', label: 'PPTX' },
            jpg: { color: '#7c3aed', label: 'JPG' },
            jpeg: { color: '#7c3aed', label: 'JPEG' },
            png: { color: '#7c3aed', label: 'PNG' },
            gif: { color: '#7c3aed', label: 'GIF' }
        };
        
        const result = typeMap[extension] || { color: '#6b7280', label: extension?.toUpperCase() || 'FILE' };
        console.log('Badge result:', result); // Debug log
        return result;
    };
    
    // Handle document viewing
    const handleViewDocument = (docName, file = null) => {
        if (file && file.file) {
            // Handle uploaded files with real content
            const fileObj = file.file;
            const fileType = fileObj.type;
            const fileName = fileObj.name;
            const extension = fileName.split('.').pop().toLowerCase();
            
            // Create download URL for all files
            const blob = new Blob([fileObj], { type: fileType });
            const downloadUrl = URL.createObjectURL(blob);
            
            if (fileType.includes('text/') || extension === 'txt') {
                // Handle text files - read and display content
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    showDocumentWindow(fileName, content, 'text', downloadUrl);
                };
                reader.readAsText(fileObj);
            } else if (fileType.includes('application/pdf') || extension === 'pdf') {
                // Handle PDF files - create blob URL for viewing
                showDocumentWindow(fileName, downloadUrl, 'pdf', downloadUrl);
            } else if (extension === 'docx' || extension === 'doc' || 
                       fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
                       fileType.includes('application/msword')) {
                // Handle Word documents - show download option since we can't render them directly
                showDocumentWindow(fileName, null, 'word', downloadUrl);
            } else {
                // Handle other file types - show download option
                showDocumentWindow(fileName, null, 'other', downloadUrl);
            }
            
            // Clean up URL after 30 seconds
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
        } else {
            // Handle default documents (demo content)
            showDocumentWindow(docName, null, 'demo', null);
        }
    };

    // Show document in new window
    const showDocumentWindow = (fileName, content, type, downloadUrl) => {
        const docWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        
        let bodyContent = '';
        
        if (type === 'text' && content) {
            bodyContent = `
                <div class="content">
                    <h2>📄 ${fileName}</h2>
                    <div class="file-info">
                        <span class="badge text">TEXT FILE</span>
                        <span>Real file content displayed below</span>
                    </div>
                    <div class="text-content">
                        <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                    </div>
                    <div class="actions">
                        <a href="${downloadUrl}" download="${fileName}" class="download-btn">📥 Download Original File</a>
                    </div>
                </div>
            `;
        } else if (type === 'pdf' && content) {
            bodyContent = `
                <div class="content">
                    <h2>📄 ${fileName}</h2>
                    <div class="file-info">
                        <span class="badge pdf">PDF FILE</span>
                        <span>PDF viewer embedded below</span>
                    </div>
                    <div class="pdf-viewer">
                        <iframe src="${content}" width="100%" height="500px" style="border: 1px solid #e2e8f0; border-radius: 8px;"></iframe>
                    </div>
                    <div class="actions">
                        <a href="${downloadUrl}" download="${fileName}" class="download-btn">📥 Download PDF</a>
                        <button onclick="window.print()" class="download-btn print-btn">🖨️ Print</button>
                    </div>
                </div>
            `;
        } else if (type === 'word') {
            bodyContent = `
                <div class="content">
                    <h2>📄 ${fileName}</h2>
                    <div class="file-info">
                        <span class="badge word">WORD DOCUMENT</span>
                        <span>Microsoft Word document detected</span>
                    </div>
                    <div class="word-info">
                        <div class="info-box">
                            <h3>📝 Word Document (.docx/.doc)</h3>
                            <p><strong>File:</strong> ${fileName}</p>
                            <p><strong>Type:</strong> Microsoft Word Document</p>
                            <p><strong>Status:</strong> Ready for download</p>
                            <hr style="margin: 15px 0;">
                            <p>Word documents cannot be displayed directly in the browser due to format complexity. To view the full content:</p>
                            <ul>
                                <li><strong>Download</strong> the file using the button below</li>
                                <li><strong>Open</strong> with Microsoft Word, Google Docs, or LibreOffice</li>
                                <li><strong>Alternative:</strong> Convert to PDF for web viewing</li>
                            </ul>
                            <div class="tip">
                                <strong>� Tip:</strong> For better web compatibility, consider saving Word documents as PDF format when uploading.
                            </div>
                        </div>
                    </div>
                    <div class="actions">
                        <a href="${downloadUrl}" download="${fileName}" class="download-btn primary">📥 Download Word Document</a>
                    </div>
                </div>
            `;
        } else if (type === 'other') {
            const extension = fileName.split('.').pop().toUpperCase();
            bodyContent = `
                <div class="content">
                    <h2>📄 ${fileName}</h2>
                    <div class="file-info">
                        <span class="badge other">${extension} FILE</span>
                        <span>Download to view content</span>
                    </div>
                    <div class="other-info">
                        <div class="info-box">
                            <h3>📎 ${extension} File</h3>
                            <p><strong>File:</strong> ${fileName}</p>
                            <p><strong>Type:</strong> ${extension} format</p>
                            <p><strong>Status:</strong> Ready for download</p>
                            <hr style="margin: 15px 0;">
                            <p>This file type requires downloading to view the content in the appropriate application.</p>
                        </div>
                    </div>
                    <div class="actions">
                        <a href="${downloadUrl}" download="${fileName}" class="download-btn primary">📥 Download ${extension} File</a>
                    </div>
                </div>
            `;
        } else {
            // Demo content for default documents
            bodyContent = `
                <div class="content">
                    <h2>📄 ${fileName}</h2>
                    <div class="file-info">
                        <span class="badge demo">DEMO DOCUMENT</span>
                        <span>Sample content - connect to your document system</span>
                    </div>
                    <div class="demo-content">
                        <h3>Sample Content</h3>
                        <p>This is a demonstration of the document viewing system. In a real implementation, this would display the actual document content.</p>
                        <h4>Integration Notes:</h4>
                        <ul>
                            <li>Connect to your document management system</li>
                            <li>Add PDF viewer for PDF files</li>
                            <li>Implement text extraction for Word documents</li>
                            <li>Add version control and approval workflows</li>
                        </ul>
                    </div>
                    <div class="actions">
                        <button onclick="alert('Demo document - no download available')" class="download-btn demo-btn">📄 Demo Document</button>
                    </div>
                </div>
            `;
        }

        docWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${fileName} - Navon Technologies</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; 
                        background: #f8fafc;
                        color: #1e293b;
                    }
                    .header { 
                        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                        color: white; 
                        padding: 20px; 
                        text-align: center;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header h1 { margin: 0; font-size: 1.5rem; }
                    .header p { margin: 5px 0 0 0; opacity: 0.9; }
                    .content { 
                        max-width: 800px;
                        margin: 20px auto;
                        background: white; 
                        padding: 30px; 
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        line-height: 1.6;
                    }
                    .file-info {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #f1f5f9;
                    }
                    .badge {
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: white;
                        background: #6b7280;
                    }
                    .badge.pdf { background: #ef4444; }
                    .badge.word { background: #2563eb; }
                    .badge.text { background: #6b7280; }
                    .badge.other { background: #059669; }
                    .badge.demo { background: #d97706; }
                    .text-content {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                        max-height: 400px;
                        overflow-y: auto;
                    }
                    .text-content pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9rem;
                        line-height: 1.5;
                    }
                    .info-box {
                        background: #f0f9ff;
                        border: 1px solid #bae6fd;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .info-box h3 { margin-top: 0; color: #0369a1; }
                    .info-box ul { margin-bottom: 0; }
                    .tip {
                        background: #fef3c7;
                        border: 1px solid #f59e0b;
                        border-radius: 6px;
                        padding: 10px;
                        margin-top: 15px;
                        font-size: 0.9rem;
                    }
                    .actions {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .download-btn {
                        display: inline-block;
                        background: #1e3a8a;
                        color: white;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        margin: 0 10px 10px 10px;
                        transition: all 0.3s ease;
                        border: none;
                        cursor: pointer;
                        font-size: 1rem;
                    }
                    .download-btn:hover {
                        background: #1e40af;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
                    }
                    .download-btn.primary {
                        background: #d4af37;
                        color: #0f172a;
                    }
                    .download-btn.primary:hover {
                        background: #b8941f;
                    }
                    .download-btn.print-btn {
                        background: #059669;
                    }
                    .download-btn.print-btn:hover {
                        background: #047857;
                    }
                    .download-btn.demo-btn {
                        background: #6b7280;
                    }
                    .footer {
                        text-align: center;
                        margin: 20px;
                        color: #64748b;
                        font-size: 0.9rem;
                    }
                    .close-btn {
                        background: #ef4444; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 6px; 
                        cursor: pointer;
                        margin-top: 10px;
                        font-weight: 600;
                    }
                    .close-btn:hover { 
                        background: #dc2626; 
                        transform: translateY(-1px);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📄 Document Viewer</h1>
                    <p>Navon Technologies Document Management System</p>
                </div>
                ${bodyContent}
                <div class="footer">
                    <p>Navon Technologies - Secure Document Access</p>
                    <button onclick="window.close()" class="close-btn">✕ Close Document</button>
                </div>
            </body>
            </html>
        `);
        docWindow.document.close();
    };

    // Role switcher for demo
    const switchRole = (role) => {
        setUserRole(role);
        const roleDescriptions = {
            employee: 'Employee - Can only VIEW documents, cannot upload or delete',
            hr: 'HR Manager - Can upload, view, and delete all documents',
            admin: 'Admin - Full access to all document management features'
        };
        alert(`🔄 Role switched to: ${role.toUpperCase()}\n\n${roleDescriptions[role]}\n\n💡 Now try uploading files and testing delete permissions!`);
    };

    return (
        <div style={{ fontFamily: '"Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif', lineHeight: '1.6' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-30px) translateX(10px); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInFromTop {
                    from {
                        opacity: 0;
                        transform: translateY(-100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out forwards;
                }
                
                .animate-fade-in {
                    animation: fadeIn 1s ease-out forwards;
                }
                
                .animate-slide-in-left {
                    animation: slideInLeft 0.8s ease-out forwards;
                }
                
                .animate-slide-in-right {
                    animation: slideInRight 0.8s ease-out forwards;
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-float-slow {
                    animation: floatSlow 4s ease-in-out infinite;
                }
                
                .animate-pulse {
                    animation: pulse 2s ease-in-out infinite;
                }
                
                .animate-scale-in {
                    animation: scaleIn 0.6s ease-out forwards;
                }
                
                .animate-image-slide-left {
                    animation: slideInFromLeft 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                
                .animate-image-slide-right {
                    animation: slideInFromRight 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                
                .animate-image-slide-top {
                    animation: slideInFromTop 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                
                .hover-lift {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .hover-lift:hover {
                    transform: translateY(-12px) scale(1.02);
                    box-shadow: 0 25px 50px rgba(212, 175, 55, 0.3) !important;
                }
                
                .hover-lift:hover .arrow-indicator {
                    opacity: 1 !important;
                    transform: translateX(5px) !important;
                }
                
                .hover-scale {
                    transition: all 0.3s ease;
                }
                
                .hover-scale:hover {
                    transform: scale(1.1);
                }
                
                .hover-rotate {
                    transition: all 0.5s ease;
                }
                
                .hover-rotate:hover {
                    transform: rotate(5deg) scale(1.05);
                }
                
                .gradient-text {
                    background: linear-gradient(135deg, #d4af37 0%, #f4e5a1 50%, #d4af37 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 3s linear infinite;
                    background-size: 2000px 100%;
                }
                
                .glass-effect {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                button:hover, .btn:hover, a[style*="background"]:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.15) !important;
                    transition: all 0.3s ease;
                }
                
                button, .btn, a[style*="background"] {
                    transition: all 0.3s ease;
                }
                
                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    header {
                        padding: 1rem !important;
                        flex-direction: column !important;
                        gap: 1rem;
                    }
                    
                    header nav {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 0.5rem;
                    }
                    
                    header nav a {
                        margin: 0 0.5rem !important;
                        font-size: 0.9rem !important;
                    }
                    
                    header img {
                        height: 50px !important;
                    }
                    
                    section {
                        padding: 3rem 1rem !important;
                    }
                    
                    h1 {
                        font-size: 2rem !important;
                    }
                    
                    h2 {
                        font-size: 1.8rem !important;
                    }
                    
                    h3 {
                        font-size: 1.3rem !important;
                    }
                    
                    /* Force all grids to single column on mobile */
                    div[style*="display: 'grid'"],
                    div[style*="display: grid"],
                    div[style*='display:"grid"'],
                    div[style*="gridTemplateColumns"] {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 1.5rem !important;
                    }
                    
                    /* Footer specific fixes */
                    footer {
                        padding: 2rem 1rem !important;
                    }
                    
                    footer > div > div:first-child {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 2rem !important;
                    }
                    
                    footer h4,
                    footer p,
                    footer div {
                        text-align: center !important;
                        justify-content: center !important;
                        align-items: center !important;
                    }
                    
                    footer div[style*="alignItems: 'flex-end'"] {
                        align-items: center !important;
                    }
                    
                    /* Three boxes on home page */
                    section div[style*="repeat(3, 1fr)"] {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                }
            `}</style>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                borderBottom: '3px solid transparent',
                borderImage: 'linear-gradient(90deg, transparent 0%, #d4af37 20%, #f4e5a1 50%, #d4af37 80%, transparent 100%) 1',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 3px 15px rgba(212, 175, 55, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }} className="animate-slide-in-left">
                    <a href="#home" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <img
                            src={`${s3BaseUrl}/public/images/logo_double_framed.jpeg`}
                            alt="Logo"
                            style={{ height: '70px', transition: 'transform 0.3s ease' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        />
                    </a>
                </div>
                <nav className="animate-slide-in-right">
                    <a href="#home" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500', transition: 'all 0.3s ease', position: 'relative', display: 'inline-block' }} 
                       onMouseOver={(e) => { e.target.style.color = '#d4af37'; e.target.style.transform = 'translateY(-3px) scale(1.1)'; }}
                       onMouseOut={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(0) scale(1)'; }}>Home</a>
                    <a href="#about" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500', transition: 'all 0.3s ease', display: 'inline-block' }}
                       onMouseOver={(e) => { e.target.style.color = '#d4af37'; e.target.style.transform = 'translateY(-3px) scale(1.1)'; }}
                       onMouseOut={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(0) scale(1)'; }}>About</a>
                    <a href="#capabilities" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500', transition: 'all 0.3s ease', display: 'inline-block' }}
                       onMouseOver={(e) => { e.target.style.color = '#d4af37'; e.target.style.transform = 'translateY(-3px) scale(1.1)'; }}
                       onMouseOut={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(0) scale(1)'; }}>Services</a>
                    <a href="#aws" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500', transition: 'all 0.3s ease', display: 'inline-block' }}
                       onMouseOver={(e) => { e.target.style.color = '#d4af37'; e.target.style.transform = 'translateY(-3px) scale(1.1)'; }}
                       onMouseOut={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(0) scale(1)'; }}>Cloud Services</a>
                    <a href="#careers" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500', transition: 'all 0.3s ease', display: 'inline-block' }}
                       onMouseOver={(e) => { e.target.style.color = '#d4af37'; e.target.style.transform = 'translateY(-3px) scale(1.1)'; }}
                       onMouseOut={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(0) scale(1)'; }}>Careers</a>
                    <a href="#contact" style={{ color: 'white', margin: '0 1.5rem', textDecoration: 'none', fontWeight: '500', transition: 'all 0.3s ease', display: 'inline-block' }}
                       onMouseOver={(e) => { e.target.style.color = '#d4af37'; e.target.style.transform = 'translateY(-3px) scale(1.1)'; }}
                       onMouseOut={(e) => { e.target.style.color = 'white'; e.target.style.transform = 'translateY(0) scale(1)'; }}>Contact</a>
                </nav>
            </header>

            {/* HOME PAGE */}
            {currentPage === 'home' && (
                <div>
                    {/* Hero Section */}
                    <section style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.35) 0%, rgba(30, 41, 59, 0.30) 50%, rgba(51, 65, 85, 0.35) 100%), url("https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1920&q=80") center 15%/cover',
                        padding: '4rem 2rem 3rem 2rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '70vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* Animated background elements */}
                        <div className="animate-float" style={{
                            position: 'absolute',
                            top: '10%',
                            right: '10%',
                            width: '400px',
                            height: '400px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        <div className="animate-float-slow" style={{
                            position: 'absolute',
                            bottom: '10%',
                            left: '10%',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        <div className="animate-pulse" style={{
                            position: 'absolute',
                            top: '50%',
                            left: '5%',
                            width: '200px',
                            height: '200px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        <div className="animate-float" style={{
                            position: 'absolute',
                            top: '20%',
                            left: '50%',
                            width: '250px',
                            height: '250px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        
                        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <h1 className="animate-fade-in-up" style={{
                                fontSize: '3.5rem',
                                margin: '0 0 2rem 0',
                                color: 'white',
                                fontWeight: '800',
                                letterSpacing: '-0.02em',
                                lineHeight: '1.1',
                                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                cursor: 'default',
                                transition: 'all 0.5s ease',
                                transform: 'translateY(0) scale(1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-20px) scale(1.1)';
                                e.currentTarget.style.textShadow = '0 15px 60px rgba(212, 175, 55, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.textShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                            }}>
                                Trusted Government <span className="gradient-text">Technology Solutions</span>
                            </h1>
                            
                            <h2 className="animate-fade-in-up" style={{
                                fontSize: '1.8rem',
                                background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                margin: '4rem auto 0 auto',
                                fontWeight: '800',
                                textShadow: '0 2px 10px rgba(212, 175, 55, 0.3)',
                                animationDelay: '0.2s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                            }}>
                                Welcome to wiser technology solutions, we take technology higher!
                            </h2>
                            
                            <div className="animate-fade-in-up" style={{
                                maxWidth: '900px',
                                margin: '4rem auto 3rem auto',
                                background: 'rgba(15, 23, 42, 0.6)',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                animationDelay: '0.4s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.4s forwards'
                            }}>
                                <p style={{
                                    fontSize: '1.15rem',
                                    color: '#f1f5f9',
                                    lineHeight: '1.8',
                                    marginBottom: '1.5rem',
                                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                                }}>
                                    Navon Technologies is a Service-Disabled Veteran-Owned Small Business and AWS Partner serving both public and private sectors. We provide technical services for development, automation, testing, implementation, and maintenance support for our customers' mission and business for critical applications whether they are on-prem or in the cloud.
                                </p>
                                
                                <p style={{
                                    fontSize: '1.15rem',
                                    color: '#e2e8f0',
                                    lineHeight: '1.8',
                                    margin: '0',
                                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                                }}>
                                    At Navon Technologies, we started as a small team of IT enthusiasts who wanted to help businesses overcome their technology challenges. We have partnered with AWS (Amazon Web Services) to provide our customers with the best cloud solutions in the industry. This partnership gained us access to over 200 AWS services. We specialize in Migration, Networking, Security, Web Site and App Development.
                                </p>
                            </div>
                            
                            <div className="animate-fade-in-up" style={{ 
                                display: 'flex', 
                                gap: '1.5rem', 
                                justifyContent: 'center', 
                                flexWrap: 'wrap',
                                animationDelay: '0.6s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.6s forwards'
                            }}>
                                <a href={`${s3BaseUrl}/public/images/NAVON_Technologies_Capability_Statement_2026.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '1.2rem 2.5rem',
                                        fontSize: '1.1rem',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                        boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }}>
                                    📄 Download Capability Statement
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Gold Divider */}
                    <div style={{
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                        margin: '0'
                    }}></div>

                    {/* Additional Home Sections */}
                    <section style={{ padding: '6rem 2rem', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '2rem'
                            }}>
                                {/* Satisfaction Guaranteed */}
                                <div className="hover-lift animate-slide-in-left" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '3rem',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        right: '-50px',
                                        width: '150px',
                                        height: '150px',
                                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
                                        borderRadius: '50%'
                                    }}></div>
                                    <h3 style={{ 
                                        color: 'white', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.8rem',
                                        fontWeight: '700'
                                    }}>
                                        Satisfaction Guaranteed
                                    </h3>
                                    <p style={{ 
                                        color: '#cbd5e1', 
                                        lineHeight: '1.8',
                                        marginBottom: '1rem',
                                        fontSize: '1.05rem',
                                        flex: 1
                                    }}>
                                        We provide tailored IT solutions that fit your company's needs and budget, delivering professional customer service every step of the way.
                                    </p>
                                    <p style={{ 
                                        color: '#d4af37', 
                                        fontWeight: '600',
                                        marginBottom: '2rem',
                                        fontSize: '1.1rem'
                                    }}>
                                        We guarantee you will be satisfied with our work.
                                    </p>
                                    <div style={{ textAlign: 'center' }}>
                                        <a href="#contact" style={{
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                            color: 'white',
                                            padding: '1rem 2rem',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            display: 'inline-block',
                                            boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            Contact Us →
                                        </a>
                                    </div>
                                </div>
                                
                                {/* Services and Solutions */}
                                <div className="hover-lift animate-fade-in-up" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '3rem',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    animationDelay: '0.3s',
                                    opacity: 0
                                }}>
                                    <div className="animate-pulse" style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        right: '-50px',
                                        width: '150px',
                                        height: '150px',
                                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
                                        borderRadius: '50%'
                                    }}></div>
                                    <h3 style={{ 
                                        color: 'white', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.8rem',
                                        fontWeight: '700'
                                    }}>
                                        Services and Solutions
                                    </h3>
                                    <p style={{ 
                                        color: '#cbd5e1', 
                                        lineHeight: '1.8',
                                        marginBottom: '2rem',
                                        fontSize: '1.05rem',
                                        flex: 1
                                    }}>
                                        Outsource your IT management to us and focus on running your business. We handle maintenance so you can invest in growth and innovation.
                                    </p>
                                    <div style={{ textAlign: 'center' }}>
                                        <a href="#capabilities" style={{
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                            color: 'white',
                                            padding: '1rem 2rem',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            display: 'inline-block',
                                            boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            See Services →
                                        </a>
                                    </div>
                                </div>
                                
                                {/* Technical Experience */}
                                <div className="hover-lift animate-slide-in-right" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '3rem',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    animationDelay: '0.6s',
                                    opacity: 0
                                }}>
                                    <div className="animate-pulse" style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        right: '-50px',
                                        width: '150px',
                                        height: '150px',
                                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
                                        borderRadius: '50%'
                                    }}></div>
                                    <h3 style={{ 
                                        color: 'white', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.8rem',
                                        fontWeight: '700'
                                    }}>
                                        Technical Experience
                                    </h3>
                                    <p style={{ 
                                        color: '#cbd5e1', 
                                        lineHeight: '1.8',
                                        marginBottom: '2rem',
                                        fontSize: '1.05rem',
                                        flex: 1
                                    }}>
                                        Our highly skilled team maintains top-level certifications across operating systems, networks, and databases. We bring deep expertise to projects of any size.
                                    </p>
                                    <div style={{ textAlign: 'center' }}>
                                        <a href="#about" onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage('about');
                                            window.location.hash = 'about';
                                            
                                            // Wait for page to render, then scroll
                                            const scrollToCertifications = () => {
                                                const element = document.getElementById('certifications');
                                                if (element) {
                                                    const offset = 100;
                                                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                                                    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
                                                } else {
                                                    // If element not found, try again
                                                    setTimeout(scrollToCertifications, 100);
                                                }
                                            };
                                            
                                            setTimeout(scrollToCertifications, 100);
                                        }} style={{
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                            color: 'white',
                                            padding: '1rem 2rem',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            display: 'inline-block',
                                            boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}>
                                            Learn More →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Trusted Partners Section */}
                    <section style={{ 
                        padding: '5rem 2rem', 
                        backgroundImage: 'url("https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Dark overlay for better contrast */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.50) 0%, rgba(30, 41, 59, 0.55) 100%)',
                            zIndex: 0
                        }}></div>
                        <div className="animate-pulse" style={{
                            position: 'absolute',
                            top: '20%',
                            right: '10%',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}></div>
                        
                        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <h2 className="animate-fade-in-up" style={{
                                fontSize: '2.5rem',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                color: '#d4af37',
                                fontWeight: '800',
                                textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                            }}>
                                Trusted Partners
                            </h2>
                            <p className="animate-fade-in-up" style={{
                                fontSize: '1.2rem',
                                color: '#cbd5e1',
                                textAlign: 'center',
                                marginBottom: '4rem',
                                maxWidth: '600px',
                                margin: '0 auto 4rem auto',
                                animationDelay: '0.2s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
                                whiteSpace: 'nowrap'
                            }}>
                                Collaborating with industry leaders to deliver exceptional solutions
                            </p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '2rem',
                                alignItems: 'center'
                            }}>
                                {[
                                    { file: 'AWS.jpeg', name: 'AWS' },
                                    { file: 'microsoft.jpeg', name: 'Microsoft' },
                                    { file: 'Google_logo.svg', name: 'Google' },
                                    { file: 'cisco.jpeg', name: 'Cisco' },
                                    { file: 'ratheon.jpeg', name: 'Raytheon' },
                                    { file: 'gdit.jpeg', name: 'GDIT' },
                                    { file: 'jacobs.jpeg', name: 'Jacobs' },
                                    { file: 'ingram_micro.jpeg', name: 'Ingram Micro' },
                                    { file: 'vmware.jpeg', name: 'VMware' },
                                    { file: 'archfield.jpeg', name: 'Archfield' },
                                    { file: 'SAIC_Logo.svg', name: 'SAIC' },
                                    { file: 'Amentum.svg', name: 'Amentum' },
                                    { file: 'nightwing.jpg', name: 'Nightwing' },
                                    { file: 'BAE SYSTEMS.JPG', name: 'BAE Systems' },
                                    { file: 'versa-networks-logo.svg', name: 'Versa' }
                                ].map((partner, index) => (
                                    <div key={index} className="hover-lift animate-scale-in" style={{
                                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        textAlign: 'center',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                        minHeight: '180px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        animationDelay: `${index * 0.1}s`,
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: 'linear-gradient(90deg, #2563eb 0%, #d4af37 100%)',
                                            transform: 'scaleX(0)',
                                            transition: 'transform 0.3s ease'
                                        }} className="partner-accent"></div>
                                        <img
                                            src={`${s3BaseUrl}/public/images/partners/${partner.file}`}
                                            alt={partner.name}
                                            className="hover-scale"
                                            style={{
                                                maxWidth: partner.name === 'Nightwing' ? '120%' : partner.name === 'Amentum' ? '150%' : '100%',
                                                height: '110px',
                                                objectFit: 'contain',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onError={(e) => { 
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div style={{
                                            display: 'none',
                                            color: '#d4af37',
                                            fontWeight: '700',
                                            fontSize: '1.1rem'
                                        }}>
                                            {partner.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <style>{`
                            .hover-lift:hover .partner-accent {
                                transform: scaleX(1);
                            }
                        `}</style>
                    </section>
                    
                    {/* Gold Divider */}
                    <div style={{
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                        margin: '0'
                    }}></div>
                    
                    {/* Computer Screen Strip - Right Above Footer */}
                    <div style={{
                        width: '100%',
                        height: '120px',
                        backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 65%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Overlay for better contrast */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.3) 0%, rgba(212, 175, 55, 0.2) 50%, rgba(15, 23, 42, 0.3) 100%)'
                        }}></div>
                    </div>
                </div>
            )}

            {/* ABOUT PAGE */}
            {currentPage === 'about' && (
                <div>
                    {/* Hero Section */}
                    <section style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 50%, rgba(51, 65, 85, 0.92) 100%), url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80") center/cover',
                        padding: '4rem 2rem 3rem 2rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="animate-pulse" style={{
                            position: 'absolute',
                            top: '20%',
                            right: '10%',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        
                        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <h2 className="animate-fade-in-up" style={{
                                fontSize: '3.5rem',
                                marginBottom: '2rem',
                                color: 'white',
                                fontWeight: '800',
                                letterSpacing: '-0.02em'
                            }}>
                                About <span className="gradient-text">NAVON Technologies</span>
                            </h2>
                            
                            <div className="animate-fade-in-up" style={{
                                padding: '1rem',
                                marginBottom: '1rem',
                                animationDelay: '0.2s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                            }}>
                                <p style={{ 
                                    color: 'white', 
                                    lineHeight: '1.8', 
                                    fontSize: '1.2rem',
                                    margin: '0',
                                    fontWeight: '500',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                                }}>
                                    Navon Technologies is a <span style={{ color: '#d4af37', fontWeight: '700' }}>Service-Disabled Veteran-Owned Small Business</span> based in Leesburg, Virginia. We provide Network, System, and Security Engineering for Small, Medium, and Large businesses to include Federal/SLED (State, Local, Education) Government enterprise networks.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Gold Divider */}
                    <div className="animate-pulse" style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                        margin: '0'
                    }}></div>

                    {/* Capability Statement Link */}
                    <div style={{ 
                        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                        padding: '3rem 2rem',
                        textAlign: 'center'
                    }}>
                        <div className="animate-fade-in-up" style={{ 
                            animationDelay: '0.2s',
                            opacity: 0,
                            animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                        }}>
                            <a href={`${s3BaseUrl}/public/images/NAVON_Technologies_Capability_Statement_2026.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                    color: 'white',
                                    padding: '1.2rem 2.5rem',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: '700',
                                    display: 'inline-block',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 8px 25px rgba(212, 175, 55, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}>
                                📄 Download Our Capability Statement
                            </a>
                        </div>
                    </div>

                    {/* Mission Critical Section */}
                    <section style={{ padding: '5rem 2rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h3 className="animate-fade-in-up" style={{ 
                                color: '#d4af37', 
                                marginBottom: '2rem', 
                                fontSize: '2.5rem',
                                textAlign: 'center',
                                fontWeight: '800',
                                textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                            }}>
                                Mission-Critical Technology Solutions
                            </h3>
                            <p className="animate-fade-in-up" style={{ 
                                color: '#cbd5e1', 
                                lineHeight: '1.8', 
                                marginBottom: '1.5rem', 
                                fontSize: '1.1rem',
                                textAlign: 'center',
                                maxWidth: '900px',
                                margin: '0 auto 1.5rem auto',
                                animationDelay: '0.2s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                            }}>
                                NAVON Technologies is a trusted government contractor specializing in secure,
                                scalable technology solutions for federal agencies and defense organizations.
                                We combine deep technical expertise with security clearance capabilities to
                                deliver mission-critical systems.
                            </p>
                            <p className="animate-fade-in-up" style={{ 
                                color: '#cbd5e1', 
                                lineHeight: '1.8', 
                                marginBottom: '3rem',
                                fontSize: '1.1rem',
                                textAlign: 'center',
                                maxWidth: '900px',
                                margin: '0 auto 3rem auto',
                                animationDelay: '0.4s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.4s forwards'
                            }}>
                                Our team of certified engineers and security professionals brings decades of
                                experience in government contracting, ensuring compliance with federal standards
                                and regulations while delivering innovative solutions.
                            </p>
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                padding: '2.5rem',
                                borderRadius: '20px',
                                border: '2px solid rgba(212, 175, 55, 0.3)',
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                                animationDelay: '0.6s',
                                opacity: 0
                            }}>
                                <h4 style={{ 
                                    color: '#d4af37', 
                                    marginBottom: '1.5rem', 
                                    textAlign: 'center',
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    textShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
                                }}>Key Differentiators</h4>
                                <ul style={{ 
                                    color: '#cbd5e1', 
                                    paddingLeft: '2rem',
                                    fontSize: '1.1rem',
                                    lineHeight: '2'
                                }}>
                                    <li style={{ marginBottom: '0.8rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>✓</span> Security clearance certified team</li>
                                    <li style={{ marginBottom: '0.8rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>✓</span> FedRAMP and NIST compliance expertise</li>
                                    <li style={{ marginBottom: '0.8rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>✓</span> 24/7 mission-critical support</li>
                                    <li style={{ marginBottom: '0.8rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>✓</span> Proven government contracting track record</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                        
                        {/* Mission, Vision, Values, Brand */}
                        <section style={{ padding: '5rem 2rem', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
                            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                                {/* Mission and Vision in a row */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                                    gap: '2rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div className="hover-lift animate-slide-in-left" style={{ 
                                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                        padding: '2.5rem', 
                                        borderRadius: '20px',
                                        border: '3px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)'
                                    }}>
                                        <h3 style={{ 
                                            color: '#d4af37', 
                                            marginBottom: '1.5rem', 
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                                        }}>Our Mission</h3>
                                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', margin: '0', fontSize: '1.05rem' }}>
                                            We strive to exceed the highest standards of excellence in all we do; while strategically creating and delivering reliable, secure, and innovative technology solutions.
                                        </p>
                                    </div>
                                    
                                    <div className="hover-lift animate-fade-in-up" style={{ 
                                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                        padding: '2.5rem', 
                                        borderRadius: '20px',
                                        border: '3px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                        animationDelay: '0.2s',
                                        opacity: 0
                                    }}>
                                        <h3 style={{ 
                                            color: '#d4af37', 
                                            marginBottom: '1.5rem', 
                                            fontSize: '1.8rem',
                                            fontWeight: '800',
                                            textShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                                        }}>Our Vision</h3>
                                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', margin: '0', fontSize: '1.05rem' }}>
                                            To bring the best innovation and highest value to our customers.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Our Values spans full width */}
                                <div className="hover-lift animate-slide-in-right" style={{ 
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '2.5rem', 
                                    borderRadius: '20px',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                    animationDelay: '0.4s',
                                    opacity: 0,
                                    marginBottom: '4rem'
                                }}>
                                    <h3 style={{ 
                                        color: '#d4af37', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.8rem',
                                        fontWeight: '800',
                                        textShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                                        textAlign: 'center'
                                    }}>Our Values</h3>
                                    <ul style={{ 
                                        color: '#cbd5e1', 
                                        margin: '0', 
                                        paddingLeft: '1.5rem', 
                                        fontSize: '1.05rem', 
                                        lineHeight: '2',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                        gap: '1rem',
                                        listStyle: 'none'
                                    }}>
                                        <li style={{ marginBottom: '0.5rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>★</span> Reliability - Delivering consistent, dependable solutions</li>
                                        <li style={{ marginBottom: '0.5rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>★</span> Security - Protecting mission-critical data and systems</li>
                                        <li style={{ marginBottom: '0.5rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>★</span> Innovation - Embracing cutting-edge technology</li>
                                        <li style={{ marginBottom: '0.5rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>★</span> Excellence - Exceeding the highest standards</li>
                                        <li style={{ marginBottom: '0.5rem' }}><span style={{ color: '#d4af37', fontWeight: '700' }}>★</span> Integrity - Operating with transparency and trust</li>
                                    </ul>
                                </div>
                                
                                {/* Brand Story */}
                                <div className="hover-lift animate-scale-in" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '3rem',
                                    borderRadius: '20px',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                    animationDelay: '0.6s',
                                    opacity: 0
                                }}>
                                    <h3 style={{ 
                                        color: '#d4af37', 
                                        marginBottom: '1.5rem', 
                                        fontSize: '1.8rem',
                                        fontWeight: '800',
                                        textShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                                        textAlign: 'center'
                                    }}>
                                        Our Brand
                                    </h3>
                                    <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '1rem', fontSize: '1.05rem' }}>
                                        Our logo was inspired by a plane <span style={{ color: '#d4af37', fontWeight: '700' }}>(F-117 Nighthawk, Stealth Aircraft)</span> and our founders' prior service in the <span style={{ color: '#d4af37', fontWeight: '700' }}>US Air Force</span>. Our name <span style={{ color: '#d4af37', fontWeight: '700' }}>Navon</span> means <span style={{ color: '#d4af37', fontWeight: '700' }}>wisdom</span>.
                                    </p>
                                    <p style={{ color: '#cbd5e1', lineHeight: '1.8', margin: '0', fontSize: '1.05rem' }}>
                                        Like a plane and a wise owl, we strive to reach the highest point of excellence. Our goal is to soar in every component of business; in the technology aspect, like the plane and in our behaviors, like a wise owl.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Certifications Section */}
                        <section id="certifications" style={{ 
                            padding: '5rem 2rem', 
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.50) 0%, rgba(30, 41, 59, 0.45) 50%, rgba(51, 65, 85, 0.50) 100%), url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80") center/cover',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Diagonal Gold Lines Background */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 80px,
                                    rgba(212, 175, 55, 0.15) 80px,
                                    rgba(212, 175, 55, 0.15) 82px
                                )`,
                                pointerEvents: 'none',
                                zIndex: 0
                            }}></div>
                            
                            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                                <h3 className="animate-fade-in-up" style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '3rem',
                                    textAlign: 'center',
                                    color: '#d4af37',
                                    fontWeight: '800',
                                    textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                                }}>
                                    Certifications
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '2rem',
                                    alignItems: 'center'
                                }}>
                                    {[
                                        'public_sector_partner.jpeg',
                                        'select_tier_partner.jpeg'
                                    ].map((cert, index) => (
                                        <div key={index} className="hover-lift animate-scale-in" style={{
                                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                            padding: '2.5rem',
                                            borderRadius: '20px',
                                            textAlign: 'center',
                                            border: '2px solid #d4af37',
                                            boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                            animationDelay: `${index * 0.2}s`,
                                            opacity: 0
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
                                    <div key={`aws-${index}`} className="hover-lift animate-scale-in" style={{
                                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                        padding: '2rem',
                                        borderRadius: '20px',
                                        textAlign: 'center',
                                        border: '2px solid rgba(212, 175, 55, 0.5)',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
                                        minHeight: '140px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        animationDelay: `${(index + 2) * 0.1}s`,
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem auto',
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                                        }}>
                                            ☁️
                                        </div>
                                        <h4 style={{
                                            color: '#d4af37',
                                            margin: 0,
                                            fontSize: '1rem',
                                            fontWeight: '700'
                                        }}>
                                            {awsCert}
                                        </h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                        {/* Contract Vehicles & SBA Section */}
                        <section style={{ padding: '5rem 2rem', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
                            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                                <h3 className="animate-fade-in-up" style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '3rem',
                                    textAlign: 'center',
                                    color: '#1e293b',
                                    fontWeight: '800'
                                }}>
                                    Contract Vehicles & <span style={{ color: '#d4af37' }}>SBA Certification</span>
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    gap: '3rem',
                                    alignItems: 'center'
                                }}>
                                    <div className="hover-lift animate-scale-in" style={{
                                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        textAlign: 'center',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)'
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
                                        <h4 style={{ 
                                            color: '#d4af37', 
                                            marginBottom: '1rem',
                                            fontSize: '1.3rem',
                                            fontWeight: '700'
                                        }}>
                                        SBA Certified Small Business
                                    </h4>
                                    <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '1.05rem' }}>
                                        Certified Small Business Enterprise with SBA registration,
                                        enabling participation in federal set-aside contracts and
                                        small business procurement opportunities.
                                    </p>
                                </div>
                                <div className="hover-lift animate-scale-in" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '2.5rem',
                                    borderRadius: '20px',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                    animationDelay: '0.2s',
                                    opacity: 0
                                }}>
                                    <h4 style={{ 
                                        color: '#d4af37', 
                                        marginBottom: '1.5rem', 
                                        textAlign: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        textShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                                    }}>
                                        Available Contract Vehicles
                                    </h4>
                                    <div style={{ textAlign: 'left' }}>
                                        {[
                                            { name: 'GSA Schedule 70', desc: 'IT Products, Services & Solutions' },
                                            { name: 'SEWP VI', desc: 'Solutions for Enterprise-Wide Procurement' },
                                            { name: 'CIO-SP3', desc: 'Chief Information Officer-Solutions and Partners 3' },
                                            { name: 'Direct Awards', desc: 'Prime and subcontractor opportunities' }
                                        ].map((vehicle, index) => (
                                            <div key={index} style={{ 
                                                marginBottom: '1rem', 
                                                padding: '1rem', 
                                                background: 'rgba(255, 255, 255, 0.05)', 
                                                borderRadius: '12px',
                                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.1)'
                                            }}>
                                                <div style={{ fontWeight: '700', color: '#d4af37', marginBottom: '0.25rem', fontSize: '1.05rem' }}>
                                                    {vehicle.name}
                                                </div>
                                                <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
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
            {/* CAPABILITIES PAGE */}
            {currentPage === 'capabilities' && (
                <div>
                    {/* Hero Section */}
                    <section style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 50%, rgba(51, 65, 85, 0.92) 100%), url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80") center/cover',
                        padding: '6rem 2rem 4rem 2rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="animate-pulse" style={{
                            position: 'absolute',
                            top: '20%',
                            left: '10%',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        
                        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <h2 className="animate-fade-in-up" style={{
                                fontSize: '3.5rem',
                                marginBottom: '2rem',
                                color: 'white',
                                fontWeight: '800',
                                letterSpacing: '-0.02em'
                            }}>
                                Core <span className="gradient-text">Capabilities</span>
                            </h2>
                            <p className="animate-fade-in-up" style={{
                                fontSize: '1.3rem',
                                color: '#cbd5e1',
                                maxWidth: '800px',
                                margin: '0 auto',
                                lineHeight: '1.8',
                                animationDelay: '0.2s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                            }}>
                                Delivering mission-critical technology solutions with security, reliability, and innovation at the core
                            </p>
                        </div>
                    </section>

                    {/* Gold Divider */}
                    <div className="animate-pulse" style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                        margin: '0'
                    }}></div>

                    {/* Core Capabilities Grid */}
                    <section style={{ padding: '5rem 2rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                                    image: 'AI.png',
                                    description: 'Advanced AI/ML solutions for data analysis, automation, and intelligent decision-making systems.'
                                }
                            ].map((capability, index) => {
                                // Alternate animation directions: left, left, top, top, right, right pattern
                                let imageAnimation;
                                if (index < 2) {
                                    imageAnimation = 'animate-image-slide-left';
                                } else if (index < 4) {
                                    imageAnimation = 'animate-image-slide-top';
                                } else {
                                    imageAnimation = 'animate-image-slide-right';
                                }
                                
                                return (
                                <div key={index} className="hover-lift animate-scale-in" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '0',
                                    borderRadius: '20px',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                    overflow: 'hidden',
                                    animationDelay: `${index * 0.1}s`,
                                    opacity: 0
                                }}>
                                    <div style={{ 
                                        overflow: 'hidden',
                                        borderBottom: '2px solid #d4af37'
                                    }}>
                                        <img
                                            src={capability.image === 'AI.png' ? `${s3BaseUrl}/images/solutions/${capability.image}` : `${s3BaseUrl}/public/images/solutions/${capability.image}`}
                                            alt={capability.title}
                                            className={imageAnimation}
                                            style={{
                                                width: '100%',
                                                height: '220px',
                                                objectFit: 'cover',
                                                opacity: 0,
                                                animationDelay: index === 0 ? '0.2s' : `${index * 0.2 + 0.4}s`
                                            }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ padding: '2rem' }}>
                                        <h3 style={{ 
                                            color: '#d4af37', 
                                            marginBottom: '1rem', 
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            textShadow: '0 0 10px rgba(212, 175, 55, 0.3)'
                                        }}>
                                            {capability.title}
                                        </h3>
                                        <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.05rem', margin: 0 }}>
                                            {capability.description}
                                        </p>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </section>

                        {/* Professional IT Services Section */}
                        <section style={{ 
                            padding: '5rem 2rem', 
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.50) 0%, rgba(30, 41, 59, 0.45) 50%, rgba(51, 65, 85, 0.50) 100%), url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80") center/cover',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Diagonal Gold Lines Background */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 80px,
                                    rgba(212, 175, 55, 0.15) 80px,
                                    rgba(212, 175, 55, 0.15) 82px
                                )`,
                                pointerEvents: 'none',
                                zIndex: 0
                            }}></div>
                            
                            <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                                <h2 className="animate-fade-in-up" style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '1.5rem',
                                    textAlign: 'center',
                                    color: '#d4af37',
                                    fontWeight: '800',
                                    textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                                }}>
                                    Boost Your Project with <span style={{ color: '#d4af37' }}>Navon Technologies IT Services</span>
                                </h2>
                                <p className="animate-fade-in-up" style={{
                                    fontSize: '1.1rem',
                                    color: '#cbd5e1',
                                    textAlign: 'center',
                                    marginBottom: '4rem',
                                    maxWidth: '800px',
                                    margin: '0 auto 4rem auto',
                                    animationDelay: '0.2s',
                                    opacity: 0,
                                    animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                                }}>
                                    Comprehensive IT solutions designed to accelerate your mission-critical projects
                                </p>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                    gap: '2rem'
                                }}>
                                    {/* Custom Software Development */}
                                    <div className="hover-lift animate-slide-in-left" style={{
                                        background: '#ffffff',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)'
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>💻</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '700'
                                        }}>
                                            Custom Software Development
                                        </h3>
                                        <p style={{
                                            color: '#475569',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our team of developers can help you create custom software tailored to your project needs. From web applications to mobile apps, we can develop software that can help streamline your project processes.
                                        </p>
                                    </div>

                                    {/* Hardware Procurement and Installation */}
                                    <div className="hover-lift animate-fade-in-up" style={{
                                        background: '#ffffff',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
                                        animationDelay: '0.2s',
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>🖥️</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '700'
                                        }}>
                                            Hardware Procurement and Installation
                                        </h3>
                                        <p style={{
                                            color: '#475569',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                        We help small businesses procure and install hardware that is best suited to their business needs. Our team can provide expert advice on hardware selection and installation.
                                    </p>
                                </div>

                                {/* IT Training and Support */}
                                <div className="hover-lift animate-slide-in-right" style={{
                                    background: '#ffffff',
                                    padding: '2.5rem',
                                    borderRadius: '20px',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
                                    animationDelay: '0.4s',
                                    opacity: 0
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>📚</span>
                                    </div>
                                    <h3 style={{
                                        color: '#1e293b',
                                        marginBottom: '1rem',
                                        fontSize: '1.5rem',
                                        fontWeight: '700'
                                    }}>
                                        IT Training and Support
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0',
                                        fontSize: '1.05rem'
                                    }}>
                                        We provide IT training and support to ensure that your employees can make the most of the technology available to them. Our training and support services include on-site training, virtual training, and support via phone and email.
                                    </p>
                                </div>

                                {/* Website Design and Development */}
                                <div className="hover-lift animate-slide-in-left" style={{
                                    background: '#ffffff',
                                    padding: '2.5rem',
                                    borderRadius: '20px',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
                                    animationDelay: '0.6s',
                                    opacity: 0
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>🌐</span>
                                    </div>
                                    <h3 style={{
                                        color: '#1e293b',
                                        marginBottom: '1rem',
                                        fontSize: '1.5rem',
                                        fontWeight: '700'
                                    }}>
                                        Website Design and Development
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0',
                                        fontSize: '1.05rem'
                                    }}>
                                        We specialize in designing and developing websites that are visually appealing, user-friendly, and optimized for search engines. Our websites are designed to help small businesses establish a strong online presence.
                                    </p>
                                </div>

                                {/* Cloud Migration */}
                                <div className="hover-lift animate-fade-in-up" style={{
                                    background: '#ffffff',
                                    padding: '2.5rem',
                                    borderRadius: '20px',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
                                    animationDelay: '0.8s',
                                    opacity: 0
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>☁️</span>
                                    </div>
                                    <h3 style={{
                                        color: '#1e293b',
                                        marginBottom: '1rem',
                                        fontSize: '1.5rem',
                                        fontWeight: '700'
                                    }}>
                                        Cloud Migration
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0',
                                        fontSize: '1.05rem'
                                    }}>
                                        We help small businesses migrate to the cloud to enable greater flexibility and scalability. Our team can help you choose the best cloud solution for your business and ensure a smooth migration process.
                                    </p>
                                </div>

                                {/* IT Project Management */}
                                <div className="hover-lift animate-slide-in-right" style={{
                                    background: '#ffffff',
                                    padding: '2.5rem',
                                    borderRadius: '20px',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
                                    animationDelay: '1s',
                                    opacity: 0
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>📊</span>
                                    </div>
                                    <h3 style={{
                                        color: '#1e293b',
                                        marginBottom: '1rem',
                                        fontSize: '1.5rem',
                                        fontWeight: '700'
                                    }}>
                                        IT Project Management
                                    </h3>
                                    <p style={{
                                        color: '#475569',
                                        lineHeight: '1.7',
                                        margin: '0',
                                        fontSize: '1.05rem'
                                    }}>
                                        We provide IT project management services to ensure that your IT projects are completed on time, within budget, and to your satisfaction. Our project management services include project planning, resource allocation, and risk management.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
            {/* AWS PAGE */}
            {currentPage === 'aws' && (
                <div>
                    {/* Hero Section */}
                    <section style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 50%, rgba(51, 65, 85, 0.92) 100%), url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80") center/cover',
                        padding: '6rem 2rem 4rem 2rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="animate-pulse" style={{
                            position: 'absolute',
                            top: '20%',
                            right: '10%',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%'
                        }}></div>
                        
                        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <h2 className="animate-fade-in-up" style={{
                                fontSize: '3.5rem',
                                marginBottom: '2rem',
                                color: 'white',
                                fontWeight: '800',
                                letterSpacing: '-0.02em'
                            }}>
                                AWS <span className="gradient-text">Expertise</span>
                            </h2>
                            <p className="animate-fade-in-up" style={{
                                fontSize: '1.3rem',
                                color: '#cbd5e1',
                                maxWidth: '800px',
                                margin: '0 auto',
                                lineHeight: '1.8',
                                animationDelay: '0.2s',
                                opacity: 0,
                                animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                            }}>
                                Delivering secure, scalable cloud solutions with AWS Select Tier and Public Sector Partnership
                            </p>
                        </div>
                    </section>

                    {/* Gold Divider */}
                    <div className="animate-pulse" style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                        margin: '0'
                    }}></div>

                    {/* AWS Partnership Section */}
                    <section style={{ padding: '5rem 2rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            {/* AWS Partnership Announcement */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                color: 'white',
                                padding: '3rem',
                                borderRadius: '20px',
                                marginBottom: '3rem',
                                border: '3px solid #d4af37',
                                boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    height: '4px',
                                    background: 'linear-gradient(90deg, #d4af37 0%, #f4e5a1 50%, #d4af37 100%)',
                                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.6)'
                                }}></div>
                                
                                <h4 style={{ 
                                    color: '#d4af37', 
                                    marginBottom: '1.5rem', 
                                    fontSize: '2rem',
                                    fontWeight: '800',
                                    lineHeight: '1.3',
                                    textShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                                }}>
                                    Navon Technologies Achieves AWS Select Tier and Public Sector Partnership
                                </h4>
                                
                                <div style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#cbd5e1' }}>
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
                                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
                                        padding: '2rem', 
                                        borderRadius: '15px',
                                        marginTop: '1.5rem',
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <h5 style={{ color: '#d4af37', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
                                            Key Partnership Benefits:
                                        </h5>
                                        <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#cbd5e1' }}>
                                            <li style={{ marginBottom: '0.8rem' }}>
                                                <strong style={{ color: '#d4af37' }}>Data Validation & Integrity:</strong> Built-in validation mechanisms and automatic error handling during migration
                                            </li>
                                            <li style={{ marginBottom: '0.8rem' }}>
                                                <strong style={{ color: '#d4af37' }}>Cost Optimization:</strong> Right-sized data storage and processing solutions using Amazon S3 and AWS Lambda
                                            </li>
                                            <li style={{ marginBottom: '0.8rem' }}>
                                                <strong style={{ color: '#d4af37' }}>DevSecOps Services:</strong> Integrated security measures throughout the entire development lifecycle
                                            </li>
                                            <li style={{ marginBottom: '0' }}>
                                                <strong style={{ color: '#d4af37' }}>Automated Compliance:</strong> AWS Config and Security Hub for automated compliance checks and security best practices
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Gold Divider */}
                    <div className="animate-pulse" style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                        margin: '0'
                    }}></div>

                    {/* AWS Services Grid */}
                    <section style={{ padding: '5rem 2rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                            <h3 className="animate-fade-in-up" style={{
                                fontSize: '2.5rem',
                                marginBottom: '3rem',
                                textAlign: 'center',
                                color: '#d4af37',
                                fontWeight: '800',
                                textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                            }}>
                                AWS Services
                            </h3>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '2rem'
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
                                <div key={index} className="hover-lift animate-scale-in" style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    padding: '2rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                                    minHeight: '200px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    animationDelay: `${index * 0.05}s`,
                                    opacity: 0
                                }}>
                                    <img
                                        src={getImageSrc(service)}
                                        alt={service.name}
                                        style={{
                                            width: ['AWS Cognito', 'AWS DevOps', 'AWS Security Hub'].includes(service.name) ? '150px' : (['AWS Lambda', 'React & Amplify'].includes(service.name) ? '130px' : '110px'),
                                            height: ['AWS Cognito', 'AWS DevOps', 'AWS Security Hub'].includes(service.name) ? '150px' : (['AWS Lambda', 'React & Amplify'].includes(service.name) ? '130px' : '110px'),
                                            objectFit: 'contain',
                                            marginBottom: '1rem'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <h4 style={{ 
                                        color: '#d4af37', 
                                        margin: 0, 
                                        fontSize: '1.1rem',
                                        fontWeight: '700'
                                    }}>
                                        {service.name}
                                    </h4>
                                </div>
                                );
                            })}
                        </div>
                        
                        {/* And many more text */}
                        <div className="animate-fade-in-up" style={{ 
                            textAlign: 'center', 
                            marginTop: '3rem',
                            fontSize: '1.5rem',
                            color: '#1e293b',
                            fontWeight: '700',
                            fontStyle: 'italic',
                            animationDelay: '0.8s',
                            opacity: 0
                        }}>
                            <span style={{ color: '#d4af37' }}>...and many more!</span>
                        </div>
                    </div>
                </section>

                        {/* AWS Managed IT Services Section */}
                        <section style={{ 
                            padding: '5rem 2rem', 
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.50) 0%, rgba(30, 41, 59, 0.45) 50%, rgba(51, 65, 85, 0.50) 100%), url("https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&q=80") center/cover',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Diagonal Gold Lines Background */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 80px,
                                    rgba(212, 175, 55, 0.15) 80px,
                                    rgba(212, 175, 55, 0.15) 82px
                                )`,
                                pointerEvents: 'none',
                                zIndex: 0
                            }}></div>
                            
                            <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                                <h2 className="animate-fade-in-up" style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '3rem',
                                    textAlign: 'center',
                                    color: '#d4af37',
                                    fontWeight: '800',
                                    textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                                }}>
                                    Professional IT Services for Your Business
                                </h2>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                    gap: '2rem'
                                }}>
                                    {/* Managed IT Services */}
                                    <div className="hover-lift animate-slide-in-left" style={{
                                        background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(255, 255, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>⚙️</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '800'
                                        }}>
                                            AWS Managed IT Services
                                        </h3>
                                        <p style={{
                                            color: '#1e293b',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our AWS Managed IT Services provide comprehensive IT support and management for your business. We will proactively monitor your network and systems, handle all updates and patches, and provide fast and reliable support when you need it.
                                        </p>
                                    </div>

                                    {/* Cloud Services */}
                                    <div className="hover-lift animate-fade-in-up" style={{
                                        background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
                                        animationDelay: '0.2s',
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(255, 255, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>☁️</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '800'
                                        }}>
                                            Cloud Services
                                        </h3>
                                        <p style={{
                                            color: '#1e293b',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our Cloud Services provide a reliable and scalable solution for your business needs. We offer cloud migration, secure data storage, and cloud-based software solutions to help your business operate more efficiently and effectively.
                                        </p>
                                    </div>

                                    {/* Cybersecurity Services */}
                                    <div className="hover-lift animate-slide-in-right" style={{
                                        background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
                                        animationDelay: '0.4s',
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(255, 255, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>🔒</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '800'
                                        }}>
                                            Cybersecurity Services
                                        </h3>
                                        <p style={{
                                            color: '#1e293b',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our Cybersecurity Services provide comprehensive protection for your business against cyber threats. We offer risk assessments, vulnerability testing, threat monitoring, and training to ensure your business is secure.
                                        </p>
                                    </div>

                                    {/* Network Design and Implementation */}
                                    <div className="hover-lift animate-slide-in-left" style={{
                                        background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
                                        animationDelay: '0.6s',
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(255, 255, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>🌐</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '800'
                                        }}>
                                            Network Design and Implementation
                                        </h3>
                                        <p style={{
                                            color: '#1e293b',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our Network Design and Implementation services provide customized network solutions for your business. We will assess your needs, design a network architecture, and implement the solution to ensure your business runs smoothly.
                                        </p>
                                    </div>

                                    {/* Data Backup and Recovery */}
                                    <div className="hover-lift animate-fade-in-up" style={{
                                        background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
                                        animationDelay: '0.8s',
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(255, 255, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>💾</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '800'
                                        }}>
                                            Data Backup and Recovery
                                        </h3>
                                        <p style={{
                                            color: '#1e293b',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our Data Backup and Recovery services provide peace of mind knowing your business data is secure and recoverable. We will set up automatic backups, test recovery processes, and ensure your data is safe in the event of a disaster.
                                        </p>
                                    </div>

                                    {/* IT Consulting Services */}
                                    <div className="hover-lift animate-slide-in-right" style={{
                                        background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                        padding: '2.5rem',
                                        borderRadius: '20px',
                                        border: '2px solid #d4af37',
                                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
                                        animationDelay: '1s',
                                        opacity: 0
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 8px 20px rgba(255, 255, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '2rem' }}>💡</span>
                                        </div>
                                        <h3 style={{
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: '800'
                                        }}>
                                            IT Consulting Services
                                        </h3>
                                        <p style={{
                                            color: '#1e293b',
                                            lineHeight: '1.7',
                                            margin: '0',
                                            fontSize: '1.05rem'
                                        }}>
                                            Our IT Consulting Services provide expert guidance and support for your business technology needs. We will assess your current IT infrastructure, recommend improvements, and help you implement solutions that drive business growth.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* CAREERS PAGE */}
            {currentPage === 'careers' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.50) 0%, rgba(30, 41, 59, 0.45) 50%, rgba(51, 65, 85, 0.50) 100%), url("https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1920&q=80") center/cover',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Diagonal Gold Lines Background */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 80px,
                            rgba(212, 175, 55, 0.15) 80px,
                            rgba(212, 175, 55, 0.15) 82px
                        )`,
                        pointerEvents: 'none',
                        zIndex: 0
                    }}></div>

                    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        <h2 className="animate-fade-in-up" style={{
                            fontSize: '2.5rem',
                            marginBottom: '3rem',
                            textAlign: 'center',
                            color: '#d4af37',
                            fontWeight: '800',
                            textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
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
                                    title: 'AWS Solution Architect',
                                    category: 'AWS Solution Architect',
                                    type: 'Full-time and Part-time',
                                    location: '',
                                    description: 'Design and implement scalable AWS cloud solutions for government clients. Lead architectural decisions and provide technical guidance.',
                                    requirements: ['AWS Solutions Architect Certification', 'Government contracting experience', '5+ years cloud architecture']
                                },
                                {
                                    title: 'Cloud Software Developer',
                                    category: 'Cloud Software Developer',
                                    type: 'Full-time',
                                    location: '',
                                    description: 'Develop and deploy cloud-native applications using modern frameworks and AWS services for federal clients.',
                                    requirements: ['3+ years software development', 'AWS experience', 'Modern web frameworks (React, Node.js, Python)']
                                },
                                {
                                    title: 'Network Engineer',
                                    category: 'Network Engineer',
                                    type: 'Full-time',
                                    location: '',
                                    description: 'Design, implement, and maintain secure network infrastructure for federal agencies and defense contractors.',
                                    requirements: ['CCNA/CCNP Certification', 'Network security experience', 'Government networking protocols']
                                },
                                {
                                    title: 'Systems Integrator/Comms Expert',
                                    category: 'Systems Integrator/Comms Expert',
                                    type: 'Full-time',
                                    location: '',
                                    description: 'Integrate complex communication systems and ensure seamless interoperability across government platforms.',
                                    requirements: ['Systems integration experience', 'Communications protocols', 'Federal systems knowledge']
                                }
                            ].map((job, index) => (
                                <div key={index} className="hover-lift animate-slide-in-left" style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.15)',
                                    animationDelay: `${index * 0.2}s`,
                                    opacity: 0
                                }}>
                                    <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
                                        {job.title}
                                    </h3>
                                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {job.location && (
                                            <span style={{
                                                background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                                color: '#0f172a',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                {job.location}
                                            </span>
                                        )}
                                        <span style={{
                                            background: 'linear-gradient(135deg, #f4e5a1 0%, #e8d68f 100%)',
                                            color: '#0f172a',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                            {job.type}
                                        </span>
                                    </div>
                                    <p style={{ color: '#1e293b', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                        {job.description}
                                    </p>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ color: '#0f172a', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                                            Key Requirements:
                                        </h4>
                                        <ul style={{ color: '#1e293b', paddingLeft: '1.5rem', margin: 0 }}>
                                            {job.requirements.map((req, reqIndex) => (
                                                <li key={reqIndex} style={{ marginBottom: '0.25rem' }}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button style={{
                                        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                        color: '#0f172a',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        width: '100%',
                                        fontSize: '1rem'
                                    }}>
                                        Apply Now
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            textAlign: 'center',
                            marginBottom: '3rem',
                            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.15)'
                        }}>
                            <h4 style={{ color: '#0f172a', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '800' }}>
                                🔒 Secure Application Process
                            </h4>
                            <p style={{ 
                                color: '#1e293b', 
                                fontSize: '1.1rem',
                                lineHeight: '1.7',
                                marginBottom: '2rem',
                                maxWidth: '700px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Due to the sensitive nature of our government contracts, detailed position information 
                                and applications for senior-level roles are processed through our secure employee portal. 
                                This ensures compliance with federal security requirements and protects sensitive project details. 
                                Security clearance verification and background checks are required for all positions.
                            </p>
                        </div>
                        <div style={{
                            background: 'white',
                            padding: '3rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            textAlign: 'center',
                            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.15)'
                        }}>
                            <h3 style={{ color: '#0f172a', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '800' }}>
                                Why Work at NAVON Technologies?
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '2rem',
                                marginTop: '2rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: '700' }}>Paid Training</h4>
                                    <p style={{ color: '#1e293b', fontSize: '0.9rem' }}>Professional certifications and continuous learning</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: '700' }}>Competitive Benefits</h4>
                                    <p style={{ color: '#1e293b', fontSize: '0.9rem' }}>Health, dental, 401k, and professional development</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: '700' }}>Remote Flexibility</h4>
                                    <p style={{ color: '#1e293b', fontSize: '0.9rem' }}>Work from anywhere with secure access</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                                    <h4 style={{ color: '#0f172a', marginBottom: '0.5rem', fontWeight: '700' }}>Mission Impact</h4>
                                    <p style={{ color: '#1e293b', fontSize: '0.9rem' }}>Support critical government operations</p>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <button style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                    Submit Resume
                                </button>
                            </div>
                        </div>

                        {/* Our Benefits Section - Inspired by Vanjure */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            padding: '4rem 2rem',
                            borderRadius: '20px',
                            marginTop: '4rem',
                            border: '3px solid #d4af37',
                            boxShadow: '0 20px 60px rgba(212, 175, 55, 0.3)'
                        }}>
                            <h3 style={{ 
                                color: '#d4af37', 
                                marginBottom: '2rem', 
                                fontSize: '2rem', 
                                fontWeight: '800',
                                textAlign: 'center',
                                textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                            }}>
                                OUR BENEFITS
                            </h3>
                            <p style={{
                                color: '#e2e8f0',
                                fontSize: '1.1rem',
                                textAlign: 'center',
                                marginBottom: '3rem',
                                maxWidth: '800px',
                                margin: '0 auto 3rem auto',
                                lineHeight: '1.7'
                            }}>
                                At NAVON Technologies, we offer a comprehensive and competitive benefits package. New hire benefits begin on date of hire. Full-time employees working at least 30 hours per week are eligible. Open enrollment is in October every year.
                            </p>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '2rem'
                            }}>
                                {[
                                    { icon: '🏖️', title: 'Generous PTO', desc: 'Competitive paid time off with flexible scheduling' },
                                    { icon: '🎉', title: 'Paid Holidays', desc: '11 holidays: New Year\'s Day, MLK Day, President\'s Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veteran\'s Day, Thanksgiving, Christmas' },
                                    { icon: '💰', title: '401k Matching & Profit Sharing', desc: '3% safe-harbor with immediate vesting after 30 days. Traditional pre-tax and Roth options. Annual profit-sharing contributions' },
                                    { icon: '🏥', title: 'Medical Insurance - 100% Company Paid', desc: 'Anthem Gold PPO/HSA and Platinum PPO plans. Coverage for employee, spouse/domestic partner, and children up to age 26' },
                                    { icon: '🦷', title: 'Dental Insurance - 100% Company Paid', desc: 'Essential Choice Classic plan with $1,500 annual maximum. Anthem Dental network' },
                                    { icon: '👀', title: 'Vision Insurance - 100% Company Paid', desc: 'Blue View Vision Plan with $10 exam copay, $130 frame allowance, and contact lens benefit' },
                                    { icon: '💼', title: 'Group Life & AD&D - 100% Company Paid', desc: 'Life insurance equal to salary (doubles for accidental death). Amounts over $50K require EOI form' },
                                    { icon: '🏥', title: 'Short-Term Disability - 100% Company Paid', desc: '60% of weekly earnings up to $2,500/week. Benefits begin 1st day after accident or 8th day for illness, up to 13 weeks' },
                                    { icon: '🛡️', title: 'Long-Term Disability - 100% Company Paid', desc: '60% of monthly earnings up to $12,000/month. Benefits begin on 91st day and continue through disability' },
                                    { icon: '📚', title: 'Training & Development', desc: 'Annual training budget, AWS training portal access, tuition assistance, and online learning resources' },
                                    { icon: '💪', title: 'Health & Wellness', desc: 'Health and wellness allowance for gym memberships or fitness reimbursement' },
                                    { icon: '🎁', title: 'Bonuses', desc: 'Bonuses awarded for personal and professional milestones throughout the year' }
                                ].map((benefit, index) => (
                                    <div key={index} className="hover-lift" style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        border: '2px solid rgba(212, 175, 55, 0.3)',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{benefit.icon}</div>
                                        <h4 style={{ 
                                            color: '#d4af37', 
                                            marginBottom: '0.5rem', 
                                            fontSize: '1.2rem',
                                            fontWeight: '700'
                                        }}>
                                            {benefit.title}
                                        </h4>
                                        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0 }}>
                                            {benefit.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginTop: '3rem',
                                padding: '2rem',
                                background: 'rgba(212, 175, 55, 0.1)',
                                borderRadius: '12px',
                                border: '2px solid #d4af37'
                            }}>
                                <h4 style={{ 
                                    color: '#d4af37', 
                                    fontSize: '1.3rem', 
                                    marginBottom: '1.5rem',
                                    fontWeight: '800',
                                    textAlign: 'center'
                                }}>
                                    Additional Benefit Perks
                                </h4>
                                <p style={{ 
                                    color: '#cbd5e1', 
                                    fontSize: '0.9rem', 
                                    marginBottom: '1.5rem',
                                    textAlign: 'center',
                                    fontStyle: 'italic'
                                }}>
                                    Subject to change without notice
                                </p>
                                <div style={{
                                    color: '#f1f5f9',
                                    fontSize: '1rem',
                                    lineHeight: '1.8',
                                    maxWidth: '900px',
                                    margin: '0 auto'
                                }}>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        <li style={{ marginBottom: '0.8rem', paddingLeft: '1.5rem', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>•</span>
                                            <strong style={{ color: '#d4af37' }}>Annual Training:</strong> Professional development opportunities
                                        </li>
                                        <li style={{ marginBottom: '0.8rem', paddingLeft: '1.5rem', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>•</span>
                                            <strong style={{ color: '#d4af37' }}>Tuition Assistance:</strong> Financial support for continuing education
                                        </li>
                                        <li style={{ marginBottom: '0.8rem', paddingLeft: '1.5rem', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>•</span>
                                            <strong style={{ color: '#d4af37' }}>AWS Training Portal:</strong> Full access to AWS learning resources
                                        </li>
                                        <li style={{ marginBottom: '0.8rem', paddingLeft: '1.5rem', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>•</span>
                                            <strong style={{ color: '#d4af37' }}>Online Training:</strong> Access to various online learning platforms
                                        </li>
                                        <li style={{ marginBottom: '0.8rem', paddingLeft: '1.5rem', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>•</span>
                                            <strong style={{ color: '#d4af37' }}>Gym Membership:</strong> Reimbursement or membership support
                                        </li>
                                    </ul>
                                    
                                    <div style={{ 
                                        marginTop: '2rem', 
                                        padding: '1.5rem',
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <h5 style={{ 
                                            color: '#d4af37', 
                                            fontSize: '1.2rem', 
                                            marginBottom: '1rem',
                                            fontWeight: '700'
                                        }}>
                                            💰 New Hire Referral Bonuses
                                        </h5>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            <li style={{ marginBottom: '0.8rem', paddingLeft: '1.5rem', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>1.</span>
                                                <strong style={{ color: '#f4e5a1' }}>$1,000</strong> for AWS Certified referral (paid after 60 days of hire)
                                            </li>
                                            <li style={{ marginBottom: 0, paddingLeft: '1.5rem', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>2.</span>
                                                <strong style={{ color: '#f4e5a1' }}>$10,000</strong> for TS/SCI clearance with full-scope polygraph (half at 3 months, half at 6 months post-hire)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '3rem',
                                padding: '2rem',
                                background: 'rgba(212, 175, 55, 0.1)',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ 
                                    color: '#d4af37', 
                                    fontSize: '1.5rem', 
                                    marginBottom: '1rem',
                                    fontWeight: '800'
                                }}>
                                    🚀 Be a Leader
                                </h4>
                                <p style={{ 
                                    color: '#f1f5f9', 
                                    fontSize: '1.1rem', 
                                    lineHeight: '1.7',
                                    maxWidth: '700px',
                                    margin: '0 auto'
                                }}>
                                    At NAVON Technologies, we invest in and empower our team members to be leaders in their careers and personal lives. Join us in delivering mission-critical solutions that make a difference.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {/* CONTACT PAGE */}
            {currentPage === 'contact' && (
                <section style={{
                    padding: '4rem 2rem',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.50) 0%, rgba(30, 41, 59, 0.45) 50%, rgba(51, 65, 85, 0.50) 100%), url("https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&q=80") center/cover',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Diagonal Gold Lines Background */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 80px,
                            rgba(212, 175, 55, 0.15) 80px,
                            rgba(212, 175, 55, 0.15) 82px
                        )`,
                        pointerEvents: 'none',
                        zIndex: 0
                    }}></div>

                    <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        <h2 className="animate-fade-in-up" style={{
                            fontSize: '2.5rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            fontWeight: '800',
                            color: '#d4af37',
                            textShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                        }}>
                            Ready to Secure Your Mission?
                        </h2>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '3rem'
                        }}>
                            <div className="hover-lift" style={{ 
                                textAlign: 'center', 
                                maxWidth: '600px',
                                background: 'linear-gradient(135deg, #f5f5dc 0%, #ede0c8 100%)',
                                padding: '3rem',
                                borderRadius: '8px',
                                border: '8px solid transparent',
                                borderImage: 'linear-gradient(45deg, #d4af37 0%, #f4e5a1 25%, #d4af37 50%, #b8941f 75%, #d4af37 100%) 1',
                                boxShadow: '0 20px 60px rgba(212, 175, 55, 0.3), inset 0 0 0 2px #d4af37, inset 0 0 0 4px #f5f5dc',
                                animation: 'rollIn 1s ease-out forwards',
                                transform: 'translateX(-100%) rotate(-360deg)',
                                opacity: 0,
                                position: 'relative'
                            }}>
                                {/* Corner decorations for mitered frame effect */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    left: '-4px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'linear-gradient(135deg, #d4af37 0%, #f4e5a1 100%)',
                                    clipPath: 'polygon(0 0, 100% 0, 0 100%)'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'linear-gradient(225deg, #d4af37 0%, #f4e5a1 100%)',
                                    clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    left: '-4px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'linear-gradient(45deg, #d4af37 0%, #f4e5a1 100%)',
                                    clipPath: 'polygon(0 0, 0 100%, 100% 100%)'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    right: '-4px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'linear-gradient(315deg, #d4af37 0%, #f4e5a1 100%)',
                                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
                                }}></div>
                                
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem auto',
                                    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4)',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <span style={{ fontSize: '2.5rem' }}>📧</span>
                                </div>
                                <h3 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '800', color: '#0f172a', position: 'relative', zIndex: 1 }}>Contact Information</h3>
                                <p style={{ marginBottom: '1rem', fontSize: '1.3rem', lineHeight: '1.8', color: '#1e293b', position: 'relative', zIndex: 1 }}>
                                    Email: info@navontechnologies.com<br />
                                    Phone: 571-477-2727<br />
                                    Fax: 571-477-2727<br />
                                    Response Time: 24 hours
                                </p>
                            </div>
                        </div>
                        
                        <style>{`
                            @keyframes rollIn {
                                0% {
                                    transform: translateX(-100%) rotate(-360deg);
                                    opacity: 0;
                                }
                                100% {
                                    transform: translateX(0) rotate(0deg);
                                    opacity: 1;
                                }
                            }
                        `}</style>
                        
                        <div className="animate-fade-in-up" style={{ 
                            textAlign: 'center', 
                            marginTop: '3rem',
                            animationDelay: '0.4s',
                            opacity: 0
                        }}>
                            <a href={`${s3BaseUrl}/public/images/NAVON_Technologies_Capability_Statement_2026.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover-lift"
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                                    color: '#0f172a',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: '700',
                                    display: 'inline-block',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}>
                                Download Capability Statement
                            </a>
                        </div>
                        
                        {/* Social Media Section */}
                        <div style={{ 
                            textAlign: 'center', 
                            marginTop: '4rem',
                            background: 'linear-gradient(135deg, #f5f5dc 0%, #ede0c8 100%)',
                            padding: '2.5rem 2rem',
                            borderRadius: '8px',
                            border: '8px solid transparent',
                            borderImage: 'linear-gradient(45deg, #d4af37 0%, #f4e5a1 25%, #d4af37 50%, #b8941f 75%, #d4af37 100%) 1',
                            boxShadow: '0 20px 60px rgba(212, 175, 55, 0.3), inset 0 0 0 2px #d4af37, inset 0 0 0 4px #f5f5dc',
                            maxWidth: '700px',
                            margin: '4rem auto 0 auto',
                            position: 'relative'
                        }}>
                            {/* Corner decorations for mitered frame effect */}
                            <div style={{
                                position: 'absolute',
                                top: '-4px',
                                left: '-4px',
                                width: '30px',
                                height: '30px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #f4e5a1 100%)',
                                clipPath: 'polygon(0 0, 100% 0, 0 100%)'
                            }}></div>
                            <div style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '30px',
                                height: '30px',
                                background: 'linear-gradient(225deg, #d4af37 0%, #f4e5a1 100%)',
                                clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
                            }}></div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '-4px',
                                width: '30px',
                                height: '30px',
                                background: 'linear-gradient(45deg, #d4af37 0%, #f4e5a1 100%)',
                                clipPath: 'polygon(0 0, 0 100%, 100% 100%)'
                            }}></div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                width: '30px',
                                height: '30px',
                                background: 'linear-gradient(315deg, #d4af37 0%, #f4e5a1 100%)',
                                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
                            }}></div>
                            
                            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', position: 'relative', zIndex: 1 }}>Stay Connected</h3>
                            <p style={{ marginBottom: '2rem', fontSize: '1rem', color: '#1e293b', position: 'relative', zIndex: 1 }}>
                                Follow us for the latest updates, insights, and opportunities
                            </p>
                            <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                                <a href="https://linkedin.com/company/navon-technologies" target="_blank" rel="noopener noreferrer" className="hover-lift" style={{
                                    color: '#0f172a',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.color = '#d4af37';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.color = '#0f172a';
                                }}>
                                    <svg style={{ width: '4rem', height: '4rem' }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                    <span>LinkedIn</span>
                                </a>
                                <a href="https://facebook.com/navontechnologies" target="_blank" rel="noopener noreferrer" className="hover-lift" style={{
                                    color: '#0f172a',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.color = '#d4af37';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.color = '#0f172a';
                                }}>
                                    <svg style={{ width: '4rem', height: '4rem' }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    <span>Facebook</span>
                                </a>
                                <a href="https://instagram.com/navontechnologies" target="_blank" rel="noopener noreferrer" className="hover-lift" style={{
                                    color: '#0f172a',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.color = '#d4af37';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.color = '#0f172a';
                                }}>
                                    <svg style={{ width: '4rem', height: '4rem' }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                    <span>Instagram</span>
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
                                        { name: 'AWS Console Access', status: 'Active' },
                                        { name: 'Project Management Suite', status: 'Active' },
                                        { name: 'Secure Code Repository', status: 'Active' },
                                        { name: 'Encrypted Communications', status: 'Active' },
                                        { name: 'Time Tracking System', status: 'Active' },
                                        { name: 'Security Compliance Dashboard', status: 'Active' }
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
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '1rem'
                                }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: '#475569'
                                    }}>
                                        <input
                                            type="checkbox"
                                            defaultChecked={true}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                marginRight: '0.75rem',
                                                cursor: 'pointer',
                                                accentColor: '#1e3a8a'
                                            }}
                                        />
                                        <span style={{ fontWeight: '500' }}>
                                            Publish my information to the directory
                                        </span>
                                    </label>
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
                            {/* Job Vacancy Portal Section */}
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
                                        💼
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem' }}>
                                        Job Vacancy Portal
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    {[
                                        {
                                            title: 'Senior Cloud Security Engineer',
                                            location: 'Remote/DC Metro',
                                            description: 'Lead cybersecurity initiatives for federal cloud infrastructure. AWS certifications preferred.',
                                            requirements: ['Security+ Certification', '5+ years AWS experience', 'Federal contracting experience']
                                        },
                                        {
                                            title: 'Cloud Software Developer',
                                            location: 'Remote/DC Metro',
                                            description: 'Develop and deploy cloud-native applications using modern frameworks and AWS services.',
                                            requirements: ['3+ years software development', 'AWS experience', 'Modern web frameworks (React, Node.js, Python)']
                                        },
                                        {
                                            title: 'DevOps Systems Engineer',
                                            location: 'Hybrid - DC Area',
                                            description: 'Design and implement CI/CD pipelines for government applications using AWS services.',
                                            requirements: ['AWS Solutions Architect', 'Kubernetes experience', 'Infrastructure as Code']
                                        },
                                        {
                                            title: 'Project Manager - Federal Contracts',
                                            location: 'Remote',
                                            description: 'Manage complex government technology projects with agile methodologies.',
                                            requirements: ['PMP Certification', 'Government contracting', 'Agile/Scrum Master']
                                        }
                                    ].map((job, index) => (
                                        <div key={index} style={{
                                            padding: '1rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            marginBottom: '1rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                fontWeight: '600',
                                                color: '#1e3a8a',
                                                fontSize: '1rem',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {job.title}
                                            </div>
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    background: '#e0f2fe',
                                                    color: '#0369a1',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {job.location}
                                                </span>
                                            </div>
                                            <p style={{ 
                                                color: '#475569', 
                                                fontSize: '0.85rem', 
                                                lineHeight: '1.4',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {job.description}
                                            </p>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                Requirements: {job.requirements.join(', ')}
                                            </div>
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
                                    Apply for Position
                                </button>
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
                                            name: 'Employee Handbook 2026',
                                            type: 'PDF',
                                            classification: 'Unclassified',
                                            modified: '1 week ago',
                                            size: '1.8 MB'
                                        },
                                        {
                                            name: 'Benefits Overview 2026',
                                            type: 'PDF',
                                            classification: 'Unclassified',
                                            modified: '2 weeks ago',
                                            size: '950 KB'
                                        },
                                        {
                                            name: 'Annual Review Survey',
                                            type: 'PDF',
                                            classification: 'Unclassified',
                                            modified: '3 days ago',
                                            size: '425 KB'
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

            {/* SECURE PORTAL PAGE - DUPLICATE */}
            {currentPage === 'secureportal' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: 'white',
                                fontWeight: '800'
                            }}>
                                🔐 Secure Employee Portal
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#cbd5e1',
                                maxWidth: '800px',
                                margin: '0 auto'
                            }}>
                                Access your secure workspace with multi-factor authentication and role-based permissions
                            </p>
                        </div>

                        {/* 5 Large Portal Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* Card 1: Employee Profile & Directory */}
                            <div 
                                className="hover-lift animate-scale-in" 
                                onClick={() => {
                                    setCurrentPage('employeeprofile');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    padding: '3rem 2rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                }}>
                                    👥
                                </div>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    marginBottom: '1rem'
                                }}>
                                    Employee Profile & Directory
                                </h3>
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    marginBottom: '2rem'
                                }}>
                                    Manage your profile, view team directory, and update contact information
                                </p>
                                <div style={{
                                    background: 'rgba(212, 175, 55, 0.2)',
                                    border: '2px solid #d4af37',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1.5rem',
                                    color: '#f4e5a1',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    Enter
                                </div>
                            </div>

                            {/* Card 2: Time Card Management */}
                            <div 
                                className="hover-lift animate-scale-in" 
                                onClick={() => {
                                    setCurrentPage('timecardmanagement');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    padding: '3rem 2rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animationDelay: '0.1s'
                                }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                }}>
                                    ⏰
                                </div>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    marginBottom: '1rem'
                                }}>
                                    Time Card Management
                                </h3>
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    marginBottom: '2rem'
                                }}>
                                    Track time, submit time-off requests, and manage work schedules
                                </p>
                                <div style={{
                                    background: 'rgba(212, 175, 55, 0.2)',
                                    border: '2px solid #d4af37',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1.5rem',
                                    color: '#f4e5a1',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    Enter
                                </div>
                            </div>

                            {/* Card 3: Secure Document Management */}
                            <div 
                                className="hover-lift animate-scale-in" 
                                onClick={() => {
                                    setCurrentPage('documentmanagement');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    padding: '3rem 2rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animationDelay: '0.2s'
                                }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                }}>
                                    📄
                                </div>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    marginBottom: '1rem'
                                }}>
                                    Secure Document Management
                                </h3>
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    marginBottom: '2rem'
                                }}>
                                    Access encrypted files, project documents, and compliance materials
                                </p>
                                <div style={{
                                    background: 'rgba(212, 175, 55, 0.2)',
                                    border: '2px solid #d4af37',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1.5rem',
                                    color: '#f4e5a1',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    Enter
                                </div>
                            </div>

                            {/* Card 4: Secure Tools & Applications */}
                            <div 
                                className="hover-lift animate-scale-in" 
                                onClick={() => {
                                    setCurrentPage('securetools');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    padding: '3rem 2rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animationDelay: '0.3s'
                                }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                }}>
                                    💻
                                </div>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    marginBottom: '1rem'
                                }}>
                                    Secure Tools & Applications
                                </h3>
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    marginBottom: '2rem'
                                }}>
                                    AWS Console, project management, code repositories, and communication tools
                                </p>
                                <div style={{
                                    background: 'rgba(212, 175, 55, 0.2)',
                                    border: '2px solid #d4af37',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1.5rem',
                                    color: '#f4e5a1',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    Enter
                                </div>
                            </div>

                            {/* Card 5: Internal Career Hub */}
                            <div 
                                className="hover-lift animate-scale-in" 
                                onClick={() => {
                                    setCurrentPage('careerhub');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    padding: '3rem 2rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '3px solid #d4af37',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animationDelay: '0.4s'
                                }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                }}>
                                    💼
                                </div>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    marginBottom: '1rem'
                                }}>
                                    Internal Career Hub
                                </h3>
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    marginBottom: '2rem'
                                }}>
                                    View internal job postings, career advancement opportunities, and referral programs
                                </p>
                                <div style={{
                                    background: 'rgba(212, 175, 55, 0.2)',
                                    border: '2px solid #d4af37',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1.5rem',
                                    color: '#f4e5a1',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    Enter
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* EMPLOYEE PROFILE & DIRECTORY PAGE */}
            {currentPage === 'employeeprofile' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                👥 Employee Profile & Directory
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Manage your profile, view team directory, and update contact information
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('secureportal');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Portal
                            </button>
                        </div>

                        {/* Profile Management Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* My Profile Card */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        👤
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        My Profile
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Update personal information
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Change profile photo
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Edit contact details
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Update emergency contacts
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setCurrentPage('myprofile');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}>
                                    Edit Profile
                                </button>
                            </div>

                            {/* Team Directory Card */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem',
                                        background: '#1e3a8a',
                                        color: 'white',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem'
                                    }}>
                                        HR
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Team Directory
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Search employee directory
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • View org chart
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Contact information
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Department listings
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setCurrentPage('teamdirectory');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}>
                                    Browse Directory
                                </button>
                            </div>

                            {/* Security Settings Card */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🔐
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Security Settings
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Change password
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Manage MFA devices
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • View login history
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Security clearance status
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setCurrentPage('securitysettings');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}>
                                    Manage Security
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* MY PROFILE EDIT PAGE */}
            {currentPage === 'myprofile' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                👤 My Profile
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Update your personal information and profile settings
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('employeeprofile');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Profile & Directory
                            </button>
                        </div>

                        {/* Profile Form */}
                        <div style={{
                            background: 'white',
                            padding: '3rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            {/* Profile Picture Section */}
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '3rem',
                                paddingBottom: '2rem',
                                borderBottom: '2px solid #e2e8f0'
                            }}>
                                <h3 style={{
                                    color: '#1e3a8a',
                                    fontSize: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    Profile Picture
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1.5rem'
                                }}>
                                    {/* Current Profile Picture */}
                                    <div style={{
                                        width: '150px',
                                        height: '150px',
                                        background: '#1e3a8a',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '3rem',
                                        border: '4px solid #d4af37',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}>
                                        👤
                                    </div>
                                    
                                    {/* Upload Button */}
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="profilePicUpload"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    alert('Profile picture upload functionality would be integrated here');
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="profilePicUpload"
                                            style={{
                                                background: '#d4af37',
                                                color: '#0f172a',
                                                padding: '0.75rem 2rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '700',
                                                display: 'inline-block',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }}>
                                            📷 Upload New Photo
                                        </label>
                                    </div>
                                    <p style={{
                                        color: '#64748b',
                                        fontSize: '0.9rem',
                                        margin: 0
                                    }}>
                                        Recommended: Square image, at least 400x400px
                                    </p>
                                </div>
                            </div>

                            {/* Personal Information Form */}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                alert('Profile update functionality would be integrated here');
                            }}>
                                <h3 style={{
                                    color: '#1e3a8a',
                                    fontSize: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    Personal Information
                                </h3>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    {/* First Name */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter first name"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter last name"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Job Title */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Job Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter job title"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter department"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Enter email"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Work Location
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter location"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>

                                    {/* Emergency Contact */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Emergency Contact
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="Enter emergency contact"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>
                                </div>

                                {/* Privacy Settings */}
                                <div style={{
                                    marginTop: '2rem',
                                    padding: '1.5rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '2px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        color: '#1e3a8a',
                                        fontSize: '1.2rem',
                                        marginBottom: '1rem'
                                    }}>
                                        🔒 Privacy Settings
                                    </h4>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        color: '#334155'
                                    }}>
                                        <input
                                            type="checkbox"
                                            defaultChecked={false}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '1rem',
                                                marginTop: '0.25rem',
                                                cursor: 'pointer',
                                                accentColor: '#1e3a8a'
                                            }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                                Add to Public Directory
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                                                When enabled, other employees can see your <strong>Name</strong> and <strong>Email</strong> in the team directory. 
                                                All other information remains private. Leave unchecked to keep your profile completely private.
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    justifyContent: 'center',
                                    marginTop: '2rem'
                                }}>
                                    <button
                                        type="submit"
                                        style={{
                                            background: '#1e3a8a',
                                            color: 'white',
                                            border: 'none',
                                            padding: '1rem 3rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(30, 58, 138, 0.3)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}>
                                        💾 Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentPage('employeeprofile');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{
                                            background: 'transparent',
                                            color: '#64748b',
                                            border: '2px solid #e2e8f0',
                                            padding: '1rem 3rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.borderColor = '#64748b';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.borderColor = '#e2e8f0';
                                        }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            {/* SECURITY SETTINGS PAGE */}
            {currentPage === 'securitysettings' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                🔐 Security Settings
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Manage your account security, passwords, and authentication settings
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('employeeprofile');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Profile & Directory
                            </button>
                        </div>

                        {/* Security Settings Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* Password Management */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🔑
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Password Management
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#f0fdf4',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        border: '1px solid #86efac'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>
                                            ✅ Password Strength: Strong
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                                            Last changed: 15 days ago
                                        </div>
                                    </div>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        • Minimum 12 characters required
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        • Must include uppercase, lowercase, numbers
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        • Special characters recommended
                                    </p>
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
                                    Change Password
                                </button>
                            </div>

                            {/* Multi-Factor Authentication */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📱
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Multi-Factor Authentication
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#f0fdf4',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        border: '1px solid #86efac'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>
                                            ✅ MFA Enabled
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                                            Primary device: iPhone (****1234)
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        marginBottom: '0.5rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '0.9rem' }}>
                                            📲 Authenticator App
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            Microsoft Authenticator - Active
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '0.9rem' }}>
                                            💬 SMS Backup
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            +1 (555) ***-1234 - Active
                                        </div>
                                    </div>
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
                                    Manage MFA Devices
                                </button>
                            </div>

                            {/* Login History */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📊
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Login History
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    {[
                                        { time: '2 hours ago', location: 'Leesburg, VA', device: 'Chrome on Windows', status: 'success' },
                                        { time: '1 day ago', location: 'Leesburg, VA', device: 'Safari on iPhone', status: 'success' },
                                        { time: '3 days ago', location: 'Washington, DC', device: 'Chrome on Windows', status: 'success' },
                                        { time: '1 week ago', location: 'Unknown Location', device: 'Firefox on Linux', status: 'failed' }
                                    ].map((login, index) => (
                                        <div key={index} style={{
                                            background: login.status === 'success' ? '#f0fdf4' : '#fef2f2',
                                            padding: '0.75rem',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem',
                                            border: `1px solid ${login.status === 'success' ? '#86efac' : '#fca5a5'}`
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                marginBottom: '0.25rem'
                                            }}>
                                                <div style={{ 
                                                    fontWeight: '600', 
                                                    color: login.status === 'success' ? '#15803d' : '#dc2626',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {login.status === 'success' ? '✅' : '❌'} {login.time}
                                                </div>
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.8rem', 
                                                color: login.status === 'success' ? '#166534' : '#991b1b'
                                            }}>
                                                📍 {login.location} • 💻 {login.device}
                                            </div>
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
                                    View Full History
                                </button>
                            </div>

                            {/* Security Status */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🛡️
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Security Status
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#f0fdf4',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        border: '1px solid #86efac'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>
                                            🟢 Security Score: 95/100
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                                            Excellent security posture
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            Security Checklist:
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            <div style={{ marginBottom: '0.25rem' }}>✅ Strong password enabled</div>
                                            <div style={{ marginBottom: '0.25rem' }}>✅ MFA configured</div>
                                            <div style={{ marginBottom: '0.25rem' }}>✅ Recent login activity normal</div>
                                            <div style={{ marginBottom: '0.25rem' }}>✅ Account recovery info updated</div>
                                            <div style={{ marginBottom: '0.25rem' }}>⚠️ Security training due in 30 days</div>
                                        </div>
                                    </div>
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
                                    Security Assessment
                                </button>
                            </div>
                        </div>

                        {/* Emergency Actions */}
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #ef4444',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ color: '#dc2626', marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
                                🚨 Emergency Security Actions
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem'
                            }}>
                                <button style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    🔒 Lock Account
                                </button>
                                <button style={{
                                    background: '#ea580c',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    📱 Revoke All Sessions
                                </button>
                                <button style={{
                                    background: '#7c2d12',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    🚨 Report Security Issue
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* HR DOCUMENTS PAGE */}
            {currentPage === 'hrdocuments' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {/* Navigation Breadcrumb */}
                        <div style={{
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                            fontSize: '0.9rem',
                            color: '#475569'
                        }}>
                            🏠 Home → 🔐 Secure Employee Portal → 📁 Document Management → <strong style={{ color: '#1e3a8a' }}>📋 HR Documents</strong>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                📋 HR Documents
                            </h2>
                            
                            {/* Role Switcher for Demo */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                padding: '1rem',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                border: '2px solid #d4af37'
                            }}>
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                                    👤 Current Role: <span style={{ color: '#1e3a8a', fontWeight: '700' }}>{userRole.toUpperCase()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => switchRole('employee')}
                                        style={{
                                            background: userRole === 'employee' ? '#1e3a8a' : 'transparent',
                                            color: userRole === 'employee' ? 'white' : '#1e3a8a',
                                            border: '2px solid #1e3a8a',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                        👨‍💼 Employee
                                    </button>
                                    <button
                                        onClick={() => switchRole('hr')}
                                        style={{
                                            background: userRole === 'hr' ? '#d4af37' : 'transparent',
                                            color: userRole === 'hr' ? '#0f172a' : '#d4af37',
                                            border: '2px solid #d4af37',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                        👩‍💼 HR Manager
                                    </button>
                                    <button
                                        onClick={() => switchRole('admin')}
                                        style={{
                                            background: userRole === 'admin' ? '#ef4444' : 'transparent',
                                            color: userRole === 'admin' ? 'white' : '#ef4444',
                                            border: '2px solid #ef4444',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                        🔧 Admin
                                    </button>
                                </div>
                            </div>
                            
                            {/* Permission Testing Instructions */}
                            <div style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                border: '2px solid #f59e0b',
                                borderRadius: '12px',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#92400e', marginBottom: '0.5rem' }}>
                                    🧪 Test Permission System:
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: '1.5' }}>
                                    <strong>1.</strong> Use the role switcher above to switch between Employee/HR/Admin<br/>
                                    <strong>2.</strong> Switch to <strong>HR/Admin</strong> role and upload files to Employee Handbook<br/>
                                    <strong>3.</strong> Switch to <strong>Employee</strong> role and try to delete files (click 🔒 button)<br/>
                                    <strong>4.</strong> Click "� View Document" to see the document viewer
                                </div>
                            </div>
                            
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Access employee handbook, benefits information, and important HR forms
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('documentmanagement');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Document Management
                            </button>
                        </div>

                        {/* HR Documents Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem'
                        }}>
                            {/* Employee Handbook 2026 */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        marginRight: '1rem'
                                    }}>
                                        BOOK
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>
                                            Employee Handbook 2026
                                        </h3>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem',
                                            marginTop: '0.5rem'
                                        }}>
                                            <span style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                PDF
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                1.8 MB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        Complete guide to company policies, procedures, code of conduct, 
                                        and workplace guidelines. Updated for 2026 with new remote work policies 
                                        and security protocols.
                                    </p>
                                </div>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        <div style={{ marginBottom: '0.25rem' }}>📅 Last Updated: January 1, 2026</div>
                                        <div style={{ marginBottom: '0.25rem' }}>👤 Version: 3.2</div>
                                        <div>🔒 Classification: Internal Use</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleViewDocument('Employee Handbook 2026')}
                                        style={{
                                            background: '#1e3a8a',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            flex: 1
                                        }}>
                                        📄 View Document
                                    </button>
                                    {canUploadHandbook() ? (
                                        <label style={{
                                            background: '#d4af37',
                                            color: '#0f172a',
                                            border: 'none',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = '#b8941f';
                                            e.target.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = '#d4af37';
                                            e.target.style.transform = 'translateY(0)';
                                        }}>
                                            📤 Upload
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.doc,.docx,.txt"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleFileUpload('employeeHandbook', e.target.files)}
                                            />
                                        </label>
                                    ) : (
                                        <div style={{
                                            background: '#f3f4f6',
                                            color: '#6b7280',
                                            border: '2px solid #e5e7eb',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '6px',
                                            fontSize: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            🔒 HR Only
                                        </div>
                                    )}
                                </div>
                                
                                {/* Display uploaded files */}
                                {uploadedFiles.employeeHandbook.length > 0 && (
                                    <div style={{
                                        background: '#f0f9ff',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #bae6fd',
                                        marginTop: '1rem'
                                    }}>
                                        <h4 style={{ 
                                            color: '#0369a1', 
                                            margin: '0 0 0.75rem 0', 
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}>
                                            📁 Uploaded Files ({uploadedFiles.employeeHandbook.length})
                                        </h4>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {uploadedFiles.employeeHandbook.map((file) => {
                                                const badge = getFileTypeBadge(file.name);
                                                return (
                                                    <div key={file.id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.75rem',
                                                        background: 'white',
                                                        borderRadius: '6px',
                                                        marginBottom: '0.5rem',
                                                        border: '1px solid #e2e8f0',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                            <span style={{
                                                                background: badge.color,
                                                                color: 'white',
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: '600',
                                                                marginRight: '0.75rem'
                                                            }}>
                                                                {badge.label}
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ 
                                                                    fontSize: '0.9rem', 
                                                                    fontWeight: '500',
                                                                    color: '#374151',
                                                                    marginBottom: '0.25rem'
                                                                }}>
                                                                    {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                                                                </div>
                                                                <div style={{ 
                                                                    fontSize: '0.75rem', 
                                                                    color: '#6b7280'
                                                                }}>
                                                                    {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()} • by {file.uploadedBy}
                                                                    <br/>
                                                                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                                                        Type: {file.type || 'unknown'} | Ext: {file.name.split('.').pop().toLowerCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <button
                                                                onClick={() => handleViewDocument(file.name, file)}
                                                                style={{
                                                                    background: '#1e3a8a',
                                                                    border: 'none',
                                                                    color: 'white',
                                                                    cursor: 'pointer',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: '600'
                                                                }}
                                                                title="View document content"
                                                            >
                                                                👁️
                                                            </button>
                                                            {canDeleteHandbook() ? (
                                                                <button
                                                                    onClick={() => handleFileDelete('employeeHandbook', file.id, file.name)}
                                                                    style={{
                                                                        background: '#ef4444',
                                                                        border: 'none',
                                                                        color: 'white',
                                                                        cursor: 'pointer',
                                                                        padding: '0.5rem',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: '600'
                                                                    }}
                                                                    title="Delete file (HR/Admin only)"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            ) : (
                                                                <div 
                                                                    onClick={() => handleFileDelete('employeeHandbook', file.id, file.name)}
                                                                    style={{
                                                                        background: '#f3f4f6',
                                                                        border: '2px solid #e5e7eb',
                                                                        color: '#9ca3af',
                                                                        cursor: 'not-allowed',
                                                                        padding: '0.5rem',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                    title="Click to test permission denial"
                                                                >
                                                                    🔒
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* File Type Support Info */}
                                        <div style={{
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            borderRadius: '6px',
                                            padding: '0.75rem',
                                            marginTop: '0.75rem'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                📄 File Viewing Support:
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                                                • <strong>TXT files:</strong> Full content displayed in viewer<br/>
                                                • <strong>PDF files:</strong> Embedded PDF viewer<br/>
                                                • <strong>Word docs (.docx/.doc):</strong> Download to view (browser limitation)<br/>
                                                • <strong>Other files:</strong> Download option provided
                                            </div>
                                        </div>
                                        
                                        {/* Permission Test Instructions */}
                                        <div style={{
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            borderRadius: '6px',
                                            padding: '0.75rem',
                                            marginTop: '0.75rem'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                🧪 Test Permissions:
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#3730a3' }}>
                                                • Switch to <strong>Employee</strong> role and try to delete files (🔒 button)
                                                <br />
                                                • Switch to <strong>HR/Admin</strong> role to see delete button (🗑️)
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Benefits Overview 2026 */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '3rem',
                                        marginRight: '1rem'
                                    }}>
                                        🏥
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>
                                            Benefits Overview 2026
                                        </h3>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem',
                                            marginTop: '0.5rem'
                                        }}>
                                            <span style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                PDF
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                2.1 MB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        Comprehensive overview of health insurance, retirement plans, 
                                        paid time off, professional development opportunities, and all 
                                        employee benefits for 2026.
                                    </p>
                                </div>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        <div style={{ marginBottom: '0.25rem' }}>📅 Last Updated: December 15, 2025</div>
                                        <div style={{ marginBottom: '0.25rem' }}>👤 Version: 2026.1</div>
                                        <div>🔒 Classification: Internal Use</div>
                                    </div>
                                </div>
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    width: '100%',
                                    fontSize: '1rem'
                                }}>
                                    📄 View Document
                                </button>
                            </div>

                            {/* Annual Review Survey */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        marginRight: '1rem'
                                    }}>
                                        FORM
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>
                                            Annual Review Survey
                                        </h3>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem',
                                            marginTop: '0.5rem'
                                        }}>
                                            <span style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                PDF
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                0.9 MB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        Annual performance review form and self-assessment survey. 
                                        Complete and submit before your scheduled review meeting 
                                        with your manager.
                                    </p>
                                </div>
                                <div style={{
                                    background: '#fef3c7',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    border: '1px solid #f59e0b'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                        <div style={{ marginBottom: '0.25rem' }}>⚠️ Due Date: March 15, 2026</div>
                                        <div style={{ marginBottom: '0.25rem' }}>📅 Review Period: 2025</div>
                                        <div>🔒 Classification: Confidential</div>
                                    </div>
                                </div>
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    width: '100%',
                                    fontSize: '1rem'
                                }}>
                                    📄 View Document
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* TEAM DIRECTORY PAGE */}
            {currentPage === 'teamdirectory' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                📋 Team Directory
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 1rem auto'
                            }}>
                                Search and connect with team members across the organization
                            </p>
                            <div style={{
                                background: '#f0f9ff',
                                border: '2px solid #0ea5e9',
                                borderRadius: '8px',
                                padding: '1rem',
                                margin: '0 auto 1rem auto',
                                maxWidth: '600px'
                            }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    color: '#0369a1'
                                }}>
                                    ℹ️ <strong>{isHRView ? 'HR View:' : 'Employee View:'}</strong> {isHRView ? 'Full directory access with all employee information.' : 'You can see Name, Title, and Email only. HR team members have access to full directory information.'}
                                </p>
                            </div>
                            
                            {/* Development HR View Toggle */}
                            <div style={{ marginBottom: '1rem' }}>
                                <button 
                                    onClick={() => setIsHRView(!isHRView)}
                                    style={{
                                        background: isHRView ? '#10b981' : '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '0.9rem',
                                        marginBottom: '0.5rem'
                                    }}>
                                    🚧 {isHRView ? 'Switch to Employee View' : 'Switch to HR View'} (Development)
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    setCurrentPage('employeeprofile');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Profile & Directory
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div style={{ marginBottom: '2rem' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search by name, department, or role..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    border: '2px solid #d4af37',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Employee Cards Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: '2rem'
                        }}>
                            {/* John Doe Card - Conditional View Based on HR Access */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        marginBottom: isHRView ? '1rem' : '0'
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
                                                {isHRView && (
                                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Employee ID: EMP-2024-001</div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            <div style={{ marginBottom: '0.5rem' }}>📧 john.doe@navontech.com</div>
                                            {isHRView && (
                                                <>
                                                    <div style={{ marginBottom: '0.5rem' }}>📱 +1 (555) 123-4567</div>
                                                    <div style={{ marginBottom: '0.5rem' }}>🏢 Remote - DC Metro Area</div>
                                                    <div style={{ marginBottom: '0.5rem' }}>📅 Start Date: January 15, 2024</div>
                                                    <div style={{ marginBottom: '0.5rem' }}>💰 Salary: $95,000</div>
                                                    <div style={{ marginBottom: '0.5rem' }}>👤 Manager: Sarah Johnson</div>
                                                    <div>🚨 Emergency Contact: Jane Doe - (555) 987-6543</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isHRView && (
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* TIME CARD MANAGEMENT PAGE */}
            {currentPage === 'timecardmanagement' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                ⏰ Time Card Management
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Track time, submit time-off requests, and manage work schedules
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('secureportal');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Portal
                            </button>
                        </div>

                        {/* Time Management Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* Time Tracking System */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        ⏱️
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Time Tracking System
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Clock in/out functionality
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Project time allocation
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Weekly timesheet review
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Overtime tracking
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Billable hours reporting
                                    </p>
                                </div>
                                <div style={{
                                    background: '#f0fdf4',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    border: '1px solid #86efac'
                                }}>
                                    <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>
                                        ✅ Status: Active
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                                        Currently clocked in - Project: AWS Migration
                                    </div>
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
                                    Access Time Tracker
                                </button>
                            </div>

                            {/* Time-Off Requests */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🏖️
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Time-Off Requests
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                                            Vacation Request - March 15-19
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Status: Pending Approval • 5 days
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                                            Sick Leave - January 8
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                                            Status: Approved • 1 day
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: '#e0f2fe',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    border: '1px solid #7dd3fc'
                                }}>
                                    <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
                                        📊 Available Balance
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
                                        Vacation: 18 days • Sick: 12 days • Personal: 3 days<br />
                                        Bereavement: 5 days • Leave without Pay: Available
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowTimeOffModal(true)}
                                    style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    width: '100%'
                                }}>
                                    Submit New Request
                                </button>
                            </div>

                            {/* Schedule Management */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📅
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Schedule Management
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • View work schedule
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Request schedule changes
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Team calendar view
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Meeting scheduling
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Holiday calendar
                                    </p>
                                </div>
                                <div style={{
                                    background: '#fef3c7',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    border: '1px solid #fbbf24'
                                }}>
                                    <div style={{ fontWeight: '600', color: '#d97706', marginBottom: '0.5rem' }}>
                                        📋 This Week's Schedule
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                                        Mon-Fri: 8:00 AM - 5:00 PM • 40 hours scheduled
                                    </div>
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
                                    View Full Calendar
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions Section */}
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
                                ⚡ Quick Actions
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                <button style={{
                                    background: '#15803d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    🟢 Clock In
                                </button>
                                <button style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    🔴 Clock Out
                                </button>
                                <button style={{
                                    background: '#d97706',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    ⏸️ Break Time
                                </button>
                                <button style={{
                                    background: '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}>
                                    📊 View Reports
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* SECURE DOCUMENT MANAGEMENT PAGE */}
            {currentPage === 'documentmanagement' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                📁 Secure Document Management
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Access encrypted files, project documents, and compliance materials
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('secureportal');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Portal
                            </button>
                        </div>

                        {/* Document Categories Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* HR Documents */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        marginRight: '1rem'
                                    }}>
                                        HR
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        HR Documents
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Employee handbook
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Benefits information
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Annual review survey
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setCurrentPage('hrdocuments');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}>
                                    Access HR Files
                                </button>
                            </div>

                            {/* Compliance & Security */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🛡️
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Compliance & Security
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Security policies
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Compliance certificates
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Audit reports
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Training materials
                                    </p>
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
                                    View Compliance
                                </button>
                            </div>

                            {/* Project Documents */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📄
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Project Documents
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Active project files
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Technical specifications
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Design documents
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Meeting notes & minutes
                                    </p>
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
                                    Browse Projects
                                </button>
                            </div>

                            {/* Shared Resources */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🗂️
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Shared Resources
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Templates & forms
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Company presentations
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Marketing materials
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Knowledge base articles
                                    </p>
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
                                    Browse Resources
                                </button>
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.5rem' }}>
                                📤 Upload Documents
                            </h3>
                            <div style={{
                                background: '#fef2f2',
                                border: '2px solid #ef4444',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <p style={{ 
                                    color: '#dc2626', 
                                    margin: 0, 
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                    🚫 Authorized Personnel Only
                                </p>
                            </div>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                All uploads are encrypted and scanned for security compliance
                            </p>
                            <button style={{
                                background: '#d4af37',
                                color: '#0f172a',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '1rem'
                            }}>
                                Select Files to Upload
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* SECURE TOOLS & APPLICATIONS PAGE */}
            {currentPage === 'securetools' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                🛠️ Secure Tools & Applications
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                AWS Console, project management, code repositories, and communication tools
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('secureportal');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Portal
                            </button>
                        </div>

                        {/* Tools Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {[
                                { icon: '☁️', name: 'AWS Console Access', desc: 'Manage cloud infrastructure', status: 'Active' },
                                { icon: '📊', name: 'Project Management Suite', desc: 'Track tasks and milestones', status: 'Active' },
                                { icon: '💻', name: 'Secure Code Repository', desc: 'Git version control', status: 'Active' },
                                { icon: '💬', name: 'Encrypted Communications', desc: 'Secure messaging platform', status: 'Active' },
                                { icon: '📧', name: 'Email System', desc: 'Corporate email access', status: 'Active' },
                                { icon: '🔍', name: 'Security Compliance Dashboard', desc: 'Monitor compliance status', status: 'Active' },
                                { icon: '�', name: 'Documentation Wiki', desc: 'Internal knowledge base', status: 'Active' },
                                { icon: '🎯', name: 'Task Automation', desc: 'Workflow automation tools', status: 'Active' },
                                { icon: '📈', name: 'Analytics Platform', desc: 'Business intelligence tools', status: 'Active' },
                                { icon: '�', name: 'VPN Access', desc: 'Secure network connection', status: 'Active' },
                                { icon: '�️', name: 'Database Tools', desc: 'Query and manage databases', status: 'Active' }
                            ].map((tool, index) => (
                                <div key={index} className="hover-lift animate-scale-in" style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    animationDelay: `${index * 0.05}s`,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{
                                            fontSize: '2.5rem'
                                        }}>
                                            {tool.icon}
                                        </div>
                                        <span style={{
                                            background: '#10b981',
                                            color: 'white',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {tool.status}
                                        </span>
                                    </div>
                                    <h3 style={{
                                        color: '#1e3a8a',
                                        fontSize: '1.2rem',
                                        fontWeight: '700',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {tool.name}
                                    </h3>
                                    <p style={{
                                        color: '#64748b',
                                        fontSize: '0.9rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {tool.desc}
                                    </p>
                                    <button style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%',
                                        fontSize: '0.9rem'
                                    }}>
                                        Launch Tool
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* INTERNAL CAREER HUB PAGE */}
            {currentPage === 'careerhub' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                💼 Internal Career Hub
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                View internal job postings, career advancement opportunities, and referral programs
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('secureportal');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Portal
                            </button>
                        </div>

                        {/* Career Options Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* Internal Job Postings */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📢
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Internal Job Postings
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                                            Senior Cloud Architect
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Engineering • Herndon, VA • Posted 2 days ago
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                                            Project Manager
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Operations • Greenbelt, MD • Posted 5 days ago
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                                            Security Analyst
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Security • Reston, VA • Posted 1 week ago
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setCurrentPage('jobpostings');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    width: '100%'
                                }}>
                                    View All Openings
                                </button>
                            </div>

                            {/* Career Development */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        📚
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Career Development
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Training programs
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Certification support
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Mentorship opportunities
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Leadership programs
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Skills assessments
                                    </p>
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
                                    Explore Programs
                                </button>
                            </div>

                            {/* Employee Referrals */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginRight: '1rem'
                                    }}>
                                        🤝
                                    </div>
                                    <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Employee Referrals
                                    </h3>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{
                                        background: '#f0fdf4',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        border: '1px solid #86efac'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>
                                            💰 Referral Bonus Program
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                                            Earn up to $5,000 for successful referrals
                                        </div>
                                    </div>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Submit candidate referrals
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • Track referral status
                                    </p>
                                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                                        • View bonus eligibility
                                    </p>
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
                                    Refer a Candidate
                                </button>
                            </div>
                        </div>

                        {/* Performance & Growth Section */}
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
                                📊 Performance & Growth Tracking
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                                    <div style={{ fontWeight: '600', color: '#1e3a8a' }}>Goal Setting</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Set & track objectives</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                                    <div style={{ fontWeight: '600', color: '#1e3a8a' }}>Performance Reviews</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Annual evaluations</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                                    <div style={{ fontWeight: '600', color: '#1e3a8a' }}>Achievements</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Recognition & awards</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                                    <div style={{ fontWeight: '600', color: '#1e3a8a' }}>Feedback</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>360° reviews</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* DETAILED JOB POSTINGS PAGE */}
            {currentPage === 'jobpostings' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: '#f1f5f9',
                    minHeight: '100vh'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                                color: '#1e3a8a',
                                fontWeight: '800'
                            }}>
                                📢 Current Job Openings
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#475569',
                                maxWidth: '800px',
                                margin: '0 auto 2rem auto'
                            }}>
                                Explore detailed information about available positions at Navon Technologies
                            </p>
                            <button 
                                onClick={() => {
                                    setCurrentPage('careerhub');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#d4af37',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}>
                                ← Back to Career Hub
                            </button>
                        </div>

                        {/* Job Listings */}
                        <div style={{
                            display: 'grid',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {/* Senior Cloud Architect */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2.5rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700' }}>
                                            Senior Cloud Architect
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Engineering
                                            </span>
                                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                📍 Herndon, VA
                                            </span>
                                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Full-time
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>
                                            To Be Determined
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Salary Range
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                                        Lead the design and implementation of scalable cloud infrastructure solutions. Work with cutting-edge AWS services to architect enterprise-level systems for government and commercial clients.
                                    </p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                🔒 Clearance Required
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Secret Security Clearance
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                📅 Posted
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                January 13, 2026
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                ⏰ Application Deadline
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                                                February 15, 2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}>
                                    Apply Now
                                </button>
                            </div>

                            {/* Project Manager */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2.5rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.1s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700' }}>
                                            Project Manager
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Operations
                                            </span>
                                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                📍 Greenbelt, MD
                                            </span>
                                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Full-time
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>
                                            To Be Determined
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Salary Range
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                                        Coordinate complex technology projects from initiation to completion. Manage cross-functional teams and ensure deliverables meet client requirements and government compliance standards.
                                    </p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                🔒 Clearance Required
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Public Trust
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                📅 Posted
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                January 10, 2026
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                ⏰ Application Deadline
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                                                February 10, 2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}>
                                    Apply Now
                                </button>
                            </div>

                            {/* Security Analyst */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2.5rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700' }}>
                                            Security Analyst
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Security
                                            </span>
                                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                📍 Reston, VA
                                            </span>
                                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Full-time
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>
                                            To Be Determined
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Salary Range
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                                        Monitor and analyze security threats, implement security protocols, and ensure compliance with federal security standards. Work with advanced security tools and incident response procedures.
                                    </p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                🔒 Clearance Required
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Secret Security Clearance
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                📅 Posted
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                January 8, 2026
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                ⏰ Application Deadline
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                                                February 8, 2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}>
                                    Apply Now
                                </button>
                            </div>

                            {/* DevOps Engineer */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2.5rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.3s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700' }}>
                                            DevOps Engineer
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Engineering
                                            </span>
                                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                📍 Greenbelt, MD
                                            </span>
                                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Full-time
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>
                                            To Be Determined
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Salary Range
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                                        Build and maintain CI/CD pipelines, automate infrastructure deployment, and optimize cloud operations. Work with containerization, orchestration, and infrastructure as code.
                                    </p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                🔒 Clearance Required
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Public Trust
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                📅 Posted
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                January 12, 2026
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                ⏰ Application Deadline
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                                                February 20, 2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}>
                                    Apply Now
                                </button>
                            </div>

                            {/* Network Engineer */}
                            <div className="hover-lift animate-scale-in" style={{
                                background: 'white',
                                padding: '2.5rem',
                                borderRadius: '12px',
                                border: '2px solid #d4af37',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animationDelay: '0.4s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700' }}>
                                            Network Engineer
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Infrastructure
                                            </span>
                                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                📍 Reston, VA
                                            </span>
                                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                Full-time
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>
                                            To Be Determined
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Salary Range
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                                        Design, implement, and maintain enterprise network infrastructure. Configure routers, switches, firewalls, and ensure optimal network performance for government and commercial clients.
                                    </p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                🔒 Clearance Required
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Secret Security Clearance
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                📅 Posted
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                January 11, 2026
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                                ⏰ Application Deadline
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                                                February 18, 2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}>
                                    Apply Now
                                </button>
                            </div>
                        </div>

                        {/* Application Instructions */}
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #d4af37',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.5rem' }}>
                                📋 How to Apply
                            </h3>
                            <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Ready to join our team? Send your resume and cover letter to our HR department. 
                                All positions require U.S. citizenship and the ability to obtain or maintain security clearance.
                            </p>
                            <button 
                                onClick={() => {
                                    window.location.href = 'mailto:careers@navontech.com?subject=Job%20Application%20-%20Position%20Title';
                                }}
                                style={{
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1.1rem'
                                }}>
                                📧 Email Your Application
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* COGNITO LOGIN PAGE */}
            {currentPage === 'login' && (
                <section style={{ 
                    padding: '4rem 2rem', 
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="animate-scale-in" style={{ 
                        maxWidth: '450px', 
                        width: '100%',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                            padding: '2rem',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '3rem',
                                marginBottom: '0.5rem'
                            }}>
                                🔐
                            </div>
                            <h2 style={{
                                color: 'white',
                                fontSize: '1.8rem',
                                fontWeight: '700',
                                margin: '0 0 0.5rem 0'
                            }}>
                                Employee Portal
                            </h2>
                            <p style={{
                                color: '#cbd5e1',
                                fontSize: '0.95rem',
                                margin: 0
                            }}>
                                Secure Sign In
                            </p>
                        </div>

                        {/* Login Form */}
                        <div style={{ padding: '2.5rem' }}>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                // Placeholder - would integrate with AWS Cognito
                                alert('AWS Cognito authentication would be integrated here');
                            }}>
                                {/* Username Field */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: '#334155',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Username or Email
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your username"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>

                                {/* Password Field */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: '#334155',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>

                                {/* Forgot Password Link */}
                                <div style={{ 
                                    textAlign: 'right', 
                                    marginBottom: '1.5rem' 
                                }}>
                                    <a href="#" style={{
                                        color: '#1e3a8a',
                                        fontSize: '0.9rem',
                                        textDecoration: 'none',
                                        fontWeight: '600'
                                    }}
                                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                                        Forgot password?
                                    </a>
                                </div>

                                {/* Sign In Button */}
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        marginBottom: '1rem'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 10px 20px rgba(30, 58, 138, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}>
                                    Sign In
                                </button>

                                {/* Temporary Bypass Button - Remove when Cognito is ready */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentPage('secureportal');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        width: '100%',
                                        background: '#d4af37',
                                        color: '#0f172a',
                                        border: 'none',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        marginBottom: '1rem'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 10px 20px rgba(212, 175, 55, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}>
                                    🚧 Bypass Login (Development Only)
                                </button>

                                {/* MFA Notice */}
                                <div style={{
                                    background: '#f1f5f9',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        color: '#64748b',
                                        textAlign: 'center'
                                    }}>
                                        🔒 Multi-factor authentication required
                                    </p>
                                </div>

                                {/* Divider */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    margin: '1.5rem 0',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        flex: 1,
                                        height: '1px',
                                        background: '#e2e8f0'
                                    }}></div>
                                    <span style={{
                                        color: '#94a3b8',
                                        fontSize: '0.85rem'
                                    }}>
                                        OR
                                    </span>
                                    <div style={{
                                        flex: 1,
                                        height: '1px',
                                        background: '#e2e8f0'
                                    }}></div>
                                </div>

                                {/* Request Access Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.location.href = 'mailto:rachelle.briscoe@navontech.com?subject=I%20need%20Employee%20Portal%20Access%20Credentials%20and%20Permissions';
                                    }}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        color: '#1e3a8a',
                                        border: '2px solid #1e3a8a',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#1e3a8a';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = '#1e3a8a';
                                    }}>
                                    Request Access
                                </button>
                            </form>

                            {/* Back to Home */}
                            <div style={{ 
                                textAlign: 'center', 
                                marginTop: '1.5rem',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid #e2e8f0'
                            }}>
                                <button
                                    onClick={() => {
                                        setCurrentPage('home');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#64748b',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}>
                                    ← Back to Home
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            background: '#f8fafc',
                            padding: '1rem',
                            textAlign: 'center',
                            borderTop: '1px solid #e2e8f0'
                        }}>
                            <p style={{
                                margin: 0,
                                fontSize: '0.8rem',
                                color: '#94a3b8'
                            }}>
                                🛡️ Powered by AWS Cognito | Secure by Design
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer style={{
                padding: '3rem 2rem 1.5rem 2rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Gold accent line at top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)'
                }}></div>
                
                <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '2rem',
                        marginBottom: '2rem',
                        paddingBottom: '2rem',
                        borderBottom: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                        <div>
                            <h4 style={{ 
                                margin: '0 0 0.75rem 0', 
                                fontSize: '1.3rem', 
                                color: '#d4af37',
                                fontWeight: '700',
                                textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                            }}>
                                Navon Technologies
                            </h4>
                            <div style={{ 
                                margin: '0 0 1rem 0', 
                                fontSize: '0.95rem', 
                                fontStyle: 'italic', 
                                color: '#cbd5e1',
                                lineHeight: '1.5'
                            }}>
                                <div>A wiser technology solutions,</div>
                                <div>we take technology higher!</div>
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ 
                                margin: '0 0 0.75rem 0', 
                                fontSize: '1.1rem', 
                                color: '#d4af37',
                                fontWeight: '600',
                                textShadow: '0 0 8px rgba(212, 175, 55, 0.3)'
                            }}>
                                Contact Us
                            </h4>
                            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                                161 Fort Evans Rd NE Suite 210, Leesburg, VA 20176
                            </p>
                            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                Phone: 571-477-2727 | Fax: 571-477-2727
                            </p>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                            <h4 style={{ 
                                margin: '0 0 0.75rem 0', 
                                fontSize: '1.1rem', 
                                color: '#d4af37',
                                fontWeight: '600',
                                textShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '0.75rem'
                            }}>
                                <a 
                                    href="#portal"
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    style={{
                                        fontSize: '1.8rem',
                                        color: '#d4af37',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                        transition: 'all 0.4s ease',
                                        filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))',
                                        cursor: 'pointer'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = 'rotate(45deg) scale(1.2)';
                                        e.target.style.filter = 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.9))';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = 'rotate(0deg) scale(1)';
                                        e.target.style.filter = 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))';
                                    }}
                                    title="Secure Portal"
                                >
                                </a>
                                Compliance & Trust
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <a href="#accessibility" style={{
                                    color: '#cbd5e1',
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.color = '#d4af37'}
                                onMouseOut={(e) => e.target.style.color = '#cbd5e1'}>
                                    Accessibility Statement
                                </a>
                                <a href="#secureportal"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Only open if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
                                    if (e.ctrlKey || e.metaKey) {
                                        setShowSecureModal(true);
                                    }
                                }}
                                style={{
                                    color: '#cbd5e1',
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.color = '#d4af37';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.color = '#cbd5e1';
                                }}
                                title="Ctrl+Click (or Cmd+Click) to access">
                                    <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                                    Security & Compliance
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        textAlign: 'center', 
                        paddingTop: '1rem'
                    }}>
                        <p style={{ 
                            margin: 0, 
                            fontSize: '0.85rem', 
                            color: '#94a3b8'
                        }}>
                            Copyright © 2021 Navon Technologies - All Rights Reserved | <span style={{ color: '#d4af37' }}>Secure by Design</span> | Built with AWS
                        </p>
                    </div>
                </div>
            </footer>
            
            {/* Secure Access Modal */}
            {showSecureModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '2rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={() => setShowSecureModal(false)}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                        color: 'white',
                        padding: '3rem',
                        borderRadius: '20px',
                        textAlign: 'center',
                        maxWidth: '600px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        position: 'relative',
                        animation: 'scaleIn 0.3s ease-out',
                        border: '3px solid #d4af37'
                    }}
                    onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            onClick={() => setShowSecureModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.5rem',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                                e.target.style.transform = 'rotate(90deg)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.target.style.transform = 'rotate(0deg)';
                            }}>
                            ×
                        </button>
                        
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: '800' }}>
                            🔐 Secure Access Required
                        </h3>
                        <p style={{ marginBottom: '2rem', opacity: '0.95', fontSize: '1.1rem', lineHeight: '1.7' }}>
                            Access to the employee portal requires multi-factor authentication and valid security clearance.
                            All activities are logged and monitored for compliance.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => {
                                    setShowSecureModal(false);
                                    setCurrentPage('login');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'white',
                                    color: '#1e3a8a',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 10px 20px rgba(255, 255, 255, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}>
                                Employee Login
                            </button>
                            <button 
                                onClick={() => {
                                    setShowSecureModal(false);
                                    window.location.href = 'mailto:rachelle.briscoe@navontech.com?subject=I%20need%20Employee%20Portal%20Access%20Credentials%20and%20Permissions';
                                }}
                                style={{
                                    background: 'transparent',
                                    color: 'white',
                                    border: '2px solid white',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.transform = 'translateY(0)';
                                }}>
                                Request Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Time-Off Request Modal */}
            {showTimeOffModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'scaleIn 0.3s ease',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        {/* Close Button */}
                        <button 
                            onClick={() => setShowTimeOffModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.target.style.transform = 'rotate(90deg)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.target.style.transform = 'rotate(0deg)';
                            }}>
                            ×
                        </button>
                        
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '700', color: '#1e3a8a' }}>
                            🏖️ Time-Off Request
                        </h3>
                        
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            
                            // Get form data
                            const formData = new FormData(e.target);
                            const requestData = {
                                leaveType: formData.get('leaveType'),
                                startDate: formData.get('startDate'),
                                endDate: formData.get('endDate'),
                                hours: formData.get('hours'),
                                comments: formData.get('comments') || 'None',
                                submittedAt: new Date().toISOString()
                            };
                            
                            try {
                                // Send to AWS Lambda function via API Gateway
                                const response = await fetch('https://h5dfq5i2fe.execute-api.us-east-1.amazonaws.com/prod/api/submit-time-off-request', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestData)
                                });
                                
                                if (response.ok) {
                                    alert('Time-off request submitted successfully! HR has been notified via email.');
                                    setShowTimeOffModal(false);
                                } else {
                                    throw new Error('Failed to submit request');
                                }
                            } catch (error) {
                                console.error('Error submitting time-off request:', error);
                                
                                // Fallback to mailto if API fails
                                const subject = `Time-Off Request - ${requestData.leaveType}`;
                                const body = `
Time-Off Request Details:

Employee: (Name will be identified from email sender)
Leave Type: ${requestData.leaveType}
Start Date: ${requestData.startDate}
End Date: ${requestData.endDate}
Total Hours: ${requestData.hours}
Comments: ${requestData.comments}

Submitted on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

Please review and approve this request.
                                `.trim();
                                
                                window.location.href = `mailto:rachelle.briscoe@navontech.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                alert('API unavailable. Opening email client as fallback.');
                            }
                        }}>
                            {/* Leave Type Dropdown */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    Leave Type *
                                </label>
                                <select
                                    name="leaveType"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease',
                                        outline: 'none',
                                        background: 'white'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                >
                                    <option value="">Select leave type...</option>
                                    <option value="vacation">Vacation</option>
                                    <option value="personal">Personal</option>
                                    <option value="sick">Sick</option>
                                    <option value="bereavement">Bereavement</option>
                                    <option value="leave-without-pay">Leave without Pay</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    Start Date *
                                </label>
                                <input
                                    name="startDate"
                                    type="date"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {/* End Date */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    End Date *
                                </label>
                                <input
                                    name="endDate"
                                    type="date"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {/* Hours */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    Total Hours *
                                </label>
                                <input
                                    name="hours"
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    max="40"
                                    required
                                    placeholder="e.g., 8 or 40"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {/* Comments */}
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    Comments (Optional)
                                </label>
                                <textarea
                                    name="comments"
                                    rows="3"
                                    placeholder="Additional details or reason for request..."
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button"
                                    onClick={() => setShowTimeOffModal(false)}
                                    style={{
                                        background: 'transparent',
                                        color: '#6b7280',
                                        border: '2px solid #e5e7eb',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#f9fafb';
                                        e.target.style.borderColor = '#d1d5db';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.borderColor = '#e5e7eb';
                                    }}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    style={{
                                        background: '#1e3a8a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#1e40af';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = '#1e3a8a';
                                        e.target.style.transform = 'translateY(0)';
                                    }}>
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

export default SimpleApp;