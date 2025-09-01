"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { FullScreenLoading } from './LoadingAnimation';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <FullScreenLoading 
        text="로딩 중..."
        backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        size={120}
      />
    );
  }

  if (!user) {
    return fallback || null;
  }

  return <>{children}</>;
}
