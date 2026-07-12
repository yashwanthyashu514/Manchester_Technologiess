import os

email_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server', 'email.js')

with open(email_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'sendSelectionNotification' in content:
    print('Functions already exist, skipping.')
else:
    additions = r"""

/**
 * Sends a selection notification email when admin marks candidate as Selected.
 */
export const sendSelectionNotification = async (candidateName, candidateEmail, statusRecord) => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const subject = `Congratulations! You have been Selected — Manchester Technologies Internship`;
  const bodyHtml = wrapHtmlEmail('Internship Selection Confirmed', `
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>You have been <strong style="color:#C8A96A;">officially selected</strong> for our Internship Program!</p>
    <div class="highlight-box">
      <table style="width:100%;">
        <tr><td style="color:#A0A0A0;width:40%;">Tracking ID</td><td style="color:#C8A96A;font-weight:bold;">${statusRecord.tracking_id}</td></tr>
        <tr><td style="color:#A0A0A0;">Domain</td><td style="color:#fff;">${statusRecord.domain || 'N/A'}</td></tr>
        <tr><td style="color:#A0A0A0;">Mentor</td><td style="color:#fff;">${statusRecord.mentor || 'To be assigned'}</td></tr>
        <tr><td style="color:#A0A0A0;">Start Date</td><td style="color:#fff;">${statusRecord.start_date || 'To be confirmed'}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="${portalUrl}/internships/track-status" class="btn">Track &amp; Accept Offer</a>
    </div>
    <p>Best Regards,<br/><strong>Manchester Technologies</strong></p>
  `);
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[SIMULATION] Selection email to ' + candidateEmail + ' — Tracking ID: ' + statusRecord.tracking_id);
    return true;
  }
  await transporter.sendMail({
    from: `"Manchester Technologies" <${process.env.SMTP_USER}>`,
    to: candidateEmail,
    subject,
    html: bodyHtml
  });
  return true;
};

/**
 * Sends signature confirmation with MT-SIGN Certificate ID after signing.
 */
export const sendSignatureConfirmation = async (candidateName, candidateEmail, applicationId, certId, signedAt) => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const subject = `Agreement Signed Successfully — Certificate ID: ${certId}`;
  const signedDate = new Date(signedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const bodyHtml = wrapHtmlEmail('Digital Agreement Signed', `
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>Your digital signature has been <strong style="color:#C8A96A;">recorded and verified</strong>.</p>
    <div class="highlight-box">
      <table style="width:100%;">
        <tr><td style="color:#A0A0A0;width:40%;">Application ID</td><td style="color:#C8A96A;">${applicationId}</td></tr>
        <tr><td style="color:#A0A0A0;">Certificate ID</td><td style="color:#C8A96A;font-weight:bold;font-size:15px;">${certId}</td></tr>
        <tr><td style="color:#A0A0A0;">Signed On</td><td style="color:#fff;">${signedDate} (IST)</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${portalUrl}/internships/verify-signature" class="btn">Verify Signature Certificate</a>
    </div>
    <p style="color:#A0A0A0;font-size:12px;">Keep Certificate ID <strong style="color:#C8A96A;">${certId}</strong> safe as proof of acceptance.</p>
    <p>Best Regards,<br/><strong>Manchester Technologies</strong></p>
  `);
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[SIMULATION] Signature confirmation to ' + candidateEmail + ' — certId: ' + certId);
    return true;
  }
  await transporter.sendMail({
    from: `"Manchester Technologies" <${process.env.SMTP_USER}>`,
    to: candidateEmail,
    subject,
    html: bodyHtml
  });
  return true;
};
"""
    with open(email_path, 'a', encoding='utf-8') as f:
        f.write(additions)
    print('Email functions appended successfully to:', email_path)
