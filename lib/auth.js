import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'vighnaharta_token';

/**
 * Sign a JWT token for a given user payload.
 * @param {{ id: string, email: string, role: string, name: string }} payload
 * @returns {string} signed JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {{ id: string, email: string, role: string, name: string } | null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Get the current user from the request cookies.
 * @param {Request} request
 * @returns {{ id: string, email: string, role: string, name: string } | null}
 */
export function getUserFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Create a Set-Cookie header value for the JWT token.
 * @param {string} token
 * @returns {string}
 */
export function createCookieHeader(token) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/**
 * Create a Set-Cookie header value to clear the JWT token.
 * @returns {string}
 */
export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * HOC to protect API routes. Attaches user to request.user.
 * @param {Function} handler - Next.js API handler
 * @param {string|null} requiredRole - 'admin' | 'agent' | null (any authenticated)
 * @returns {Function}
 */
export function withAuth(handler, requiredRole = null) {
  return async function (request, context) {
    const user = getUserFromRequest(request);

    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    if (requiredRole && user.role !== requiredRole) {
      return Response.json(
        { success: false, error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      );
    }

    // Attach user to request for downstream use
    request.user = user;
    return handler(request, context);
  };
}
