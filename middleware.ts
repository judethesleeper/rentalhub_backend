import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from './lib/cors';

export function middleware(req: NextRequest) {
  // Only apply CORS to API routes
  if (!req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const res = NextResponse.next();
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
