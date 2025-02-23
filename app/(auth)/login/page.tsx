'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    console.log('🔥 LoginPage - Status:', status, 'Session:', session);
    if (status === 'authenticated') {
      console.log('🔥 LoginPage - Authenticated, redirecting to /');
      router.push('/');
    }
  }, [status, session, router]);

  const handleAzureSignIn = async () => {
    console.log('🔥 LoginPage - Starting Azure AD sign-in');
    await signIn('microsoft-entra-id', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    console.log('🔥 LoginPage - Loading session...');
    return <p>Loading...</p>;
  }

  console.log('🔥 LoginPage - Rendering login UI');
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12 p-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Sign in using your Azure AD account.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAzureSignIn}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Sign in with Azure AD
        </button>
      </div>
    </div>
  );
}