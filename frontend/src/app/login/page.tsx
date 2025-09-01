"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '로그인에 실패했습니다.');
      login(data.user);
      await Swal.fire({
        title: '🏠 로그인 성공!',
        text: `안녕하세요, ${data.user.name}님!`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#fff',
        customClass: { popup: 'swal-popup' }
      });
      router.push('/home');
      router.refresh();
    } catch (err: any) {
      await Swal.fire({
        title: '❌ 로그인 실패',
        text: err.message || '로그인에 실패했습니다.',
        icon: 'error',
        confirmButtonText: '다시 시도',
        confirmButtonColor: '#ef4444',
        background: '#fff',
        customClass: { popup: 'swal-popup', confirmButton: 'swal-error-btn' }
      });
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1000,
      padding: '0'
    }}>
      {/* 블러 처리된 배경 이미지 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("/main_background.jpg") center/cover no-repeat',
        filter: 'blur(5px)',
        transform: 'scale(1.1)',
        zIndex: 1
      }}></div>
      
      {/* 오버레이 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 2
      }}></div>
      
      {/* 메인 콘텐츠 */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* 로그인 카드 */}
        <div style={{
          width: '480px',
          padding: '60px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '32px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* 헤더 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontFamily: '"Inter", "Poppins", sans-serif',
              fontWeight: '900',
              margin: '0 0 16px 0',
              color: '#1a1a1a',
              letterSpacing: '-2px'
            }}>
              MyHouse
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#666',
              margin: 0,
              fontFamily: '"Inter", sans-serif'
            }}>
              로그인하여 시작하세요
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* 이메일 입력 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px',
                fontFamily: '"Inter", sans-serif'
              }}>
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.3s ease',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1db954';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e1e5e9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px',
                fontFamily: '"Inter", sans-serif'
              }}>
                비밀번호
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="비밀번호를 입력하세요"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.3s ease',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1db954';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e1e5e9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div style={{
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#dc2626',
                fontSize: '14px',
                fontFamily: '"Inter", sans-serif'
              }}>
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px 24px',
                background: loading ? '#9ca3af' : '#1db954',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.background = '#1ed760';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(29, 185, 84, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#1db954';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.3)';
                }
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            {/* 회원가입 링크 */}
            <div style={{
              textAlign: 'center',
              marginTop: '24px'
            }}>
              <span style={{
                color: '#666',
                fontSize: '14px',
                fontFamily: '"Inter", sans-serif'
              }}>
                계정이 없으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => router.push('/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1db954',
                  fontSize: '14px',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1ed760';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1db954';
                }}
              >
                회원가입
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
