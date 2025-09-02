"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { FullScreenLoading } from '@/components/LoadingAnimation';

export default function MainPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [windowWidth, setWindowWidth] = useState(1600); // 기본값 설정

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // 컴포넌트 마운트 시 현재 화면 크기 설정
    setWindowWidth(window.innerWidth);
    
    // 화면 크기 변경 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      padding: '0',
      overflow: 'auto'
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
        display: 'flex',
        flexDirection: windowWidth < 1200 ? 'column' : 'row'
      }}>
      {/* 왼쪽 로고 섹션 */}
      <div style={{
        flex: windowWidth < 1200 ? '0 0 auto' : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: windowWidth < 1200 ? '20px' : '40px',
        minHeight: windowWidth < 1200 ? '30vh' : 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <h1 style={{
            fontSize: windowWidth < 1200 ? '80px' : windowWidth < 1600 ? '100px' : '120px',
            fontFamily: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
            fontWeight: '900',
            margin: 0,
            letterSpacing: '-3px',
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
        width: windowWidth < 1200 ? '100%' : '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: windowWidth < 1200 ? '20px' : '20px 0',
        position: 'relative',
        overflow: 'visible',
        minHeight: windowWidth < 1200 ? '100vh' : '100vh'
      }}>
        {/* 핸드폰 실루엣 - 반응형 */}
        <div style={{
          width: windowWidth < 1200 ? '300px' : windowWidth < 1600 ? '350px' : '400px',
          height: windowWidth < 1200 ? '600px' : windowWidth < 1600 ? '700px' : '800px',
          background: '#000',
          borderRadius: windowWidth < 1200 ? '40px' : '50px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: windowWidth < 1200 ? '12px solid #1a1a1a' : '15px solid #1a1a1a',
          margin: 'auto',
          maxWidth: '90vw',
          maxHeight: '85vh'
        }}>
          {/* 집 종류 원형 패턴 */}
          <div style={{
            position: 'absolute',
            top: windowWidth < 1200 ? '25px' : '30px',
            left: windowWidth < 1200 ? '15px' : '20px',
            right: windowWidth < 1200 ? '15px' : '20px',
            height: windowWidth < 1200 ? '250px' : '280px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-around',
            gap: windowWidth < 1200 ? '12px' : '15px',
            padding: windowWidth < 1200 ? '15px 8px' : '18px 10px'
          }}>
            {houseTypes.map((house, index) => (
              <div
                key={house.id}
                style={{
                  width: windowWidth < 1200 ? '60px' : '70px',
                  height: windowWidth < 1200 ? '60px' : '70px',
                  borderRadius: '50%',
                  background: `linear-gradient(145deg, ${house.color}, ${house.color}dd)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: windowWidth < 1200 ? '24px' : '28px',
                  animation: `float ${3 + (index % 3)}s ease-in-out infinite ${index * 0.3}s`,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7), 0 3px 10px rgba(255, 255, 255, 0.1) inset',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
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

          {/* 중앙 로고 */}
          <div style={{
            position: 'absolute',
            top: windowWidth < 1200 ? '290px' : '330px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            background: 'white',
            borderRadius: '50%',
            width: windowWidth < 1200 ? '65px' : '75px',
            height: windowWidth < 1200 ? '65px' : '75px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.8)',
            border: '3px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ 
              color: '#000', 
              fontSize: windowWidth < 1200 ? '30px' : '35px'
            }}>🏠</span>
          </div>

          {/* 핸드폰 하단 텍스트 및 버튼 */}
          <div style={{
            position: 'absolute',
            top: windowWidth < 768 ? '420px' : windowWidth < 1200 ? '470px' : '520px',
            left: windowWidth < 1200 ? '20px' : '25px',
            right: windowWidth < 1200 ? '20px' : '25px',
            textAlign: 'center',
            color: 'white',
            paddingBottom: '30px'
          }}>
            <h2 style={{
              fontSize: windowWidth < 1200 ? '16px' : '18px',
              fontFamily: 'Pretendard-Black',
              fontWeight: '900',
              margin: '0 0 4px 0',
              lineHeight: '1.1',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              이제 좀 당첨되라.
            </h2>
            <h3 style={{
              fontSize: windowWidth < 1200 ? '16px' : '18px',
              fontFamily: 'Pretendard-Black',
              fontWeight: '900',
              margin: windowWidth < 1200 ? '0 0 15px 0' : '0 0 18px 0',
              lineHeight: '1.1',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              MyHouse에서 편하게하자.
            </h3>

            <button
              onClick={() => router.push('/register')}
              style={{
                width: '100%',
                padding: windowWidth < 1200 ? '10px 16px' : '12px 18px',
                background: '#1db954',
                color: '#000000',
                border: 'none',
                borderRadius: '50px',
                fontSize: windowWidth < 1200 ? '12px' : '13px',
                fontFamily: 'Pretendard-Bold',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: windowWidth < 1200 ? '10px' : '12px',
                boxShadow: '0 6px 20px rgba(29, 185, 84, 0.4)',
                letterSpacing: '0.3px'
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
                padding: windowWidth < 1200 ? '10px 16px' : '12px 18px',
                background: 'linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '50px',
                fontSize: windowWidth < 1200 ? '12px' : '13px',
                fontFamily: 'Pretendard-Bold',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.3px',
                boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3)'
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