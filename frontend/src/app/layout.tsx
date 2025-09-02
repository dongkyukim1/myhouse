import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import ClientLayout from "@/components/ClientLayout";
import OptimizedWrapper from "@/components/OptimizedWrapper";

export const metadata = {
  title: 'MyHouse',
  description: '청약 계산/관리 서비스',
  robots: 'index, follow',
  authors: [{ name: 'MyHouse Team' }],
  keywords: ['청약', '계산기', '주택', '부동산', 'LH', 'SH'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Sans+KR&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7917639855075179"
          crossOrigin="anonymous"
        />
      </head>
      <body className="ibm-plex-sans-kr-regular">
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
