"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface GoogleAdsenseProps {
  slot: string;
  style?: React.CSSProperties;
  className?: string;
  format?: string;
}

export default function GoogleAdsense({ 
  slot, 
  style = {}, 
  className = '',
  format = 'auto' 
}: GoogleAdsenseProps) {
  const pathname = usePathname();

  // 로그인/회원가입 페이지에서는 광고를 표시하지 않음
  const excludedPaths = ['/login', '/register', '/auth'];
  const shouldShowAd = !excludedPaths.includes(pathname);

  useEffect(() => {
    if (shouldShowAd && typeof window !== 'undefined') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('Google AdSense error:', error);
      }
    }
  }, [shouldShowAd, pathname]);

  if (!shouldShowAd) {
    return null;
  }

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client="ca-pub-7917639855075179"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// 배너 광고 컴포넌트 (상단/하단)
export function BannerAd({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <GoogleAdsense
      slot="1234567890" // 실제 슬롯 ID로 교체 필요
      className={className}
      style={{
        width: '100%',
        height: 'auto',
        minHeight: '90px',
        marginTop: '20px',
        marginBottom: '20px',
        ...style
      }}
      format="auto"
    />
  );
}

// 사각형 광고 컴포넌트 (사이드바)
export function SquareAd({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <GoogleAdsense
      slot="0987654321" // 실제 슬롯 ID로 교체 필요
      className={className}
      style={{
        width: '300px',
        height: '250px',
        margin: '20px auto',
        ...style
      }}
      format="rectangle"
    />
  );
}

// 인피드 광고 컴포넌트 (목록 사이)
export function InFeedAd({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <GoogleAdsense
      slot="1357902468" // 실제 슬롯 ID로 교체 필요
      className={className}
      style={{
        width: '100%',
        height: 'auto',
        minHeight: '120px',
        margin: '30px 0',
        ...style
      }}
      format="fluid"
    />
  );
}

// 반응형 광고 컴포넌트
export function ResponsiveAd({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ textAlign: 'center', ...style }}>
      <GoogleAdsense
        slot="2468135790" // 실제 슬롯 ID로 교체 필요
        style={{
          width: '100%',
          height: 'auto',
          minHeight: '280px'
        }}
        format="auto"
      />
    </div>
  );
}
