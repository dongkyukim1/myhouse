"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FullScreenLoading } from '@/components/LoadingAnimation';
import CyberEffects from '@/components/CyberEffects';

export default function MainPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [windowWidth, setWindowWidth] = useState(1600);
  const [currentText, setCurrentText] = useState(0);

  const textSets = [
    {
      title: "FUTURE IS NOW",
      subtitle: "청약의 새로운 패러다임을 경험하세요"
    },
    {
      title: "BEYOND LIMITS", 
      subtitle: "한계를 뛰어넘는 주택청약 서비스"
    },
    {
      title: "MYHOUSE DREAMS",
      subtitle: "당신의 꿈의 집을 찾아드립니다"
    }
  ];

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Text rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % textSets.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [textSets.length]);

  if (loading) {
    return (
      <FullScreenLoading 
        text="시스템 초기화 중..."
        backgroundColor="linear-gradient(135deg, #FF5E00 0%, #00B2FF 100%)"
        size={120}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <CyberEffects />
      
      {/* Animated Grid Background */}
      <div className="grid-bg"></div>
      <div className="gradient-overlay"></div>
      <div className="scanlines"></div>

      {/* Animated Shapes */}
      <div className="shapes-container">
        <div className="shape shape-circle"></div>
        <div className="shape shape-triangle"></div>
        <div className="shape shape-square"></div>
      </div>

      {/* Floating Particles */}
      <div id="particles"></div>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        padding: windowWidth < 768 ? '15px 20px' : '20px 50px',
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 94, 0, 0.1)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg 
              style={{ width: '40px', height: '40px' }}
              viewBox="0 0 40 40" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#FF5E00', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'#00B2FF', stopOpacity:1}} />
                </linearGradient>
              </defs>
              <polygon 
                points="20,2 38,14 38,26 20,38 2,26 2,14" 
                fill="none" 
                stroke="url(#logoGradient)" 
                strokeWidth="2"
              />
              <polygon 
                points="20,8 32,16 32,24 20,32 8,24 8,16" 
                fill="url(#logoGradient)" 
                opacity="0.3"
              />
              <circle cx="20" cy="20" r="3" fill="url(#logoGradient)"/>
            </svg>
            <span style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: windowWidth < 768 ? '20px' : '24px',
              fontWeight: '900',
              background: 'linear-gradient(45deg, #FF5E00, #00B2FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'glow 2s ease-in-out infinite',
              textShadow: '0 0 30px rgba(255, 94, 0, 0.5)'
            }}>
              MYHOUSE
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: windowWidth < 768 ? '8px' : '20px',
            alignItems: 'center'
          }}>
            {user ? (
              <button
                onClick={() => router.push('/home')}
                className="cyber-btn cyber-btn-primary"
                style={{ fontSize: windowWidth < 768 ? '12px' : '14px' }}
              >
                대시보드
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="cyber-btn cyber-btn-secondary"
                  style={{ fontSize: windowWidth < 768 ? '12px' : '14px' }}
                >
                  로그인
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="cyber-btn cyber-btn-primary"
                  style={{ fontSize: windowWidth < 768 ? '12px' : '14px' }}
                >
                  가입하기
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: windowWidth < 768 ? '80px 20px 20px' : '80px 20px 20px',
        zIndex: 10
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '1200px',
          animation: 'fade-in-up 1s ease-out',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Text Rotator */}
          <div style={{
            position: 'relative',
            minHeight: windowWidth < 768 ? '120px' : '160px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            {textSets.map((textSet, index) => (
              <div 
                key={index}
                style={{
                  position: 'absolute',
                  width: '100%',
                  opacity: currentText === index ? 1 : 0,
                  transition: 'opacity 0.8s ease-in-out',
                  display: currentText === index ? 'block' : 'none'
                }}
              >
                <h1 
                  className="glitch-text"
                  data-text={textSet.title}
                  style={{
                    fontSize: windowWidth < 768 ? 'clamp(1.8rem, 8vw, 3.2rem)' : 'clamp(2.6rem, 10vw, 4.5rem)',
                    margin: 0,
                    marginBottom: '20px'
                  }}
                >
                  {textSet.title}
                </h1>
                <p style={{
                  fontSize: windowWidth < 768 ? '1.1rem' : '1.5rem',
                  margin: '20px 0',
                  opacity: 0.8,
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                  fontWeight: 300,
                  fontFamily: 'Pretendard, sans-serif'
                }}>
                  {textSet.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: windowWidth < 768 ? '15px' : '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            {!user && (
              <>
                <button
                  onClick={() => router.push('/register')}
                  className="cyber-btn cyber-btn-primary"
                  style={{
                    fontSize: windowWidth < 768 ? '14px' : '16px',
                    padding: windowWidth < 768 ? '12px 24px' : '16px 32px'
                  }}
                >
                  지금 시작하기
                </button>
                <button
                  onClick={() => router.push('/auth')}
                  className="cyber-btn cyber-btn-secondary"
                  style={{
                    fontSize: windowWidth < 768 ? '14px' : '16px',
                    padding: windowWidth < 768 ? '12px 24px' : '16px 32px'
                  }}
                >
                  더 알아보기
                </button>
              </>
            )}
            {user && (
              <button
                onClick={() => router.push('/home')}
                className="cyber-btn cyber-btn-primary"
                style={{
                  fontSize: windowWidth < 768 ? '14px' : '16px',
                  padding: windowWidth < 768 ? '12px 24px' : '16px 32px'
                }}
              >
                대시보드로 이동
              </button>
            )}
          </div>
        </div>

        {/* Features Preview */}
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: windowWidth < 768 ? '20px' : '40px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: '800px',
          padding: '0 20px'
        }}>
          {[
            { icon: '🏠', text: '청약 관리', link: '/home' },
            { icon: '🧮', text: '대출 계산', link: '/loan-calculator' },
            { icon: '📅', text: '일정 관리', link: '/calendar' },
            { icon: '📄', text: '서류 체크', link: '/documents' },
            { icon: '📝', text: '정보글 게시판', link: '/board' }
          ].map((feature, index) => (
            <Link 
              href={feature.link}
              key={index}
              className="cyber-card"
              style={{
                padding: windowWidth < 768 ? '12px 16px' : '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: windowWidth < 768 ? '12px' : '14px',
                fontFamily: 'Pretendard, sans-serif',
                fontWeight: 500,
                minWidth: windowWidth < 768 ? '120px' : '140px',
                justifyContent: 'center',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <span style={{ fontSize: windowWidth < 768 ? '16px' : '18px' }}>
                {feature.icon}
              </span>
              <span>{feature.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% { 
            filter: brightness(1);
            text-shadow: 0 0 30px rgba(255, 94, 0, 0.5);
          }
          50% { 
            filter: brightness(1.5);
            text-shadow: 0 0 40px rgba(255, 94, 0, 0.8);
          }
        }

        @media (max-width: 768px) {
          .cyber-btn {
            padding: 10px 20px !important;
            font-size: 12px !important;
          }
          
          .shape-circle,
          .shape-triangle,
          .shape-square {
            transform: scale(0.6);
          }
        }
      `}</style>
    </div>
  );
}