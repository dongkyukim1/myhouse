"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import Swal from 'sweetalert2';

interface Room {
  id: number;
  title: string;
  description: string;
  room_type: string;
  address: string;
  district: string;
  neighborhood: string;
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

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function MarketplacePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 필터 상태
  const [roomType, setRoomType] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadRooms();
  }, [roomType, minPrice, maxPrice, district, sortBy]);

  const loadRooms = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (roomType) params.set('roomType', roomType);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (district) params.set('district', district);
      if (sortBy) params.set('sortBy', sortBy);

      const response = await fetch(`/api/marketplace/rooms?${params}`);
      const data = await response.json();

      if (data.success) {
        setRooms(data.rooms);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('매물 로드 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '매물을 불러오는 중 오류가 발생했습니다.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setLoading(false);
    }
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
          padding: isMobile ? 20 : 32, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>🏠</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 24 : 32,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                원룸/투룸 장터
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "8px 0 0 0" 
              }}>
                좋은 조건의 원룸과 투룸을 찾아보세요
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: 12,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
          }}>
            {/* 매물등록 버튼 */}
            <Link href="/marketplace/register" className="button-primary" style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              textDecoration: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: 14,
              fontFamily: 'Pretendard-SemiBold',
              whiteSpace: 'nowrap',
              alignSelf: isMobile ? 'flex-start' : 'auto'
            }}>
              🏠 매물등록
            </Link>
          </div>
        </div>


        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', 
          gap: 24 
        }}>
          {/* 필터 사이드바 */}
          <aside className="glass" style={{ 
            padding: 20,
            height: 'fit-content',
            order: isMobile ? 1 : 0
          }}>
            <h3 style={{ 
              fontSize: 18, 
              fontFamily: 'Pretendard-Bold', 
              marginBottom: 20,
              color: '#fff'
            }}>
              검색 필터
            </h3>

            {/* 방 종류 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontFamily: 'Pretendard-SemiBold',
                color: '#fff',
                marginBottom: 8 
              }}>
                방 종류
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="">전체</option>
                <option value="one-room">원룸</option>
                <option value="two-room">투룸</option>
              </select>
            </div>

            {/* 가격 범위 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontFamily: 'Pretendard-SemiBold',
                color: '#fff',
                marginBottom: 8 
              }}>
                월세 범위 (만원)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  placeholder="최소"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input"
                  style={{ width: '50%' }}
                />
                <input
                  type="number"
                  placeholder="최대"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input"
                  style={{ width: '50%' }}
                />
              </div>
            </div>

            {/* 지역 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontFamily: 'Pretendard-SemiBold',
                color: '#fff',
                marginBottom: 8 
              }}>
                지역
              </label>
              <input
                type="text"
                placeholder="구/군 입력"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* 정렬 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontFamily: 'Pretendard-SemiBold',
                color: '#fff',
                marginBottom: 8 
              }}>
                정렬
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="created_at">최신순</option>
                <option value="monthly_rent">가격낮은순</option>
                <option value="view_count">조회많은순</option>
              </select>
            </div>

          </aside>

          {/* 매물 목록 */}
          <main>
            {loading ? (
              <div className="glass" style={{ 
                padding: 40, 
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
                매물을 불러오는 중...
              </div>
            ) : rooms.length === 0 ? (
              <div className="glass" style={{ 
                padding: 40, 
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
                <h3 style={{ fontFamily: 'Pretendard-SemiBold', marginBottom: 8 }}>
                  매물이 없습니다
                </h3>
                <p style={{ color: '#ccc', marginBottom: 20 }}>
                  첫 번째 매물을 등록해보세요!
                </p>
                <Link href="/marketplace/register" className="button-primary">
                  매물등록
                </Link>
              </div>
            ) : (
              <>
                {/* 매물 그리드 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 20 
                }}>
                  {rooms.map(room => (
                    <article key={room.id} className="glass" style={{ 
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    }}
                    >
                      <Link href={`/marketplace/rooms/${room.id}`} style={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        display: 'block'
                      }}>
                        {/* 이미지 */}
                        <div style={{
                          height: 200,
                          backgroundImage: room.images && room.images.length > 0 
                            ? `url(${room.images[0]})` 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {(!room.images || room.images.length === 0) && (
                            <div style={{ 
                              fontSize: 48, 
                              color: 'rgba(255,255,255,0.8)' 
                            }}>
                              🏠
                            </div>
                          )}
                          
                          {/* 방 종류 배지 */}
                          <div style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            background: room.room_type === 'one-room' ? '#10b981' : '#3b82f6',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: 'Pretendard-SemiBold'
                          }}>
                            {room.room_type === 'one-room' ? '원룸' : '투룸'}
                          </div>

                          {/* 상태 배지 */}
                          {room.status !== 'available' && (
                            <div style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              background: room.status === 'reserved' ? '#f59e0b' : '#ef4444',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontFamily: 'Pretendard-SemiBold'
                            }}>
                              {room.status === 'reserved' ? '예약중' : '계약완료'}
                            </div>
                          )}
                        </div>

                        {/* 매물 정보 */}
                        <div style={{ padding: 16 }}>
                          {/* 제목 */}
                          <h3 style={{ 
                            fontSize: 16,
                            fontFamily: 'Pretendard-SemiBold',
                            margin: '0 0 8px 0',
                            color: '#fff',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {room.title}
                          </h3>

                          {/* 가격 */}
                          <div style={{ 
                            fontSize: 18,
                            fontFamily: 'Pretendard-Bold',
                            color: '#10b981',
                            marginBottom: 8
                          }}>
                            월세 {formatPrice(room.monthly_rent)}
                            {room.negotiable && (
                              <span style={{ 
                                fontSize: 12, 
                                color: '#fbbf24',
                                marginLeft: 8 
                              }}>
                                (협의가능)
                              </span>
                            )}
                          </div>

                          {/* 보증금 */}
                          <div style={{ 
                            fontSize: 14,
                            color: '#ccc',
                            marginBottom: 8
                          }}>
                            보증금 {formatPrice(room.deposit)}
                          </div>

                          {/* 주소 */}
                          <div style={{ 
                            fontSize: 14,
                            color: '#999',
                            marginBottom: 12,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            📍 {room.address}
                          </div>

                          {/* 매물 정보 */}
                          <div style={{ 
                            display: 'flex',
                            gap: 16,
                            fontSize: 12,
                            color: '#999',
                            marginBottom: 12
                          }}>
                            <span>📐 {room.area}평</span>
                            <span>🏠 {room.floor}/{room.total_floors}층</span>
                            <span>👁️ {room.view_count}</span>
                          </div>

                          {/* 등록일 */}
                          <div style={{ 
                            fontSize: 12,
                            color: '#666',
                            textAlign: 'right'
                          }}>
                            {formatDate(room.created_at)}
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="glass" style={{ 
                    padding: 20, 
                    marginTop: 24,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <button
                      onClick={() => loadRooms(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                      className="button-primary"
                      style={{
                        opacity: pagination.has_prev ? 1 : 0.5,
                        cursor: pagination.has_prev ? 'pointer' : 'not-allowed'
                      }}
                    >
                      이전
                    </button>

                    <span style={{ 
                      margin: '0 16px',
                      fontSize: 14,
                      color: '#fff'
                    }}>
                      {pagination.current_page} / {pagination.total_pages}
                    </span>

                    <button
                      onClick={() => loadRooms(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                      className="button-primary"
                      style={{
                        opacity: pagination.has_next ? 1 : 0.5,
                        cursor: pagination.has_next ? 'pointer' : 'not-allowed'
                      }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
