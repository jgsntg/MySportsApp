import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teams/:path*',
    '/team/:path*',
    '/player/:path*',
    '/headlines/:path*',
    '/api/favorites/:path*',
  ],
};
