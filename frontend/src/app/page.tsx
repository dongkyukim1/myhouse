"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';
import { FullScreenLoading } from '@/components/LoadingAnimation';

export default function MainPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  // 집 종류 데이터
  const houseTypes = [
    { id: 1, name: '아파트', emoji: '🏢', color: '#4f46e5' },
    { id: 2, name: '빌라', emoji: '🏘️', color: '#059669' },
    { id: 3, name: '단독주택', emoji: '🏡', color: '#dc2626' },
    { id: 4, name: '오피스텔', emoji: '🏬', color: '#7c3aed' },
    { id: 5, name: '타운하우스', emoji: '🏘️', color: '#ea580c' },
    { id: 6, name: '펜트하우스', emoji: '🏙️', color: '#0891b2' },
    { id: 7, name: '원룸', emoji: '🏠', color: '#be123c' },
    { id: 8, name: '투룸', emoji: '🏠', color: '#16a34a' },
    { id: 9, name: '쓰리룸', emoji: '🏠', color: '#ca8a04' }
  ];

  if (loading) {
    return (
      <FullScreenLoading 
        text="로딩 중..."
        backgroundColor="linear-gradient(135deg, #1db954 0%, #1ed760 100%)"
        size={120}
      />
    );
  }

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
        background: 'rgba(0, 0, 0, 0.2)',
        zIndex: 2
      }}></div>
      
      {/* 메인 콘텐츠 */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        width: '100%',
        height: '100%',
        display: 'flex'
      }}>
      {/* 왼쪽 로고 섹션 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <h1 style={{
            fontSize: '140px',
            fontFamily: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
            fontWeight: '900',
            margin: 0,
            letterSpacing: '-4px',
            textTransform: 'none',
            
            color: 'white',
            transform: 'perspective(1000px) rotateY(3deg) rotateX(-1deg)',
            transformStyle: 'preserve-3d',
            fontStyle: 'normal'
          }}>
            MyHouse
          </h1>
        </div>
      </div>

      {/* 오른쪽 핸드폰 실루엣 섹션 */}
      <div style={{
        width: '50%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 핸드폰 실루엣 - 화면에서 짤리게 */}
        <div style={{
          width: '600px',
          height: '1200px',
          background: '#000',
          borderRadius: '70px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.5)',
          border: '20px solid #1a1a1a',
          marginTop: '100px',
          marginLeft: '100px',
          marginBottom: '0px'
        }}>
          {/* 집 종류 원형 패턴 */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '30px',
            right: '30px',
            height: '480px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-around',
            gap: '35px',
            padding: '40px 20px'
          }}>
            {houseTypes.map((house, index) => (
              <div
                key={house.id}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `linear-gradient(145deg, ${house.color}, ${house.color}dd)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '50px',
                  animation: `float ${3 + (index % 3)}s ease-in-out infinite ${index * 0.3}s`,
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(255, 255, 255, 0.1) inset',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.8), 0 8px 20px rgba(255, 255, 255, 0.2) inset';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(255, 255, 255, 0.1) inset';
                }}
              >
                {house.emoji}
              </div>
            ))}
          </div>

          {/* Spotify 로고 스타일 */}
          <div style={{
            position: 'absolute',
            top: '570px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '60px',
            background: 'white',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            border: '4px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: '#000', fontSize: '70px' }}>🏠</span>
          </div>

          {/* 핸드폰 하단 텍스트 및 버튼 */}
          <div style={{
            position: 'absolute',
            top: '720px',
            left: '40px',
            right: '40px',
            textAlign: 'center',
            color: 'white'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontFamily: 'Pretendard-Black',
              fontWeight: '900',
              margin: '0 0 6px 0',
              lineHeight: '1.1',
              letterSpacing: '-1px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              이제 좀 당첨되라.
            </h2>
            <h3 style={{
              fontSize: '32px',
              fontFamily: 'Pretendard-Black',
              fontWeight: '900',
              margin: '0 0 35px 0',
              lineHeight: '1.1',
              letterSpacing: '-1px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              MyHouse에서 편하게하자.
            </h3>

            <button
              onClick={() => router.push('/register')}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: '#1db954',
                color: '#000000',
                border: 'none',
                borderRadius: '50px',
                fontSize: '16px',
                fontFamily: 'Pretendard-Bold',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '16px',
                boxShadow: '0 8px 25px rgba(29, 185, 84, 0.4)',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = '#1ed760';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(29, 185, 84, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#1db954';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.4)';
              }}
            >
              무료로 가입하기
            </button>

            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '50px',
                fontSize: '16px',
                fontFamily: 'Pretendard-Bold',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 25px rgba(255, 255, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.3)';
              }}
            >
              로그인
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
}