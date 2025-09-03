"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface GoogleAdsenseProps {
  slot: string;
  style?: React.CSSProperties;
  className?: string;
  format?: string;
  // 새로운 정책 준수 props
  isLoading?: boolean;
  hasError?: boolean;
  contentReady?: boolean;
  minContentHeight?: number;
}

export default function GoogleAdsense({ 
  slot, 
  style = {}, 
  className = '',
  format = 'auto',
  isLoading = false,
  hasError = false,
  contentReady = true,
  minContentHeight = 200
}: GoogleAdsenseProps) {
  const pathname = usePathname();

  // 광고 표시 제외 경로 확장
  const excludedPaths = [
    '/',        // 메인 랜딩 페이지
    '/login', 
    '/register', 
    '/auth',
    '/loading',
    '/error',
    '/404',
    '/500'
  ];
  
  // 정책 준수를 위한 광고 표시 조건 강화
  const shouldShowAd = !excludedPaths.includes(pathname) && 
                      !isLoading && 
                      !hasError && 
                      contentReady;

  // 페이지 콘텐츠 검증
  useEffect(() => {
    if (shouldShowAd && typeof window !== 'undefined') {
      // 페이지에 충분한 콘텐츠가 있는지 확인
      const checkContentSufficiency = () => {
        const mainContent = document.querySelector('main');
        const bodyContent = document.body;
        
        // 메인 콘텐츠 영역의 높이 확인
        const contentHeight = mainContent ? mainContent.scrollHeight : bodyContent.scrollHeight;
        
        // 최소 콘텐츠 높이 요구사항
        if (contentHeight < minContentHeight) {
          console.warn('GoogleAdsense: 콘텐츠가 부족하여 광고를 표시하지 않습니다.');
          return false;
        }
        
        // 텍스트 콘텐츠 검증
        const textContent = (mainContent || bodyContent).textContent || '';
        const meaningfulTextLength = textContent.replace(/\s+/g, ' ').trim().length;
        
        // 최소 150자 이상의 의미있는 텍스트 필요
        if (meaningfulTextLength < 150) {
          console.warn('GoogleAdsense: 텍스트 콘텐츠가 부족하여 광고를 표시하지 않습니다.');
          return false;
        }
        
        // 로딩 텍스트가 주요 콘텐츠인지 확인
        const hasLoadingText = textContent.includes('로딩') || 
                              textContent.includes('불러오는 중') ||
                              textContent.includes('loading') ||
                              textContent.includes('처리 중');
        
        if (hasLoadingText && meaningfulTextLength < 300) {
          console.warn('GoogleAdsense: 로딩 상태로 인해 광고를 표시하지 않습니다.');
          return false;
        }
        
        // 에러 텍스트가 주요 콘텐츠인지 확인
        const hasErrorText = textContent.includes('에러') || 
                            textContent.includes('오류') ||
                            textContent.includes('실패') ||
                            textContent.includes('error') ||
                            textContent.includes('없습니다') ||
                            textContent.includes('비어있습니다');
        
        if (hasErrorText && meaningfulTextLength < 400) {
          console.warn('GoogleAdsense: 에러/빈 상태로 인해 광고를 표시하지 않습니다.');
          return false;
        }
        
        return true;
      };
      
      // 콘텐츠 검증 후 광고 로드
      const timer = setTimeout(() => {
        if (checkContentSufficiency()) {
          try {
            // 사용자 경험을 위한 추가 지연
            setTimeout(() => {
              // @ts-ignore
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            }, 500);
          } catch (error) {
            console.error('Google AdSense error:', error);
          }
        }
      }, 1500); // 1.5초 후에 콘텐츠 검증
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowAd, pathname, minContentHeight]);

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

// 정책 준수를 위한 광고 컴포넌트 props 인터페이스
interface AdComponentProps {
  className?: string;
  style?: React.CSSProperties;
  isLoading?: boolean;
  hasError?: boolean;
  contentReady?: boolean;
  minContentHeight?: number;
}

// 배너 광고 컴포넌트 (상단/하단)
export function BannerAd({ 
  className = '', 
  style = {},
  isLoading = false,
  hasError = false,
  contentReady = true,
  minContentHeight = 300
}: AdComponentProps) {
  return (
    <GoogleAdsense
      slot="8551473398"
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
      isLoading={isLoading}
      hasError={hasError}
      contentReady={contentReady}
      minContentHeight={minContentHeight}
    />
  );
}

// 사각형 광고 컴포넌트 (사이드바)
export function SquareAd({ 
  className = '', 
  style = {},
  isLoading = false,
  hasError = false,
  contentReady = true,
  minContentHeight = 400
}: AdComponentProps) {
  return (
    <GoogleAdsense
      slot="8551473398"
      className={className}
      style={{
        width: '300px',
        height: '250px',
        margin: '20px auto',
        ...style
      }}
      format="auto"
      isLoading={isLoading}
      hasError={hasError}
      contentReady={contentReady}
      minContentHeight={minContentHeight}
    />
  );
}

// 인피드 광고 컴포넌트 (목록 사이)
export function InFeedAd({ 
  className = '', 
  style = {},
  isLoading = false,
  hasError = false,
  contentReady = true,
  minContentHeight = 500
}: AdComponentProps) {
  return (
    <GoogleAdsense
      slot="8551473398"
      className={className}
      style={{
        width: '100%',
        height: 'auto',
        minHeight: '120px',
        margin: '30px 0',
        ...style
      }}
      format="auto"
      isLoading={isLoading}
      hasError={hasError}
      contentReady={contentReady}
      minContentHeight={minContentHeight}
    />
  );
}

// 반응형 광고 컴포넌트
export function ResponsiveAd({ 
  className = '', 
  style = {},
  isLoading = false,
  hasError = false,
  contentReady = true,
  minContentHeight = 600
}: AdComponentProps) {
  return (
    <div className={className} style={{ textAlign: 'center', ...style }}>
      <GoogleAdsense
        slot="8551473398"
        style={{
          width: '100%',
          height: 'auto',
          minHeight: '280px'
        }}
        format="auto"
        isLoading={isLoading}
        hasError={hasError}
        contentReady={contentReady}
        minContentHeight={minContentHeight}
      />
    </div>
  );
}
