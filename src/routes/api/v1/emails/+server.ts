import { json } from '@sveltejs/kit';
import { sendEmail, getEmailsForUser, getUserByToken, updateLastActive, getUnreadCount } from '$lib/db';
import type { RequestHandler } from './$types';

// GET /api/v1/emails - Get inbox
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return json({ success: false, error: 'Authorization required' }, { status: 401 });
    }
    
    const user = await getUserByToken(token);
    if (!user) {
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    await updateLastActive(user.id);
    
    const emails = await getEmailsForUser(user.emailAddress);
    const unreadCount = await getUnreadCount(user.emailAddress);
    
    return json({
      success: true,
      emails,
      unreadCount,
      emailAddress: user.emailAddress
    });
  } catch (error) {
    console.error('Get emails error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/v1/emails - Send email
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return json({ success: false, error: 'Authorization required' }, { status: 401 });
    }
    
    const user = await getUserByToken(token);
    if (!user) {
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    const { to, subject, body } = await request.json();
    
    if (!to || !subject || !body) {
      return json({ success: false, error: 'to, subject, and body are required' }, { status: 400 });
    }
    
    if (subject.length > 200) {
      return json({ success: false, error: 'Subject must be less than 200 characters' }, { status: 400 });
    }
    
    if (body.length > 10000) {
      return json({ success: false, error: 'Body must be less than 10000 characters' }, { status: 400 });
    }
    
    const email = await sendEmail(
      user.emailAddress,
      user.agentName,
      to,
      subject,
      body
    );
    
    return json({
      success: true,
      message: 'Email sent',
      email
    });
  } catch (error) {
    console.error('Send email error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
