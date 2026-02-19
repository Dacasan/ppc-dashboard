import { defineMiddleware } from 'astro:middleware';
import PocketBase from 'pocketbase';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/auth/logout', '/api/login'];

// --- Rate limiting (in-memory, per-process) ---
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 min block

function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of loginAttempts) {
    if (now - data.lastAttempt > WINDOW_MS && now > data.blockedUntil) {
      loginAttempts.delete(key);
    }
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  cleanupOldEntries();
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && now < record.blockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  return { allowed: true };
}

export function recordLoginAttempt(ip: string, success: boolean) {
  const now = Date.now();

  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

  if (now - record.lastAttempt > WINDOW_MS) {
    record.count = 0;
  }

  record.count++;
  record.lastAttempt = now;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }

  loginAttempts.set(ip, record);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow static assets and public routes
  if (
    pathname.startsWith('/_') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  ) {
    // Rate limit the login endpoint
    if (pathname === '/api/login' && context.request.method === 'POST') {
      const ip = getClientIP(context.request);
      const { allowed, retryAfter } = checkRateLimit(ip);

      if (!allowed) {
        return new Response(
          JSON.stringify({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter || 900),
            },
          }
        );
      }
    }
    return next();
  }

  // Check for auth cookie
  const pbAuth = context.cookies.get('pb_auth');

  if (!pbAuth?.value) {
    return context.redirect('/login');
  }

  // Validate JWT: quick format/expiry check, then verify with PocketBase
  try {
    const token = pbAuth.value;

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp * 1000;

    if (Date.now() > exp) {
      context.cookies.delete('pb_auth', { path: '/' });
      return context.redirect('/login?error=session_expired');
    }

    // Verify token against PocketBase (validates signature server-side)
    const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');
    pb.autoCancellation(false);
    pb.authStore.save(token, null);

    try {
      const authResult = await pb.collection('users').authRefresh();

      // Refresh cookie with new token
      context.cookies.set('pb_auth', pb.authStore.token, {
        httpOnly: true,
        secure: context.url.protocol === 'https:',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      // Expose verified user info
      const record = authResult.record;
      context.locals.user = {
        id: record.id,
        email: record.email || '',
        name: record.name || record.email || 'Usuario',
        role: record.role || 'marketing', // <--- ESTA LÍNEA ES LA MAGIA
      };
    } catch {
      // Token invalid or revoked
      context.cookies.delete('pb_auth', { path: '/' });
      return context.redirect('/login?error=session_expired');
    }
  } catch {
    context.cookies.delete('pb_auth', { path: '/' });
    return context.redirect('/login');
  }

  return next();
});
