"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isMainPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <>
      {/* Background Effects for all pages except main and auth */}
      {!isMainPage && !isAuthPage && (
        <>
          <div className="grid-bg"></div>
          <div className="gradient-overlay"></div>
          <div className="scanlines"></div>
          <div className="shapes-container">
            <div className="shape shape-circle"></div>
            <div className="shape shape-triangle"></div>
            <div className="shape shape-square"></div>
          </div>
        </>
      )}
      
      {!isMainPage && !isAuthPage && <Header />}
      <div 
        className={isMainPage || isAuthPage ? '' : 'container'} 
        style={{ 
          paddingTop: isMainPage || isAuthPage ? 0 : 16, 
          paddingBottom: isMainPage || isAuthPage ? 0 : 40,
          margin: isMainPage || isAuthPage ? 0 : undefined,
          maxWidth: isMainPage || isAuthPage ? 'none' : undefined,
          position: 'relative',
          zIndex: 10
        }}
      >
        {children}
      </div>
    </>
  );
}
