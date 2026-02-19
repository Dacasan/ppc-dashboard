import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const pbAuth = cookies.get('pb_auth');
  if (!pbAuth?.value) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const currentPassword = formData.get('current_password')?.toString();
  const newPassword = formData.get('new_password')?.toString();
  const confirmPassword = formData.get('confirm_password')?.toString();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return redirect('/profile?error=password_failed');
  }

  if (newPassword !== confirmPassword) {
    return redirect('/profile?error=password_mismatch');
  }

  if (newPassword.length < 8) {
    return redirect('/profile?error=short_password');
  }

  const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');
  pb.autoCancellation(false);
  pb.authStore.save(pbAuth.value, null);

  try {
    // Get user ID from token
    const parts = pbAuth.value.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId = payload.id;

    await pb.collection('users').update(userId, {
      oldPassword: currentPassword,
      password: newPassword,
      passwordConfirm: newPassword,
    });

    // Re-authenticate with new password to get fresh token
    const authData = await pb.collection('users').authWithPassword(payload.email, newPassword);

    const isSecure = new URL(request.url).protocol === 'https:';
    cookies.set('pb_auth', authData.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return redirect('/profile?success=password_changed');
  } catch (e: any) {
    console.error('[Profile] Password change failed:', e?.message ?? e);
    return redirect('/profile?error=password_failed');
  }
};
