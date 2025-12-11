import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NewMatchEmailData {
  catererEmail: string;
  catererName: string;
  businessName: string;
  customerName: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  location: string;
  budget: string;
  matchId: string;
  appUrl: string;
}

export async function sendNewMatchNotification(data: NewMatchEmailData) {
  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: 'Kai Catering <notifications@kaicatering.com>',
      to: [data.catererEmail],
      subject: `🎉 New Catering Opportunity - ${data.eventType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Catering Match</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 30px; }
            .event-card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #667eea; }
            .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: 600; color: #475569; }
            .detail-value { color: #1e293b; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 New Match Found!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A customer is looking for your catering services</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${data.catererName}</strong>,</p>
              
              <p>Great news! We've found a perfect match for <strong>${data.businessName}</strong>. A customer is looking for catering services that match your expertise.</p>
              
              <div class="event-card">
                <h3 style="margin-top: 0; color: #1e293b;">Event Details</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Customer:</span>
                  <span class="detail-value">${data.customerName}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Event Type:</span>
                  <span class="detail-value">${data.eventType}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${data.eventDate}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Guest Count:</span>
                  <span class="detail-value">${data.guestCount} guests</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${data.location}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Budget:</span>
                  <span class="detail-value highlight">${data.budget}</span>
                </div>
              </div>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Review the full event details in your dashboard</li>
                <li>Send a personalized quote to the customer</li>
                <li>Start chatting to discuss their specific needs</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.appUrl}/caterer/matches/${data.matchId}" class="cta-button">
                  View Match & Send Quote
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                💡 <strong>Pro tip:</strong> Customers who receive quotes within 2 hours are 3x more likely to book. Don't miss out on this opportunity!
              </p>
            </div>
            
            <div class="footer">
              <p>This email was sent by Kai Catering Platform</p>
              <p>You're receiving this because you're a registered caterer on our platform.</p>
              <p><a href="${data.appUrl}/caterer/settings" style="color: #667eea;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Catering Match Found!

Hi ${data.catererName},

Great news! We've found a perfect match for ${data.businessName}.

Event Details:
- Customer: ${data.customerName}
- Event Type: ${data.eventType}
- Date: ${data.eventDate}
- Guest Count: ${data.guestCount} guests
- Location: ${data.location}
- Budget: ${data.budget}

View the full details and send your quote: ${data.appUrl}/caterer/matches/${data.matchId}

Don't wait - customers who receive quotes quickly are more likely to book!

Best regards,
Kai Catering Team
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', emailResult);
    return { success: true, data: emailResult };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

export async function sendMatchUpdateNotification(
  catererEmail: string,
  catererName: string,
  updateType: 'quote_request' | 'message' | 'booking_confirmed',
  customerName: string,
  eventType: string,
  matchId: string,
  appUrl: string
) {
  const subjects = {
    quote_request: '💬 Customer wants to discuss your quote',
    message: '💬 New message from customer',
    booking_confirmed: '🎉 Booking confirmed!'
  };

  const messages = {
    quote_request: `${customerName} has responded to your quote for their ${eventType} event and wants to discuss details.`,
    message: `${customerName} sent you a new message about their ${eventType} event.`,
    booking_confirmed: `Congratulations! ${customerName} has confirmed the booking for their ${eventType} event.`
  };

  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: 'Kai Catering <notifications@kaicatering.com>',
      to: [catererEmail],
      subject: subjects[updateType],
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hi ${catererName},</h2>
          <p>${messages[updateType]}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/caterer/matches/${matchId}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              View Conversation
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            Kai Catering Team
          </p>
        </div>
      `
    });

    return { success: !error, data: emailResult, error };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}