import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, allow all access to dashboard routes
  // In production, you would check for authentication here
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
