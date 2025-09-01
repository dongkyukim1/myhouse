export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 클라이언트 사이드에서 인증 상태 확인
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
}

// 로그아웃
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
}
