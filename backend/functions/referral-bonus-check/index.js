const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

const TABLE_NAME = 'ResumeMetadata';
const NOTIFY_EMAILS = ['hr@navontech.com', 'security@navontech.com'];

exports.handler = async (event) => {
    console.log('Running daily referral bonus check...');
    
    try {
        // Monthly reminder on 1st of each month
        const today = new Date();
        if (today.getDate() === 1) {
            console.log('First of month — sending monthly review reminder to Brian');
            await sesClient.send(new SendEmailCommand({
                Source: 'noreply@navontech.com',
                Destination: { ToAddresses: ['brian.briscoe@navontech.com'] },
                Message: {
                    Subject: { Data: '📋 Monthly Reminder: Review Archived Resumes & ATS' },
                    Body: { Html: { Data: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1><p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">MONTHLY REMINDER</p></div><div style="background:#d4af37;height:4px;"></div><div style="padding:30px;background:#f8fafc;border-radius:0 0 12px 12px;border:2px solid #e2e8f0;border-top:none;"><h2 style="color:#1e3a8a;margin:0 0 16px;">Hi Brian,</h2><p style="color:#334155;font-size:15px;line-height:1.6;">This is your monthly reminder to:</p><div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:16px;margin:16px 0;"><ul style="color:#1e40af;font-size:14px;line-height:2;margin:0;padding-left:20px;"><li><strong>Review Archived Resumes</strong> — Check for candidates worth revisiting or removing</li><li><strong>Check the ATS Board</strong> — Ensure all candidates are in the correct pipeline stage</li><li><strong>Update any stale entries</strong> — Move or archive candidates that have been sitting too long</li></ul></div><p style="margin:16px 0;"><a href="https://navontech.com/#login" style="display:inline-block;background:#1e3a8a;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">Open Employee Portal →</a></p><p style="color:#64748b;font-size:13px;margin-top:20px;">This is an automated monthly reminder from the Navon Technologies Employee Portal.</p></div></div>` } }
                }
            }));
        }
        // First: Auto-move Pending candidates to Hired when start date arrives
        const pendingResult = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'stage = :pending AND attribute_exists(hiredDate)',
            ExpressionAttributeValues: { ':pending': 'Pending' }
        }));
        
        const pendingCandidates = pendingResult.Items || [];
        const today = new Date().toISOString().split('T')[0];
        let movedToHired = 0;
        
        for (const candidate of pendingCandidates) {
            if (candidate.hiredDate && candidate.hiredDate <= today) {
                await docClient.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { resumeId: candidate.resumeId, receivedDate: candidate.receivedDate },
                    UpdateExpression: 'SET stage = :hired, updatedAt = :now',
                    ExpressionAttributeValues: { ':hired': 'Hired', ':now': new Date().toISOString() }
                }));
                
                // Send notification
                for (const email of NOTIFY_EMAILS) {
                    await sesClient.send(new SendEmailCommand({
                        Source: 'noreply@navontech.com',
                        Destination: { ToAddresses: [email] },
                        Message: {
                            Subject: { Data: `🎉 Auto-Hired: ${candidate.candidateName} — Start Date Reached` },
                            Body: { Html: { Data: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="background:#1e3a8a;padding:20px;border-radius:12px 12px 0 0;text-align:center;"><h2 style="color:#d4af37;margin:0;">NAVON TECHNOLOGIES</h2></div><div style="background:#f8fafc;padding:24px;border:2px solid #e2e8f0;border-radius:0 0 12px 12px;"><h3 style="color:#059669;">🎉 Candidate Auto-Moved to Hired</h3><p><strong>${candidate.candidateName}</strong> has reached their start date (${candidate.hiredDate}) and has been automatically moved from Pending to Hired.</p><p>Position: ${candidate.position || 'Not specified'}</p></div></div>` } }
                        }
                    }));
                }
                movedToHired++;
                console.log(`Auto-moved ${candidate.candidateName} to Hired (start date: ${candidate.hiredDate})`);
            }
        }
        console.log(`Auto-moved ${movedToHired} candidate(s) to Hired`);

        // Second: Check referral bonus milestones
        const result = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'contains(notes, :referral) AND stage = :hired AND attribute_exists(hiredDate)',
            ExpressionAttributeValues: {
                ':referral': 'Employee Referral',
                ':hired': 'Hired'
            }
        }));
        
        const referrals = result.Items || [];
        console.log(`Found ${referrals.length} hired referrals to check`);
        
        let emailsSent = 0;
        
        for (const referral of referrals) {
            const hiredDate = referral.hiredDate;
            if (!hiredDate) continue;
            
            const hiredMs = new Date(hiredDate).getTime();
            const daysSinceHired = Math.floor((Date.now() - hiredMs) / (1000 * 60 * 60 * 24));
            
            // Extract referee name
            const referredByMatch = (referral.notes || '').match(/Employee Referral from ([^(]+)/);
            const referredBy = referredByMatch ? referredByMatch[1].trim() : 'Unknown';
            
            // Check 30-day milestone
            if (daysSinceHired >= 30 && daysSinceHired < 35 && !referral.bonus30Notified) {
                await sendMilestoneEmail(referral, referredBy, '30 days', daysSinceHired);
                await markNotified(referral.resumeId, referral.receivedDate, 'bonus30Notified');
                emailsSent++;
            }
            
            // Check 90-day milestone
            if (daysSinceHired >= 90 && daysSinceHired < 95 && !referral.bonusNotified) {
                await sendMilestoneEmail(referral, referredBy, '90 days', daysSinceHired);
                await markNotified(referral.resumeId, referral.receivedDate, 'bonusNotified');
                emailsSent++;
            }
            
            // Check 180-day milestone
            if (daysSinceHired >= 180 && daysSinceHired < 185 && !referral.bonus180Notified) {
                await sendMilestoneEmail(referral, referredBy, '180 days', daysSinceHired);
                await markNotified(referral.resumeId, referral.receivedDate, 'bonus180Notified');
                emailsSent++;
            }
        }
        
        console.log(`Done. Sent ${emailsSent} milestone notification(s).`);
        return { statusCode: 200, body: JSON.stringify({ checked: referrals.length, emailsSent }) };
        
    } catch (error) {
        console.error('Error in referral bonus check:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

async function sendMilestoneEmail(referral, referredBy, milestone, daysSinceHired) {
    const is30 = milestone === '30 days';
    const is90 = milestone === '90 days';
    const is180 = milestone === '180 days';
    
    let subject, actionText;
    
    if (is30) {
        subject = `✓ 30-Day Referral Milestone — ${referral.candidateName}`;
        actionText = `${referral.candidateName} has completed 30 days of employment. Referral by ${referredBy} is on track.`;
    } else if (is90) {
        subject = `💸 Referral Bonus Half Payment Due — ${referral.candidateName}`;
        actionText = `Pay HALF of referral bonus to ${referredBy} via payroll. ${referral.candidateName} has completed 90 days.`;
    } else {
        subject = `💸💸 Referral Bonus Final Payout Due — ${referral.candidateName}`;
        actionText = `Pay FULL REMAINING BALANCE of referral bonus to ${referredBy} via payroll. ${referral.candidateName} has completed 180 days.`;
    }
    
    const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">REFERRAL BONUS REMINDER</p>
            </div>
            <div style="background:#d4af37;height:4px;"></div>
            <div style="padding:30px;background:#f8fafc;border-radius:0 0 12px 12px;border:2px solid #e2e8f0;border-top:none;">
                <h2 style="color:#1e3a8a;margin:0 0 16px;">${milestone} Milestone Reached</h2>
                <table style="width:100%;font-size:14px;margin-bottom:20px;">
                    <tr><td style="padding:6px 0;color:#64748b;width:120px;"><strong>Candidate:</strong></td><td>${referral.candidateName}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;"><strong>Position:</strong></td><td>${referral.position || 'Not specified'}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;"><strong>Referred By:</strong></td><td>${referredBy}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;"><strong>Hired Date:</strong></td><td>${referral.hiredDate}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;"><strong>Days Employed:</strong></td><td>${daysSinceHired}</td></tr>
                </table>
                <div style="background:${is180 ? '#dcfce7;border:2px solid #16a34a' : is90 ? '#fef3c7;border:2px solid #fbbf24' : '#eff6ff;border:2px solid #93c5fd'};border-radius:8px;padding:20px;margin-bottom:20px;">
                    <h3 style="color:${is180 ? '#166534' : is90 ? '#92400e' : '#1e40af'};margin:0 0 8px;">${is30 ? 'ℹ️ Status Update' : '⚡ Action Required'}</h3>
                    <p style="color:${is180 ? '#166534' : is90 ? '#92400e' : '#1e40af'};margin:0;">${actionText}</p>
                </div>
                <p style="color:#64748b;font-size:13px;">Automated daily check from Navon Technologies Employee Portal.</p>
            </div>
        </div>
    `;
    
    for (const email of NOTIFY_EMAILS) {
        await sesClient.send(new SendEmailCommand({
            Source: 'noreply@navontech.com',
            Destination: { ToAddresses: [email] },
            Message: {
                Subject: { Data: subject },
                Body: { Html: { Data: htmlBody } }
            }
        }));
    }
    
    console.log(`Sent ${milestone} notification for ${referral.candidateName} (referred by ${referredBy})`);
}

async function markNotified(resumeId, receivedDate, field) {
    await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { resumeId, receivedDate },
        UpdateExpression: `SET ${field} = :val, updatedAt = :now`,
        ExpressionAttributeValues: {
            ':val': true,
            ':now': new Date().toISOString()
        }
    }));
}
