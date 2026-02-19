import { defineMiddleware } from 'astro:middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/auth/logout', '/api/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow static assets and public routes
  if (
    pathname.startsWith('/_') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return next();
  }

  // Check for auth cookie
  const pbAuth = context.cookies.get('pb_auth');

  if (!pbAuth?.value) {
    return context.redirect('/login');
  }

  // Validate JWT token expiry (decode without verifying signature)
  try {
    const parts = pbAuth.value.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp * 1000;

    if (Date.now() > exp) {
      context.cookies.delete('pb_auth', { path: '/' });
      return context.redirect('/login?error=session_expired');
    }

    // Expose user info to pages via locals
    context.locals.user = {
      id: payload.id,
      email: payload.email || '',
      name: payload.name || payload.email || 'Usuario',
    };
  } catch {
    context.cookies.delete('pb_auth', { path: '/' });
    return context.redirect('/login');
  }

  return next();
});
