import { json } from '@sveltejs/kit';
import { getUserByToken, markEmailAsRead } from '$lib/db';
import type { RequestHandler } from './$types';

// POST /api/v1/emails/[id]/read - Mark email as read
export const POST: RequestHandler = async ({ request, params }) => {
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
    
    const emailId = params.id;
    await markEmailAsRead(emailId);
    
    return json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
