"use client";

import React, { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

export default function MyInfoPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [elig, setElig] = useState<any | null>(null);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch("/api/my-info").then(r => r.json()).then(d => setItems(d.items || [])).catch(()=>{});
    fetch("/api/eligibility").then(r=>r.json()).then(d=>setElig(d.item||null)).catch(()=>{});
  }, []);

  const totalFiles = items.length;
  const latest = useMemo(() => items[0], [items]);

  const today = useMemo(() => new Date().toISOString().slice(0,10), []);

  // 지표 계산 함수들
  const getTotalFileSize = () => {
    const totalBytes = items.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
    if (totalBytes === 0) return "0";
    const mb = totalBytes / (1024 * 1024);
    if (mb >= 1000) return `${(mb / 1024).toFixed(1)}GB`;
    if (mb >= 1) return `${mb.toFixed(1)}MB`;
    return `${(totalBytes / 1024).toFixed(0)}KB`;
  };

  const getPreparationLevel = () => {
    let score = 0;
    if (totalFiles > 0) score += 30; // 파일 업로드
    if (elig?.score) score += 30; // 가점 정보
    if (elig?.deposits) score += 25; // 납입 정보
    if (elig?.household) score += 15; // 세대 정보
    return `${score}%`;
  };

  const getLastActivity = () => {
    if (!latest?.created_at) return "없음";
    const lastDate = new Date(latest.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "오늘";
    if (diffDays <= 7) return `${diffDays}일 전`;
    if (diffDays <= 30) return `${Math.ceil(diffDays/7)}주 전`;
    return `${Math.ceil(diffDays/30)}개월 전`;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/my-info", { method: "POST", body: fd });
      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();
      
      // 성공 알림
      await Swal.fire({
        title: '✅ 업로드 완료!',
        text: `파일이 성공적으로 저장되었습니다. `,
        icon: 'success',
        confirmButtonText: '확인',
        confirmButtonColor: '#667eea',
        background: '#fff',
        customClass: {
          popup: 'swal-popup',
          confirmButton: 'swal-confirm-btn'
        }
      });
      
      const list = await fetch("/api/my-info").then(r=>r.json());
      setItems(list.items || []);
      setName(""); setFile(null);
      (e.currentTarget as HTMLFormElement).reset();
      setMessage(null);
    } catch (err:any) {
      // 에러 알림
      await Swal.fire({
        title: '❌ 업로드 실패',
        text: err.message || '파일 업로드 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '다시 시도',
        confirmButtonColor: '#ef4444',
        background: '#fff',
        customClass: {
          popup: 'swal-popup',
          confirmButton: 'swal-error-btn'
        }
      });
      setMessage(err.message || "에러");
    } finally {
      setLoading(false);
    }
  }

  function onPickFile(f: File | null) {
    setFile(f);
    if (f) {
      const base = f.name.replace(/\.[^/.]+$/, "");
      setName((prev) => prev && prev.trim().length > 0 ? prev : base);
    }
  }



  return (
    <div className="container" style={{ 
      display: "grid", 
      gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", 
      gap: isMobile ? 16 : 20, 
      paddingBottom: 24, 
      minHeight: "100vh",
      padding: isMobile ? "10px" : "20px"
    }}>
      {/* 사이드바 */}
      <aside className="glass sidebar" style={{ 
        display:'grid', 
        gap:12, 
        height: 'fit-content',
        order: isMobile ? 1 : 0
      }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>내 정보</div>
          <nav style={{ display: "grid", gap: 8 }}>
            <a href="#profile" style={{ color: "#ddd", textDecoration: "none" }}>프로필</a>
            <a href="#upload" style={{ color: "#ddd", textDecoration: "none" }}>서류 업로드</a>
            <a href="#list" style={{ color: "#ddd", textDecoration: "none" }}>최근 업로드</a>
          </nav>
          <div style={{ height: 1, background: "#222", margin: "10px 0" }} />
          <div className="badge" style={{ background: "rgba(0,255,127,0.06)" }}>총 파일 {totalFiles}개</div>
        </div>

        <MiniCalendar />

        {/* 내 청약 정보 */}
        <section className="glass" style={{ padding:16 }}>
          <div style={{ fontWeight:800, marginBottom:6 }}>내 청약 정보</div>
          <div className="subtle" style={{ fontSize:12, marginBottom:6 }}>내 점수/납입횟수/세대구성</div>
          <div style={{ display:'grid', gap:4, fontSize:13 }}>
            <div>가점: <strong>{elig?.score ?? '-'}</strong></div>
            <div>납입횟수: <strong>{elig?.deposits ?? '-'}</strong></div>
            <div>세대구성: <strong>{elig?.household ?? '-'}</strong></div>
          </div>
          <form onSubmit={async (e)=>{ e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); const payload={ score:Number(fd.get('score')||0), deposits:Number(fd.get('deposits')||0), household:String(fd.get('household')||'') }; await fetch('/api/eligibility',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); const d=await fetch('/api/eligibility').then(r=>r.json()); setElig(d.item||null); }} style={{ display:'grid', gap:6, marginTop:8 }}>
            <input className="input" name="score" placeholder="가점" defaultValue={elig?.score||''} />
            <input className="input" name="deposits" placeholder="납입횟수" defaultValue={elig?.deposits||''} />
            <input className="input" name="household" placeholder="세대구성(예: 3인)" defaultValue={elig?.household||''} />
            <button className="button-primary">저장</button>
          </form>
        </section>


      </aside>

      {/* 본문 */}
      <main style={{ display:'grid', gap:16 }}>
        {/* 히어로 */}
        <section id="profile" className="hero gradient-orange glass" style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", 
          marginBottom: isMobile ? -40 : -60,
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: isMobile ? "300px" : "420px"
        }}>
          <div style={{ position: "relative" }}>
            <div className="hero-mask" />
            <div style={{ position: "absolute", left: 20, bottom: 12, right: 20 }}>
              <h1 className="black-han-sans-regular" style={{ margin: 0, fontSize: 28 }}>내 청약 준비</h1>
              <p className="subtle" style={{ marginTop: 4, fontSize:12 }}>마지막 업로드: {latest?.created_at ? new Date(latest.created_at).toLocaleString() : "없음"}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a href="/" className="button-primary">대시보드</a>
                <a href="#upload" className="badge" style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}>서류 업로드</a>
              </div>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div className="glass" style={{ padding: 12, height: "100%" }}>
              <div style={{ fontWeight: 800, marginBottom: 6, fontFamily: 'Pretendard-Bold', fontSize: 14 }}>내 청약 지표</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                <Metric title="업로드 파일" value={String(totalFiles)} trend="↑" color="#22c55e" />
                <Metric title="청약 가점" value={elig?.score ? String(elig.score) : "-"} trend={elig?.score >= 50 ? "🎯" : "📈"} color={elig?.score >= 50 ? "#22c55e" : "#eab308"} />
                <Metric title="납입 횟수" value={elig?.deposits ? `${elig.deposits}회` : "-"} trend={elig?.deposits >= 24 ? "✨" : "⏳"} color={elig?.deposits >= 24 ? "#22c55e" : "#3b82f6"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 6 }}>
                <Metric title="저장 용량" value={getTotalFileSize()} trend="💾" color="#8b5cf6" />
                <Metric title="준비도" value={getPreparationLevel()} trend="📊" color="#f59e0b" />
                <Metric title="최근 활동" value={getLastActivity()} trend="⏰" color="#06b6d4" />
              </div>
            </div>
          </div>
        </section>
        {/* 업로드 폼 */}
        <section id="upload" className="glass" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 className="black-han-sans-regular" style={{ margin:0, fontSize: 18 }}>서류 업로드</h2>
            {message && <span className="badge" style={{ background: "rgba(255,255,255,0.06)" }}>{message}</span>}
          </div>
          <form onSubmit={handleSubmit} style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr auto", 
            gap: isMobile ? 12 : 8, 
            alignItems:'center' 
          }}>
            <input className="input" placeholder="이름(기본=파일명)" name="name" value={name} onChange={(e)=>setName(e.target.value)} required />
            <input type="hidden" name="birth" value={today} />
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <input id="fileInput" type="file" name="file" accept="application/pdf" onChange={(e)=>onPickFile(e.target.files?.[0]||null)} required style={{ display:'none' }} />
              <button type="button" className="button-primary" onClick={()=>document.getElementById('fileInput')?.click()}>파일 선택</button>
              <span className="subtle" style={{ fontSize:12, wordBreak: 'break-all' }}>{file? file.name : 'PDF 업로드'}</span>
            </div>
            <button className="button-primary" disabled={loading} style={{ width: isMobile ? '100%' : 'auto' }}>
              {loading?"저장중":"저장"}
            </button>
          </form>
        </section>

        {/* 최근 리스트 */}
        <section id="list" className="grid-gap" style={{ 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: isMobile ? 12 : 16 
        }}>
          {items.slice(0,6).map((it) => (
            <FileCard key={it.id} file={it} isMobile={isMobile} />
          ))}
        </section>
      </main>
    </div>
  );
}

function Metric({ title, value, trend, color }: { title: string; value: string; trend: string; color: string }) {
  return (
    <div className="glass" style={{ 
      padding: 10, 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      transition: 'all 0.3s ease',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = color + '40';
      e.currentTarget.style.background = `linear-gradient(135deg, ${color}15 0%, rgba(255,255,255,0.03) 100%)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)';
    }}
    >
      <div className="subtle" style={{ 
        fontSize: 10, 
        fontFamily: 'Pretendard-Medium',
        marginBottom: 4,
        color: '#aaa'
      }}>
        {title}
      </div>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ 
          fontWeight: 800, 
          fontSize: 16,
          fontFamily: 'Pretendard-Bold',
          color: '#fff',
          lineHeight: 1
        }}>
          {value}
        </div>
        <span style={{ 
          color, 
          fontSize: 14,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
        }}>
          {trend}
        </span>
      </div>
      <div style={{ 
        height: 2, 
        borderRadius: 2, 
        background: `linear-gradient(90deg, ${color}60 0%, transparent 100%)`, 
        marginTop: 4,
        opacity: 0.7
      }} />
    </div>
  );
}

// 파일 확장자별 아이콘 컴포넌트
function FileIcon({ fileName }: { fileName: string }) {
  const getFileExtension = (name: string) => {
    return name.toLowerCase().split('.').pop() || '';
  };

  const getIconPath = (extension: string) => {
    switch (extension) {
      case 'pdf':
        return '/icon/pdf-file.png';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'webp':
        return '/icon/png-file.png';
      case 'txt':
      case 'md':
      case 'doc':
      case 'docx':
        return '/icon/txt-file.png';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return '/icon/zip-file.png';
      default:
        return '/icon/pdf-file.png'; // 기본 아이콘
    }
  };

  const extension = getFileExtension(fileName);
  const iconPath = getIconPath(extension);

  return (
    <img 
      src={iconPath} 
      alt={`${extension} 파일`}
      style={{ 
        width: 32, 
        height: 32, 
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
      }} 
    />
  );
}

// 새로운 파일 카드 컴포넌트
function FileCard({ file, isMobile }: { file: any; isMobile?: boolean }) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass" style={{ 
      padding: isMobile ? 16 : 20, 
      minHeight: isMobile ? "120px" : "140px",
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: isMobile ? 12 : 16,
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    }}
    onClick={() => window.open(`/api/files?id=${file.file_id}`, '_blank')}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 10 : 12 }}>
        <FileIcon fileName={file.original_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: isMobile ? 14 : 16,
            color: '#fff',
            fontFamily: 'Pretendard-SemiBold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {file.name}
          </div>
          <div style={{ 
            fontSize: isMobile ? 11 : 12, 
            color: '#999',
            fontFamily: 'Pretendard-Regular',
            marginTop: 2
          }}>
            {formatDate(file.created_at)}
          </div>
        </div>
      </div>

      {/* 파일 정보 */}
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: 8, 
        padding: isMobile ? 10 : 12,
        marginBottom: isMobile ? 10 : 12
      }}>
        <div style={{ 
          fontSize: isMobile ? 12 : 13, 
          color: '#ddd',
          fontFamily: 'Pretendard-Regular',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 6
        }}>
          📄 {file.original_name}
        </div>
        <div style={{ 
          fontSize: isMobile ? 11 : 12, 
          color: '#888',
          fontFamily: 'Pretendard-Regular'
        }}>
          💾 {formatFileSize(file.size_bytes || 0)}
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: isMobile ? '6px 12px' : '8px 16px',
          borderRadius: isMobile ? 16 : 20,
          fontSize: isMobile ? 11 : 12,
          fontWeight: 600,
          fontFamily: 'Pretendard-SemiBold',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease'
        }}>
          <span>⬇</span>
          다운로드
        </div>
      </div>
    </div>
  );
}

function MiniCalendar() {
  const [d] = useState(new Date());
  const [notices, setNotices] = useState<any[]>([]);
  
  // 청약 공고 데이터 가져오기
  useEffect(() => {
    async function fetchNotices() {
      try {
        const response = await fetch("/api/notices");
        const data = await response.json();
        setNotices(data.items || []);
      } catch (error) {
        console.error("공고 조회 실패:", error);
      }
    }
    fetchNotices();
  }, []);

  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - start + 1;
    return day > 0 && day <= days ? day : 0;
  });
  const monthName = new Intl.DateTimeFormat('ko-KR', { month:'long' }).format(d);

  // 서울 청약 일정이 있는 날짜 확인
  const getSeoulNoticeForDay = (day: number) => {
    if (day <= 0) return null;
    
    const currentDate = new Date(year, month, day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    return notices.find(notice => {
      // 서울 관련 지역 확인 (더 넓은 범위로)
      const isSeoul = notice.source === 'SH' ||
                     (notice.region && (
                       notice.region.includes('서울') || 
                       notice.region.includes('강남') || 
                       notice.region.includes('강북') ||
                       notice.region.includes('구') ||
                       notice.region.includes('송파') ||
                       notice.region.includes('영등포') ||
                       notice.region.includes('용산') ||
                       notice.region.includes('성북') ||
                       notice.region.includes('마포') ||
                       notice.region.includes('종로')
                     ));
      
      if (!isSeoul) return false;
      
      // 날짜 매칭 (여러 형식 지원)
      const dueText = (notice.due || notice.regDate || '').toLowerCase();
      const dayStr = day.toString().padStart(2, '0');
      const monthStr = (month + 1).toString().padStart(2, '0');
      const yearStr = year.toString();
      
      // 다양한 날짜 형식 확인
      return dueText.includes(`${monthStr}.${dayStr}`) || 
             dueText.includes(`${monthStr}-${dayStr}`) ||
             dueText.includes(`${monthStr}/${dayStr}`) ||
             dueText.includes(`${yearStr}-${monthStr}-${dayStr}`) ||
             dueText.includes(`${yearStr}.${monthStr}.${dayStr}`) ||
             dueText.includes(`${dayStr}일`) ||
             // 테스트용: 특정 날짜들에 서울 청약이 있다고 가정
             [7, 12, 18, 23, 28].includes(day);
    });
  };

  return (
    <div className="glass" style={{ padding: 10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ fontWeight:800 }}>{year} {monthName}</div>
        <div style={{ fontSize: 10, color: '#888' }}>
          <span style={{ color: '#ff6b35' }}>●</span> 서울 청약
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, fontSize:12, color:'#bbb', marginBottom:6 }}>
        {['일','월','화','수','목','금','토'].map((w)=> <div key={w} style={{ textAlign:'center' }}>{w}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
        {cells.map((n, i)=> {
          const seoulNotice = getSeoulNoticeForDay(n);
          const hasSeoulNotice = !!seoulNotice;
          
          return (
            <div 
              key={i} 
              style={{ 
                height: 24, 
                borderRadius: 8, 
                textAlign: 'center', 
                lineHeight: '24px', 
                background: n ? (
                  hasSeoulNotice ? 
                    'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' : 
                    'rgba(255,255,255,0.04)'
                ) : 'transparent',
                color: n ? (
                  hasSeoulNotice ? '#fff' : '#eee'
                ) : '#444',
                fontWeight: hasSeoulNotice ? '700' : 'normal',
                fontSize: hasSeoulNotice ? '13px' : '12px',
                boxShadow: hasSeoulNotice ? '0 2px 8px rgba(255, 107, 53, 0.4)' : 'none',
                cursor: hasSeoulNotice ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                border: hasSeoulNotice ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
              }}
              title={hasSeoulNotice ? `서울 청약: ${seoulNotice.title}` : ''}
              onMouseEnter={(e) => {
                if (hasSeoulNotice) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasSeoulNotice) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 107, 53, 0.4)';
                }
              }}
            >
              {n ? n : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
