// 성능 최적화 유틸리티
import { useEffect, useRef } from 'react';

// Passive Event Listener Hook
export function usePassiveEventListener<T extends EventTarget>(
  target: T | null,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef<EventListener | null>(null);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const eventListener: EventListener = (event) => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    const passiveOptions = {
      passive: true,
      ...((typeof options === 'object' && options) || {})
    };

    target.addEventListener(event, eventListener, passiveOptions);

    return () => {
      target.removeEventListener(event, eventListener);
    };
  }, [target, event, options]);
}

// 스크롤 성능 최적화
export function useOptimizedScroll(
  handler: (event: Event) => void,
  delay: number = 16
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const optimizedHandler = (event: Event) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        handler(event);
      }, delay);
    };

    // 직접 addEventListener 사용
    const passiveOptions = { passive: true };
    window.addEventListener('scroll', optimizedHandler, passiveOptions);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('scroll', optimizedHandler);
    };
  }, [handler, delay]);
}

// YouTube iframe 성능 최적화
export function optimizeYouTubeEmbed(iframe: HTMLIFrameElement) {
  if (!iframe) return;

  // lazy loading 속성 추가
  iframe.loading = 'lazy';
  
  // 성능을 위한 추가 속성
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  
  // 불필요한 기능 비활성화로 성능 향상
  const src = iframe.src;
  if (src.includes('youtube.com')) {
    const url = new URL(src);
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('showinfo', '0');
    iframe.src = url.toString();
  }
}

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Intersection Observer 최적화
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...options
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [elementRef, callback, options]);
}

