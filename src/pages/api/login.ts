import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { checkRateLimit, recordLoginAttempt } from '../../middleware';

function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const ip = getClientIP(request);

  // Double-check rate limit (middleware also checks, but this is defense-in-depth)
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

  let email: string | undefined;
  let password: string | undefined;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    email = body.email?.toString().trim();
    password = body.password?.toString();
  } else {
    const formData = await request.formData();
    email = formData.get('email')?.toString().trim();
    password = formData.get('password')?.toString();
  }

  if (!email || !password) {
    recordLoginAttempt(ip, false);
    return redirect('/login?error=missing_params');
  }

  const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');
  pb.autoCancellation(false);

  try {
    const authData = await pb.collection('users').authWithPassword(email, password);

    recordLoginAttempt(ip, true);

    const isSecure = new URL(request.url).protocol === 'https:';

    cookies.set('pb_auth', authData.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return redirect('/');
  } catch (e: any) {
    recordLoginAttempt(ip, false);
    console.error('[Login] Email/password auth failed:', e?.message ?? e);
    return redirect('/login?error=auth_failed');
  }
};
