import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().trim();

  if (!email) {
    return redirect('/profile?error=recovery_failed');
  }

  const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');
  pb.autoCancellation(false);

  try {
    await pb.collection('users').requestPasswordReset(email);
    return redirect('/profile?success=recovery_sent');
  } catch (e: any) {
    console.error('[Profile] Recovery request failed:', e?.message ?? e);
    return redirect('/profile?error=recovery_failed');
  }
};
