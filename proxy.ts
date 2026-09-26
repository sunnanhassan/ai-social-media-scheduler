import { NextResponse, type NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (secretKey && pubKey && !pubKey.includes('example.com')) {
    try {
      const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
      const isPublicRoute = createRouteMatcher([
        '/sign-in(.*)',
        '/sign-up(.*)',
        '/',
        '/api/inngest(.*)',
        '/api/social/callback(.*)',
        '/api/channel/callback(.*)',
      ]);
      return clerkMiddleware(async (auth, request) => {
        if (!isPublicRoute(request)) {
          await auth.protect();
        }
      })(req, {} as any);
    } catch (e) {
      console.warn('Clerk middleware error, passing through:', e);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
};