"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { LogOut, Home, User, Bell, Calculator, List } from "lucide-react";

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

  return (
    <header 
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      <div 
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          padding: "12px 24px"
        }}
      >
        {/* 로고 */}
        <Link 
          href="/" 
          style={{
            fontSize: "24px",
            fontWeight: "800",
            background: "linear-gradient(to right, #ef4444, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textDecoration: "none",
            fontFamily: "Suit, sans-serif"
          }}
        >
          MyHouse
        </Link>

        {/* 네비게이션 - 타이틀 옆에 배치 */}
        <nav 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "14px",
            color: "#d1d5db",
            marginLeft: "40px"
          }}
        >
          <Link 
            href="/" 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#d1d5db",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              transition: "color 0.2s",
              fontFamily: "Suit, sans-serif",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}
          >
            <Home size={16}/> 홈
          </Link>
          <Link 
            href="/my-info" 
            style={{
              color: "#d1d5db",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              transition: "color 0.2s",
              fontFamily: "Suit, sans-serif",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}
          >
            내 정보
          </Link>
          <Link 
            href="/notices" 
            style={{
              color: "#d1d5db",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              transition: "color 0.2s",
              fontFamily: "Suit, sans-serif",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}
          >
            지원 가능 공고
          </Link>
          <Link 
            href="/loan-calculator" 
            style={{
              color: "#d1d5db",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              transition: "color 0.2s",
              fontFamily: "Suit, sans-serif",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}
          >
            예상 지출
          </Link>
          <Link 
            href="/all-summaries" 
            style={{
              color: "#d1d5db",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              transition: "color 0.2s",
              fontFamily: "Suit, sans-serif",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}
          >
            전체 요약
          </Link>
        </nav>

        {/* 우측 버튼들 - 오른쪽 끝으로 밀기 */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginLeft: "auto"
          }}
        >
          {/* 사용자 정보 */}
          {user && (
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#d1d5db"
              }}
            >
              <span style={{ fontFamily: "Suit, sans-serif", fontWeight: "400" }}>
                안녕하세요, <span style={{ fontWeight: "600" }}>{user.name}</span>님!
              </span>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#d1d5db",
                  fontSize: "12px",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  fontFamily: "Suit, sans-serif",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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
                borderRadius: "9999px",
                background: "linear-gradient(to right, #10b981, #3b82f6)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s",
                fontFamily: "Suit, sans-serif"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              ＋ LH 청약
            </a>
            <a
              href="https://www.i-sh.co.kr/app/index.do"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: "9999px",
                background: "linear-gradient(to right, #34d399, #059669)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s",
                fontFamily: "Suit, sans-serif"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              🏠 SH 청약
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
