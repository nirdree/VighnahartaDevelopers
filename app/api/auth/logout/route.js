import { NextResponse } from 'next/server';
import { clearCookieHeader } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, data: 'Logged out successfully' });
  // Note: we need the request to clear the correct cookie variant (secure vs non-secure)
  // but Next.js route handlers don't provide it here; clear both variants as a fallback.
  response.headers.append('Set-Cookie', clearCookieHeader({ url: 'http://localhost' }));
  response.headers.append('Set-Cookie', clearCookieHeader({ url: 'https://localhost' }));
  return response;
}
