import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email: string | undefined = body?.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('app_users')
      .upsert({ email }, { onConflict: 'email' });

    if (error) {
      // If table missing, return clear guidance
      if (error.message && /relation .* does not exist/i.test(error.message)) {
        return NextResponse.json({
          error: 'Missing table app_users. Please run the provided SQL to create it.',
          hint: 'Run the SQL in frontend/supabase-users.sql in your Supabase SQL editor.'
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}