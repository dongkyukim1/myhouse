"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Room {
  id: number;
  title: string;
  description: string;
  room_type: string;
  address: string;
  district: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  monthly_rent: number;
  deposit: number;
  maintenance_fee: number;
  area: number;
  floor: number;
  total_floors: number;
  building_type: string;
  room_count: number;
  bathroom_count: number;
  options: string[];
  images: string[];
  view_count: number;
  status: string;
  available_date: string;
  phone_number: string;
  negotiable: boolean;
  created_at: string;
  owner_name: string;
  owner_phone: string;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 카카오 지도 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=8ca0a58c3aac5ffab32c4d2a43292947&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        setMapLoaded(true);
      });
    };
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 매물 데이터 로드
  useEffect(() => {
    if (params.id) {
      loadRoom();
    }
  }, [params.id]);

  // 지도 초기화
  useEffect(() => {
    if (mapLoaded && room && room.latitude && room.longitude) {
      initializeMap();
    }
  }, [mapLoaded, room]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/rooms/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRoom(data.room);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('매물 로드 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '매물 정보를 불러올 수 없습니다.',
        confirmButtonColor: '#667eea'
      }).then(() => {
        router.push('/marketplace');
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!room || !room.latitude || !room.longitude) return;

    const container = document.getElementById('kakao-map');
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(room.latitude, room.longitude),
      level: 3
    };

    const map = new window.kakao.maps.Map(container, options);

    // 마커 생성
    const markerPosition = new window.kakao.maps.LatLng(room.latitude, room.longitude);
    const marker = new window.kakao.maps.Marker({
      position: markerPosition
    });

    marker.setMap(map);

    // 인포윈도우 생성
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `
        <div style="padding:10px; font-size:12px; text-align:center; min-width:150px;">
          <strong>${room.title}</strong><br/>
          <span style="color:#10b981;">${formatPrice(room.monthly_rent)}</span>
        </div>
      `
    });

    // 마커 클릭 시 인포윈도우 표시
    window.kakao.maps.event.addListener(marker, 'click', () => {
      infowindow.open(map, marker);
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      const eok = Math.floor(price / 10000);
      const man = price % 10000;
      return man > 0 ? `${eok}억 ${man}만원` : `${eok}억원`;
    }
    return `${price}만원`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const handleContactOwner = () => {
    if (!room?.phone_number) {
      Swal.fire({
        icon: 'info',
        title: '연락처 없음',
        text: '등록된 연락처가 없습니다.',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    Swal.fire({
      title: '연락처 정보',
      html: `
        <p style="margin-bottom: 10px;"><strong>연락처:</strong> ${room.phone_number}</p>
        <p style="margin-bottom: 10px;"><strong>담당자:</strong> ${room.owner_name}</p>
        <p style="color: #666; font-size: 14px;">연락 시 '마이하우스에서 보고 연락드렸다'고 말씀해주세요.</p>
      `,
      showCancelButton: true,
      confirmButtonText: '전화걸기',
      cancelButtonText: '닫기',
      confirmButtonColor: '#10b981'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `tel:${room.phone_number}`;
      }
    });
  };

  const handleInquiry = () => {
    Swal.fire({
      title: '문의하기',
      input: 'textarea',
      inputPlaceholder: '궁금한 점을 적어주세요...',
      showCancelButton: true,
      confirmButtonText: '문의 보내기',
      cancelButtonText: '취소',
      confirmButtonColor: '#10b981',
      inputValidator: (value) => {
        if (!value) {
          return '문의 내용을 입력해주세요.';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: 문의 API 호출
        Swal.fire({
          icon: 'success',
          title: '문의 전송 완료',
          text: '문의가 전송되었습니다. 곧 연락드리겠습니다.',
          confirmButtonColor: '#10b981'
        });
      }
    });
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="container" style={{ 
          padding: "20px",
          minHeight: "100vh",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass" style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            매물 정보를 불러오는 중...
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!room) {
    return (
      <AuthGuard>
        <div className="container" style={{ 
          padding: "20px",
          minHeight: "100vh",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass" style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h3 style={{ fontFamily: 'Pretendard-SemiBold', marginBottom: 20 }}>
              매물을 찾을 수 없습니다
            </h3>
            <button 
              onClick={() => router.push('/marketplace')}
              className="button-primary"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container" style={{ 
        padding: isMobile ? "10px" : "20px",
        minHeight: "100vh",
        maxWidth: "95vw",
        margin: "0 auto"
      }}>
        {/* 헤더 */}
        <div className="glass" style={{ 
          padding: isMobile ? 16 : 24, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            marginBottom: 12
          }}>
            <button
              onClick={() => router.push('/marketplace')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              ←
            </button>
            <div style={{
              background: room.room_type === 'one-room' ? '#10b981' : '#3b82f6',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'Pretendard-SemiBold'
            }}>
              {room.room_type === 'one-room' ? '원룸' : '투룸'}
            </div>
            {room.status !== 'available' && (
              <div style={{
                background: room.status === 'reserved' ? '#f59e0b' : '#ef4444',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'Pretendard-SemiBold'
              }}>
                {room.status === 'reserved' ? '예약중' : '계약완료'}
              </div>
            )}
          </div>

          <h1 style={{ 
            fontSize: isMobile ? 20 : 24,
            fontFamily: 'Pretendard-Bold',
            margin: 0,
            color: '#fff',
            lineHeight: 1.4
          }}>
            {room.title}
          </h1>

          <p style={{ 
            fontSize: 14, 
            color: 'rgba(255,255,255,0.8)', 
            margin: "8px 0 0 0" 
          }}>
            📍 {room.address}
          </p>
        </div>


        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
          gap: 24 
        }}>
          {/* 메인 콘텐츠 */}
          <div>
            {/* 이미지 갤러리 */}
            {room.images && room.images.length > 0 ? (
              <div className="glass" style={{ marginBottom: 24, overflow: 'hidden' }}>
                <div style={{
                  height: isMobile ? 250 : 400,
                  backgroundImage: `url(${room.images[currentImageIndex]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  {room.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(
                          currentImageIndex === 0 ? room.images.length - 1 : currentImageIndex - 1
                        )}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          cursor: 'pointer',
                          fontSize: 18
                        }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(
                          currentImageIndex === room.images.length - 1 ? 0 : currentImageIndex + 1
                        )}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          cursor: 'pointer',
                          fontSize: 18
                        }}
                      >
                        ›
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12
                      }}>
                        {currentImageIndex + 1} / {room.images.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass" style={{ 
                marginBottom: 24, 
                height: isMobile ? 250 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <div style={{ 
                  fontSize: 64, 
                  color: 'rgba(255,255,255,0.8)' 
                }}>
                  🏠
                </div>
              </div>
            )}

            {/* 상세 정보 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
              <h2 style={{ 
                fontSize: 20, 
                fontFamily: 'Pretendard-Bold', 
                marginBottom: 16,
                color: '#fff'
              }}>
                매물 상세 정보
              </h2>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 16,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>월세</div>
                  <div style={{ 
                    fontSize: 24, 
                    fontFamily: 'Pretendard-Bold', 
                    color: '#10b981' 
                  }}>
                    {formatPrice(room.monthly_rent)}
                    {room.negotiable && (
                      <span style={{ 
                        fontSize: 14, 
                        color: '#fbbf24',
                        marginLeft: 8 
                      }}>
                        (협의가능)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>보증금</div>
                  <div style={{ 
                    fontSize: 20, 
                    fontFamily: 'Pretendard-SemiBold', 
                    color: '#fff' 
                  }}>
                    {formatPrice(room.deposit)}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
                gap: 16,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>관리비</div>
                  <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                    {room.maintenance_fee ? `${room.maintenance_fee}만원` : '없음'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>면적</div>
                  <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                    {room.area}평
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>층수</div>
                  <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                    {room.floor}/{room.total_floors}층
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>건물유형</div>
                  <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                    {room.building_type}
                  </div>
                </div>
              </div>

              {room.options && room.options.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>옵션</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {room.options.map((option, index) => (
                      <span 
                        key={index}
                        className="badge" 
                        style={{ 
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          fontSize: 12
                        }}
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>상세 설명</div>
                <div style={{ 
                  color: '#fff', 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {room.description}
                </div>
              </div>
            </div>

            {/* 지도 */}
            {room.latitude && room.longitude && (
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 16,
                  color: '#fff'
                }}>
                  위치 정보
                </h2>
                <div 
                  id="kakao-map" 
                  style={{ 
                    width: '100%', 
                    height: isMobile ? 250 : 350,
                    borderRadius: 8
                  }}
                />
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div>
            {/* 연락처 정보 */}
            <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontFamily: 'Pretendard-Bold', 
                marginBottom: 16,
                color: '#fff'
              }}>
                연락처 정보
              </h3>

              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>담당자</div>
                <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                  {room.owner_name}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>입주 가능일</div>
                <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                  {room.available_date ? formatDate(room.available_date) : '즉시 입주 가능'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleContactOwner}
                  className="button-primary"
                  style={{
                    background: '#10b981',
                    border: 'none',
                    width: '100%'
                  }}
                >
                  📞 전화하기
                </button>
                <button
                  onClick={handleInquiry}
                  className="button-primary"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    width: '100%'
                  }}
                >
                  💬 문의하기
                </button>
              </div>
            </div>

            {/* 기타 정보 */}
            <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontFamily: 'Pretendard-Bold', 
                marginBottom: 16,
                color: '#fff'
              }}>
                기타 정보
              </h3>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>등록일</div>
                <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                  {formatDate(room.created_at)}
                </div>
              </div>

              <div>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>조회수</div>
                <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                  {room.view_count.toLocaleString()}회
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
