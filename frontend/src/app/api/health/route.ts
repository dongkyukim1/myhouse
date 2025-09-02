import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const envStatus = {
      timestamp: new Date().toISOString(),
      environment: 'production',
      status: 'healthy',
      checks: {
        database: !!process.env.DATABASE_URL,
        finnhub: !!process.env.FINNHUB_API_KEY,
        krx: !!process.env.KRX_API_KEY,
        jwt: !!process.env.JWT_SECRET,
        openbanking: !!process.env.OPENBANKING_CLIENT_ID
      },
      config: {
        database_host: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.split('@')[1]?.split('/')[0] : 'not_configured',
        finnhub_configured: !!process.env.FINNHUB_API_KEY,
        krx_configured: !!process.env.KRX_API_KEY,
        next_public_api: process.env.NEXT_PUBLIC_API_BASE_URL || 'not_set'
      }
    };

    // 데이터베이스 연결 테스트
    if (process.env.DATABASE_URL) {
      try {
        // 간단한 쿼리로 연결 테스트
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        const result = await pool.query('SELECT NOW() as current_time');
        envStatus.checks = {
          ...envStatus.checks,
          database_connection: true,
          database_time: result.rows[0]?.current_time
        };
        
        await pool.end();
      } catch (dbError: any) {
        envStatus.checks = {
          ...envStatus.checks,
          database_connection: false,
          database_error: dbError.message
        };
      }
    }

    return NextResponse.json(envStatus);

  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message 
      },
      { status: 500 }
    );
  }
}
