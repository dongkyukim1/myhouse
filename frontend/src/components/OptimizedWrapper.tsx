"use client";

import React, { ReactNode, useEffect } from 'react';

interface OptimizedWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function OptimizedWrapper({ children, className = "" }: OptimizedWrapperProps) {
  useEffect(() => {
    // Passive event listeners 설정
    const handleScroll = () => {
      // 스크롤 처리 로직 (필요시)
    };

    const handleResize = () => {
      // 리사이즈 처리 로직 (필요시)
    };

    // Passive 옵션으로 이벤트 리스너 등록
    const scrollOptions: AddEventListenerOptions = { passive: true };
    const resizeOptions: AddEventListenerOptions = { passive: true };

    window.addEventListener('scroll', handleScroll, scrollOptions);
    window.addEventListener('resize', handleResize, resizeOptions);

    // YouTube 임베드 최적화
    const optimizeYouTubeIframes = () => {
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      iframes.forEach((iframe) => {
        const element = iframe as HTMLIFrameElement;
        
        // lazy loading 추가
        element.loading = 'lazy';
        
        // 불필요한 기능 비활성화
        if (element.src) {
          const url = new URL(element.src);
          url.searchParams.set('modestbranding', '1');
          url.searchParams.set('rel', '0');
          url.searchParams.set('showinfo', '0');
          element.src = url.toString();
        }
      });
    };

    // MutationObserver로 동적으로 추가되는 iframe 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'IFRAME' && element.getAttribute('src')?.includes('youtube.com')) {
                const iframe = element as HTMLIFrameElement;
                iframe.loading = 'lazy';
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 초기 최적화 실행
    optimizeYouTubeIframes();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`scroll-container prevent-layout-shift ${className}`}>
      {children}
    </div>
  );
}
