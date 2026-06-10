import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'Email service is not configured. Missing RESEND_API_KEY.'
    });
  }

  try {
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

    const toEmail = process.env.BOOKING_TO_EMAIL || 'Shoebkhan1497@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'Little Paddocks Mogo <onboarding@resend.dev>';

    const htmlMessage = `
      <h2>New ${formType}</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${topic ? `<p><strong>Interested In / Event:</strong> ${topic}</p>` : ''}
      ${guests ? `<p><strong>Number of guests:</strong> ${guests}</p>` : ''}
      ${seatingArea ? `<p><strong>Preferred seating area:</strong> ${seatingArea}</p>` : ''}
      ${message ? `<p><strong>Message / Notes:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>` : ''}
      <hr>
      <p>This enquiry was sent from the Little Paddocks Mogo website.</p>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `Little Paddocks Mogo - ${formType} from ${name}`,
      html: htmlMessage
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please check the email configuration.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your enquiry has been sent successfully.'
    });

  } catch (error) {
    console.error('Booking email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
}
