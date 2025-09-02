"use client";

import { useState } from 'react';
import Swal from 'sweetalert2';

export default function AdminSyncPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  // 데이터베이스 상태 확인
  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/db/sync');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('상태 확인 실패:', error);
      await Swal.fire({
        title: '❌ 오류',
        text: '상태 확인에 실패했습니다.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 데이터베이스 동기화 실행
  const syncDatabase = async () => {
    const result = await Swal.fire({
      title: '🔄 데이터베이스 동기화',
      text: '정말 데이터베이스를 동기화하시겠습니까?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '동기화 실행',
      cancelButtonText: '취소'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch('/api/db/sync', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: '✅ 동기화 완료',
          text: '데이터베이스 동기화가 성공적으로 완료되었습니다.',
          icon: 'success'
        });
        // 상태 새로고침
        await checkStatus();
      } else {
        throw new Error(data.error || '동기화 실패');
      }
    } catch (error: any) {
      console.error('동기화 실패:', error);
      await Swal.fire({
        title: '❌ 동기화 실패',
        text: error.message || '동기화 중 오류가 발생했습니다.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      color: '#fff'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontFamily: 'Pretendard-Bold',
          marginBottom: '16px'
        }}>
          🔧 데이터베이스 관리
        </h1>
        
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          marginBottom: '40px'
        }}>
          Neon 데이터베이스 동기화 및 상태 관리
        </p>

        {/* 컨트롤 버튼 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <button
            onClick={checkStatus}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'Pretendard-Medium',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '확인 중...' : '📊 상태 확인'}
          </button>

          <button
            onClick={syncDatabase}
            disabled={loading}
            style={{
              background: 'rgba(34, 197, 94, 0.3)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'Pretendard-Medium',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '동기화 중...' : '🔄 DB 동기화'}
          </button>
        </div>

        {/* 상태 표시 */}
        {status && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontFamily: 'Pretendard-SemiBold',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              📋 데이터베이스 상태
            </h3>

            {status.success ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>✅ 생성된 테이블:</strong>
                  <div style={{ marginTop: '8px', marginLeft: '16px' }}>
                    {status.status?.tables_created?.map((table: string) => (
                      <div key={table} style={{ 
                        background: 'rgba(34, 197, 94, 0.2)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        margin: '4px',
                        fontSize: '12px'
                      }}>
                        {table}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <strong>📂 카테고리 수:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {status.status?.categories_count || 0}개
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <strong>📝 게시글 수:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {status.status?.posts_count || 0}개
                  </span>
                </div>

                <div style={{ fontSize: '12px', opacity: 0.7, textAlign: 'center' }}>
                  마지막 확인: {new Date(status.status?.last_check).toLocaleString('ko-KR')}
                </div>
              </div>
            ) : (
              <div style={{ color: '#ef4444' }}>
                ❌ 오류: {status.error}
              </div>
            )}
          </div>
        )}

        {/* 안내 메시지 */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px',
          fontSize: '14px',
          lineHeight: 1.6
        }}>
          <strong>📌 사용 안내:</strong><br/>
          1. <strong>상태 확인</strong>: 현재 데이터베이스 테이블과 데이터 현황 확인<br/>
          2. <strong>DB 동기화</strong>: 테이블 생성 + 초기 카테고리 + 관리자 공지사항 생성<br/>
          3. 동기화는 <strong>한 번만 실행</strong>하시면 됩니다 (중복 실행 시 안전하게 처리됨)
        </div>
      </div>
    </div>
  );
}
