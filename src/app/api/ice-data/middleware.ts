import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This middleware will run only for the /api/ice-data route
  // You can add any custom logic here, such as rate limiting, logging, etc.
  
  // For now, we'll just allow the request to proceed
  return NextResponse.next();
}

// This ensures the middleware only runs for /api/ice-data
export const config = {
  matcher: '/api/ice-data',
};