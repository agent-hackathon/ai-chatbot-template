// app/api/debug-env/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  // Print all environment variables to your CloudWatch logs
  console.log('🔥 RUNTIME ENV VARS:', JSON.stringify(process.env, null, 2));
  
  return NextResponse.json({
    message: 'Check CloudWatch logs for environment variables.',
  });
}
