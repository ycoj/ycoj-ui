import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_BASEURL?.replace(/\/+$/, '');
const backendOrigin = backendBaseUrl ? new URL(backendBaseUrl).origin : '';

// Dev-only: browsers send the dev-server origin (e.g. a LAN address) in Origin
// and Referer, but the backend rejects POSTs whose origin is not its own site.
// Point both at the backend; the rewrites in next.config.ts then forward the
// corrected headers upstream.
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development' || !backendBaseUrl)
    return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set('origin', backendOrigin);
  try {
    const referer = new URL(request.headers.get('referer') ?? backendBaseUrl);
    headers.set('referer', backendBaseUrl + referer.pathname + referer.search);
  } catch {
    headers.set('referer', `${backendBaseUrl}/`);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/api/:path*', '/fs/:path*', '/paste/:id/raw'],
};
