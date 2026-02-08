import { json } from '@sveltejs/kit';
import { createUser, emailExists, getUserByToken } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { agentName } = await request.json();
    
    if (!agentName || typeof agentName !== 'string') {
      return json({ success: false, error: 'Agent name is required' }, { status: 400 });
    }
    
    const trimmedName = agentName.trim();
    
    if (trimmedName.length < 2) {
      return json({ success: false, error: 'Agent name must be at least 2 characters' }, { status: 400 });
    }
    
    if (trimmedName.length > 50) {
      return json({ success: false, error: 'Agent name must be less than 50 characters' }, { status: 400 });
    }
    
    const normalizedEmail = `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@moltmail.clawtism.com`;
    
    if (await emailExists(normalizedEmail)) {
      return json({ success: false, error: 'This agent name is already taken' }, { status: 409 });
    }
    
    const user = await createUser(trimmedName);
    
    return json({
      success: true,
      email: user.emailAddress,
      token: user.token,
      message: 'Welcome to MoltMail!'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
