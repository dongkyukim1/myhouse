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
          background: 'url("/apt.png") center/cover no-repeat',
          borderRadius: windowWidth < 1200 ? '40px' : '50px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: windowWidth < 1200 ? '12px solid #1a1a1a' : '15px solid #1a1a1a',
          margin: 'auto',
          maxWidth: '90vw',
          maxHeight: '85vh'
        }}>


          {/* 배경 오버레이 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: windowWidth < 1200 ? '40px' : '50px'
          }}></div>

          {/* 중앙 로고 */}
          <div style={{
            position: 'absolute',
            top: windowWidth < 1200 ? '150px' : '200px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            background: 'white',
            borderRadius: '50%',
            width: windowWidth < 1200 ? '80px' : '90px',
            height: windowWidth < 1200 ? '80px' : '90px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.8)',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10
          }}>
            <span style={{ 
              color: '#000', 
              fontSize: windowWidth < 1200 ? '35px' : '40px'
            }}>🏠</span>
          </div>

          {/* 핸드폰 하단 텍스트 및 버튼 */}
          <div style={{
            position: 'absolute',
            top: windowWidth < 1200 ? '320px' : '380px',
            left: windowWidth < 1200 ? '20px' : '25px',
            right: windowWidth < 1200 ? '20px' : '25px',
            textAlign: 'center',
            color: 'white',
            paddingBottom: '20px',
            zIndex: 10
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
                padding: windowWidth < 1200 ? '14px 20px' : '16px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                fontSize: windowWidth < 1200 ? '14px' : '15px',
                fontFamily: 'Pretendard-Bold',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: windowWidth < 1200 ? '12px' : '14px',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.2)',
                letterSpacing: '0.5px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #7289da 0%, #8e5ec2 100%)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(102, 126, 234, 0.6), 0 8px 24px rgba(118, 75, 162, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.2)';
              }}
            >
              가입하기
            </button>

            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%',
                padding: windowWidth < 1200 ? '14px 20px' : '16px 24px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                fontSize: windowWidth < 1200 ? '14px' : '15px',
                fontFamily: 'Pretendard-Bold',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.5px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
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