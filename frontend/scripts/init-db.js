const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔄 데이터베이스 연결 중...');
    
    // 연결 테스트
    await pool.query('SELECT NOW()');
    console.log('✅ 데이터베이스 연결 성공');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '../src/lib/init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 데이터베이스 초기화 중...');
    
    // SQL 실행
    await pool.query(sql);
    
    console.log('✅ 데이터베이스 초기화 완료');
    console.log('📋 생성된 테이블:');
    
    // 테이블 목록 확인
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
