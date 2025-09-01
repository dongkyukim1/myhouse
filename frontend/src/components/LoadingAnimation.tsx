"use client";

import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '@/app/asset/Loading Percent.json';

interface LoadingAnimationProps {
  size?: number;
  text?: string;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LoadingAnimation({
  size = 120,
  text = "로딩 중...",
  showText = true,
  className = "",
  style = {}
}: LoadingAnimationProps) {
  return (
    <div 
      className={`loading-animation-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        ...style
      }}
    >
      <div style={{
        width: size,
        height: size,
      }}>
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          autoplay={true}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      
      {showText && (
        <p style={{
          fontSize: '16px',
          fontFamily: 'Pretendard-Medium',
          color: '#666',
          margin: 0,
          textAlign: 'center'
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

// 전체 화면 로딩 컴포넌트
interface FullScreenLoadingProps {
  text?: string;
  backgroundColor?: string;
  size?: number;
}

export function FullScreenLoading({
  text = "로딩 중...",
  backgroundColor = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  size = 120
}: FullScreenLoadingProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: backgroundColor,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <LoadingAnimation 
          size={size}
          text={text}
          showText={true}
        />
      </div>
    </div>
  );
}

// 인라인 로딩 컴포넌트 (기존 스피너 스타일과 유사한 크기)
export function InlineLoading({
  text = "로딩 중...",
  size = 80
}: {
  text?: string;
  size?: number;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '20px'
    }}>
      <LoadingAnimation 
        size={size}
        text={text}
        showText={true}
      />
    </div>
  );
}
