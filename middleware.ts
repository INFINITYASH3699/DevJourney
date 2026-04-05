import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicPaths = ['/signin', '/signup'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  // No token on protected route - redirect to signin
  if (!token && !isPublicPath) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Has token on public route - redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token on protected routes
  if (token && !isPublicPath) {
    const user = await verifyTokenEdge(token);

    if (!user) {
      const response = NextResponse.redirect(new URL('/signin', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|icon.tsx|.*\\..*).*)',
  ],
};