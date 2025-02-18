'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleAzureSignIn = async () => {
    // You can optionally pass a callback URL
    await signIn('azure-ad', { callbackUrl: '/' });
  };

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
          onClick={handleAzureSignIn}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Sign in with Azure AD
        </button>
      </div>
    </div>
  );
}
