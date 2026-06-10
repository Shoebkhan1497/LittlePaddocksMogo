function clean(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.BOOKING_TO_EMAIL || 'Shoebkhan1497@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'Little Paddocks Mogo <onboarding@resend.dev>';

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please add RESEND_API_KEY in Vercel Environment Variables and redeploy.'
      });
    }

    const body = parseBody(req);

    const formType = clean(body.formType || 'Booking enquiry');
    const name = clean(body.name);
    const email = clean(body.email);
    const topic = clean(body.topic);
    const seatingArea = clean(body.seatingArea);
    const guests = clean(body.guests);
    const message = clean(body.message);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.'
      });
    }

    const htmlMessage = `
      <h2>New ${formType}</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${topic ? `<p><strong>Interested In / Event:</strong> ${topic}</p>` : ''}
      ${guests ? `<p><strong>Number of guests:</strong> ${guests}</p>` : ''}
      ${seatingArea ? `<p><strong>Preferred Seating Area:</strong> ${seatingArea}</p>` : ''}
      ${message ? `<p><strong>Message / Notes:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>` : ''}
      <hr>
      <p>This enquiry was sent from the Little Paddocks Mogo website.</p>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Little Paddocks Mogo - ${formType} from ${name}`,
        html: htmlMessage
      })
    });

    const resendResult = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      return res.status(500).json({
        success: false,
        message: resendResult.message || 'Email could not be sent. Please check Resend sender and API key settings.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your enquiry has been sent successfully.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Something went wrong. Please try again.'
    });
  }
}
