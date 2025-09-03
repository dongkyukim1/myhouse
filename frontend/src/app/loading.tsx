export default function Loading() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      data-no-ads="true" // 광고 표시 방지 마커
    >
      <div className="loading-spinner" />
      {/* 추가 콘텐츠 없음 - 이는 임시 로딩 화면입니다 */}
    </div>
  );
}
