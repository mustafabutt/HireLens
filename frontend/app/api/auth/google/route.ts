import { redirect } from 'next/navigation';

export async function GET() {
  // Redirect to our custom signin page with Google provider
  redirect('/api/auth/signin?provider=google&callbackUrl=/search');
} 