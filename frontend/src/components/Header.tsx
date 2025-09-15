"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { LogOut, Home } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "🚪 로그아웃",
      text: "정말 로그아웃하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "로그아웃",
      cancelButtonText: "취소",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: "#fff",
    });

    if (result.isConfirmed) {
      await logout();
      await Swal.fire({
        title: "👋 안녕히 가세요!",
        text: "로그아웃이 완료되었습니다.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push("/");
    }
  };

  const navLinkStyle = {
    color: "#d1d5db",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    fontFamily: "Pretendard-Medium",
    fontSize: "16px",
    whiteSpace: "nowrap" as const,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid transparent",
    position: "relative" as const,
    overflow: "hidden" as const
  };

  const handleNavHover = (e: React.MouseEvent<HTMLAnchorElement>, isEnter: boolean) => {
    if (isEnter) {
      e.currentTarget.style.color = "#ffffff";
      e.currentTarget.style.background = "rgba(255, 94, 0, 0.1)";
      e.currentTarget.style.borderColor = "rgba(255, 94, 0, 0.3)";
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 94, 0, 0.3)";
    } else {
      e.currentTarget.style.color = "#d1d5db";
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.borderColor = "transparent";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }
  };

  return (
    <header 
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(15px)",
        borderBottom: "1px solid rgba(255, 94, 0, 0.2)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 50px rgba(255, 94, 0, 0.1)"
      }}
    >
      <div 
        style={{
          maxWidth: "2000px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "220px 1fr 350px",
          alignItems: "center",
          padding: "16px 40px",
          minHeight: "85px",
          gap: "50px"
        }}
      >
        {/* 좌측: 로고 */}
        <Link 
          href="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg 
            style={{ width: '40px', height: '40px' }}
            viewBox="0 0 40 40" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="headerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#FF5E00', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#00B2FF', stopOpacity:1}} />
              </linearGradient>
            </defs>
            <polygon 
              points="20,2 38,14 38,26 20,38 2,26 2,14" 
              fill="none" 
              stroke="url(#headerLogoGradient)" 
              strokeWidth="2"
            />
            <polygon 
              points="20,8 32,16 32,24 20,32 8,24 8,16" 
              fill="url(#headerLogoGradient)" 
              opacity="0.3"
            />
            <circle cx="20" cy="20" r="3" fill="url(#headerLogoGradient)"/>
          </svg>
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: "24px",
            fontWeight: "900",
            background: "linear-gradient(45deg, #FF5E00, #00B2FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            whiteSpace: "nowrap",
            textShadow: '0 0 20px rgba(255, 94, 0, 0.5)'
          }}>
            MYHOUSE
          </span>
        </Link>

        {/* 중앙: 네비게이션 */}
        <nav 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            padding: "4px"
          }}
        >
          <Link 
            href="/" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            <Home size={18}/> 홈
          </Link>
          <Link 
            href="/my-info" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            내 정보
          </Link>
          <Link 
            href="/notices" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            지원 가능 공고
          </Link>
          <Link 
            href="/loan-calculator" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            🧮 대출계산기
          </Link>
          <Link 
            href="/calendar" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            📅 청약일정
          </Link>
          <Link 
            href="/documents" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            📄 서류체크
          </Link>
          <Link 
            href="/all-summaries" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            📺 전체 요약
          </Link>
          <Link 
            href="/openbanking" 
            style={{
              ...navLinkStyle,
              background: "linear-gradient(135deg, rgba(255, 94, 0, 0.1) 0%, rgba(0, 178, 255, 0.1) 100%)",
              border: "1px solid rgba(255, 94, 0, 0.3)",
              color: "#FF5E00",
              boxShadow: "0 0 15px rgba(255, 94, 0, 0.2)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 94, 0, 0.2) 0%, rgba(0, 178, 255, 0.2) 100%)";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = "#FF5E00";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 0 25px rgba(255, 94, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 94, 0, 0.1) 0%, rgba(0, 178, 255, 0.1) 100%)";
              e.currentTarget.style.color = "#FF5E00";
              e.currentTarget.style.borderColor = "rgba(255, 94, 0, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 94, 0, 0.2)";
            }}
          >
            🏦 오픈뱅킹
          </Link>
          <Link 
            href="/real-estate-stats" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            📊 부동산통계
          </Link>
          <Link 
            href="/board" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            📝 정보글
          </Link>
        </nav>

        {/* 우측: 사용자 정보 + 청약 버튼들 */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "16px"
          }}
        >
          {/* 사용자 정보 */}
          {user && (
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "15px",
                color: "#d1d5db",
                borderLeft: "1px solid rgba(255, 94, 0, 0.2)",
                paddingLeft: "16px"
              }}
            >
              <span style={{ 
                fontFamily: "Pretendard-Medium", 
                whiteSpace: "nowrap"
              }}>
                안녕하세요, <span style={{ 
                  fontFamily: "Pretendard-SemiBold",
                  color: "#FF5E00",
                  textShadow: "0 0 10px rgba(255, 94, 0, 0.5)"
                }}>{user.name}</span>님!
              </span>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 94, 0, 0.3)",
                  color: "#d1d5db",
                  fontSize: "14px",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontFamily: "Pretendard-Medium",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "#ef4444";
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255, 94, 0, 0.3)";
                  e.currentTarget.style.color = "#d1d5db";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <LogOut size={16}/> 로그아웃
              </button>
            </div>
          )}

          {/* 청약 버튼들 */}
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <a
              href="https://apply.lh.or.kr/lhapply/apply/main.do?mi=1021"
              target="_blank"
              rel="noreferrer"
              className="cyber-btn"
              style={{
                padding: "10px 18px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
                fontFamily: "Pretendard-SemiBold",
                whiteSpace: "nowrap",
                border: "1px solid rgba(16, 185, 129, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(16, 185, 129, 0.5)";
                e.currentTarget.style.borderColor = "#10b981";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.3)";
                e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
              }}
            >
              ＋ LH 청약
            </a>
            <a
              href="https://www.i-sh.co.kr/app/index.do"
              target="_blank"
              rel="noreferrer"
              className="cyber-btn"
              style={{
                padding: "10px 18px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #34d399, #059669)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)",
                transition: "all 0.3s ease",
                fontFamily: "Pretendard-SemiBold",
                whiteSpace: "nowrap",
                border: "1px solid rgba(52, 211, 153, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(52, 211, 153, 0.5)";
                e.currentTarget.style.borderColor = "#34d399";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(52, 211, 153, 0.3)";
                e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.3)";
              }}
            >
              🏠 SH 청약
            </a>
          </div>
        </div>
      </div>

      {/* 반응형 미디어 쿼리 및 스크롤바 숨김 */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          display: none;
        }
        nav {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        @media (max-width: 1400px) {
          .header-container {
            grid-template-columns: 200px 1fr 300px;
            gap: 30px;
            padding: 14px 30px;
          }
        }
        
        @media (max-width: 1200px) {
          .header-container {
            grid-template-columns: 180px 1fr 280px;
            gap: 24px;
            padding: 12px 24px;
          }
        }
        
        @media (max-width: 768px) {
          .header-container {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            gap: 12px;
            padding: 12px 16px;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
}