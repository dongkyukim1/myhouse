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
    transition: "all 0.2s ease",
    fontFamily: "Pretendard-Medium",
    fontSize: "14px",
    whiteSpace: "nowrap" as const,
    display: "flex",
    alignItems: "center",
    gap: "6px"
  };

  const handleNavHover = (e: React.MouseEvent<HTMLAnchorElement>, isEnter: boolean) => {
    if (isEnter) {
      e.currentTarget.style.color = "#ffffff";
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
      e.currentTarget.style.transform = "translateY(-1px)";
    } else {
      e.currentTarget.style.color = "#d1d5db";
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.transform = "translateY(0)";
    }
  };

  return (
    <header 
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
      }}
    >
      <div 
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "200px 1fr 300px",
          alignItems: "center",
          padding: "12px 32px",
          minHeight: "70px",
          gap: "40px"
        }}
      >
        {/* 좌측: 로고 */}
        <Link 
          href="/" 
          style={{
            fontSize: "26px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #ef4444, #f472b6, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textDecoration: "none",
            fontFamily: "Pretendard-Bold",
            whiteSpace: "nowrap",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          MyHouse
        </Link>

        {/* 중앙: 네비게이션 */}
        <nav 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
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
            <Home size={16}/> 홈
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
            예상 지출
          </Link>
          <Link 
            href="/all-summaries" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            전체 요약
          </Link>
          <Link 
            href="/openbanking" 
            style={{
              ...navLinkStyle,
              background: "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
              border: "1px solid rgba(102, 126, 234, 0.4)",
              color: "#a5b4fc"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)";
              e.currentTarget.style.color = "#a5b4fc";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            🏦 오픈뱅킹
          </Link>
          <Link 
            href="/stocks" 
            style={navLinkStyle}
            onMouseEnter={(e) => handleNavHover(e, true)}
            onMouseLeave={(e) => handleNavHover(e, false)}
          >
            📈 주식
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
                fontSize: "13px",
                color: "#d1d5db",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                paddingLeft: "16px"
              }}
            >
              <span style={{ 
                fontFamily: "Pretendard-Medium", 
                whiteSpace: "nowrap"
              }}>
                안녕하세요, <span style={{ 
                  fontFamily: "Pretendard-SemiBold",
                  color: "#f472b6"
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
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#d1d5db",
                  fontSize: "12px",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "Pretendard-Medium",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "#ef4444";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "#d1d5db";
                }}
              >
                <LogOut size={14}/> 로그아웃
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
              style={{
                padding: "8px 16px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 3px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
                fontFamily: "Pretendard-SemiBold",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 3px 12px rgba(16, 185, 129, 0.3)";
              }}
            >
              ＋ LH 청약
            </a>
            <a
              href="https://www.i-sh.co.kr/app/index.do"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #34d399, #059669)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 3px 12px rgba(52, 211, 153, 0.3)",
                transition: "all 0.3s ease",
                fontFamily: "Pretendard-SemiBold",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(52, 211, 153, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 3px 12px rgba(52, 211, 153, 0.3)";
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
        
        @media (max-width: 1200px) {
          .header-container {
            grid-template-columns: 180px 1fr 250px;
            gap: 24px;
            padding: 10px 24px;
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