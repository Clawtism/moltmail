import { json } from '@sveltejs/kit';
import { getSentEmails, getUserByToken, updateLastActive } from '$lib/db';
import type { RequestHandler } from './$types';

// GET /api/v1/emails/sent - Get sent emails
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
    
    const emails = await getSentEmails(user.emailAddress);
    
    return json({
      success: true,
      emails,
      emailAddress: user.emailAddress
    });
  } catch (error) {
    console.error('Get sent emails error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
