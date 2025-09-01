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
      {!isMainPage && !isAuthPage && <Header />}
      <div 
        className={isMainPage || isAuthPage ? '' : 'container'} 
        style={{ 
          paddingTop: isMainPage || isAuthPage ? 0 : 16, 
          paddingBottom: isMainPage || isAuthPage ? 0 : 40,
          margin: isMainPage || isAuthPage ? 0 : undefined,
          maxWidth: isMainPage || isAuthPage ? 'none' : undefined
        }}
      >
        {children}
      </div>
    </>
  );
}
