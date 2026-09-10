import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Sends email directly via the Gmail OAuth connector — bypasses Base44 SendEmail Core integration.
// This works even when Base44 integration credits are exhausted, because it uses the
// Gmail connector's OAuth token to call the Gmail API directly.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { to, subject, html, text, from_name } = body;

    if (!to) return Response.json({ error: 'to is required' }, { status: 400 });
    if (!subject) return Response.json({ error: 'subject is required' }, { status: 400 });
    if (!html && !text) return Response.json({ error: 'html or text body is required' }, { status: 400 });

    // Get Gmail connector OAuth token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    if (!accessToken) {
      return Response.json({ error: 'Gmail connector not authorized — connect it in Dashboard → Integrations' }, { status: 500 });
    }

    // Build RFC 2822 email
    const senderName = from_name || 'SEO Generator';
    const fromAddress = 'me'; // Gmail API uses 'me' for the authenticated user
    const boundary = '----=_Part_' + Math.random().toString(36).substring(2);

    let emailBody = '';
    emailBody += `From: ${senderName} <me>\r\n`;
    emailBody += `To: ${to}\r\n`;
    emailBody += `Subject: ${subject}\r\n`;
    emailBody += `MIME-Version: 1.0\r\n`;

    if (html && text) {
      emailBody += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
      emailBody += `--${boundary}\r\n`;
      emailBody += `Content-Type: text/plain; charset=UTF-8\r\n`;
      emailBody += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      emailBody += `${text}\r\n\r\n`;
      emailBody += `--${boundary}\r\n`;
      emailBody += `Content-Type: text/html; charset=UTF-8\r\n`;
      emailBody += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      emailBody += `${html}\r\n\r\n`;
      emailBody += `--${boundary}--\r\n`;
    } else if (html) {
      emailBody += `Content-Type: text/html; charset=UTF-8\r\n`;
      emailBody += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      emailBody += `${html}\r\n`;
    } else {
      emailBody += `Content-Type: text/plain; charset=UTF-8\r\n`;
      emailBody += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      emailBody += `${text}\r\n`;
    }

    // Base64url encode the email
    const encodedEmail = base64UrlEncode(emailBody);

    // Send via Gmail API
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    const gmailData = await gmailRes.json();
    if (!gmailRes.ok) {
      return Response.json({
        error: 'Gmail API error',
        detail: gmailData.error?.message || 'Failed to send email',
        status: gmailRes.status,
      }, { status: gmailRes.status });
    }

    // Log the send as a Receipt
    const svc = base44.asServiceRole;
    await svc.entities.Receipt.create({
      kind: 'email_sent',
      summary: `Email sent to ${to}: ${subject}`,
      detail: JSON.stringify({ to, subject, message_id: gmailData.id }).slice(0, 2000),
      source: 'gmail_connector',
      provenance: 'MEASURED',
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message_id: gmailData.id,
      thread_id: gmailData.threadId,
      to,
      subject,
      sent_via: 'gmail_connector_direct',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function base64UrlEncode(str) {
  // Convert string to base64, then make it URL-safe
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}