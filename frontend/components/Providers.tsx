'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

function UpsertUserEmail() {
  const { data: session } = useSession();

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;

    // Fire-and-forget upsert
    fetch('/api/user/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).catch(() => {});
  }, [session?.user?.email]);

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <UpsertUserEmail />
      {children}
    </SessionProvider>
  );
} 