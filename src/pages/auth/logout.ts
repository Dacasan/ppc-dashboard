import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete('pb_auth', { path: '/' });
  return redirect('/login');
};
