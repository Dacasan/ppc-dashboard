import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
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
    return redirect('/login?error=missing_params');
  }

  const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');
  pb.autoCancellation(false);

  try {
    const authData = await pb.collection('users').authWithPassword(email, password);

    const isSecure = new URL(request.url).protocol === 'https:';

    cookies.set('pb_auth', authData.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return redirect('/');
  } catch (e: any) {
    console.error('[Login] Email/password auth failed:', e?.message ?? e);
    return redirect('/login?error=auth_failed');
  }
};
