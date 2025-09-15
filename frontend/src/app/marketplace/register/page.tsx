"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function RoomRegisterPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomType: 'one-room',
    address: '',
    district: '',
    neighborhood: '',
    latitude: null as number | null,
    longitude: null as number | null,
    monthlyRent: '',
    deposit: '',
    maintenanceFee: '',
    area: '',
    floor: '',
    totalFloors: '',
    buildingType: '',
    roomCount: '1',
    bathroomCount: '1',
    availableDate: '',
    phoneNumber: '',
    negotiable: false,
    options: [] as string[],
    images: [] as string[]
  });

  // 옵션 목록
  const optionsList = [
    '에어컨', '냉장고', '세탁기', '건조기', '전자레인지', '가스레인지',
    '인덕션', '싱크대', '신발장', '옷장', '침대', '책상', '의자',
    '인터넷', 'Wi-Fi', 'TV', '엘리베이터', '주차가능', '베란다',
    '발코니', '테라스', '화장실분리', '샤워부스', '욕조'
  ];

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
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=8ca0a58c3aac5ffab32c4d2a43292947&autoload=false&libraries=services`;
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

  // 지도 초기화
  useEffect(() => {
    if (mapLoaded) {
      initializeMap();
    }
  }, [mapLoaded]);

  const initializeMap = () => {
    const container = document.getElementById('address-map');
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
      level: 3
    };

    const newMap = new window.kakao.maps.Map(container, options);
    setMap(newMap);

    // 클릭 이벤트 등록
    window.kakao.maps.event.addListener(newMap, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      
      // 기존 마커 제거
      if (marker) {
        marker.setMap(null);
      }

      // 새 마커 생성
      const newMarker = new window.kakao.maps.Marker({
        position: latlng,
        map: newMap
      });

      setMarker(newMarker);

      // 좌표를 주소로 변환
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const addr = result[0];
          const address = addr.address ? addr.address.address_name : '';
          const roadAddr = addr.road_address ? addr.road_address.address_name : '';
          
          setFormData(prev => ({
            ...prev,
            address: roadAddr || address,
            district: addr.address?.region_2depth_name || '',
            neighborhood: addr.address?.region_3depth_name || '',
            latitude: latlng.getLat(),
            longitude: latlng.getLng()
          }));
        }
      });
    });
  };

  const searchAddress = async () => {
    if (!formData.address || !mapLoaded) return;

    try {
      const response = await fetch(`/api/kakao-map/geocode?address=${encodeURIComponent(formData.address)}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const location = data.data[0];
        const lat = parseFloat(location.y);
        const lng = parseFloat(location.x);

        // 지도 중심 이동
        const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
        map.setCenter(moveLatLon);

        // 기존 마커 제거
        if (marker) {
          marker.setMap(null);
        }

        // 새 마커 생성
        const newMarker = new window.kakao.maps.Marker({
          position: moveLatLon,
          map: map
        });

        setMarker(newMarker);

        // 폼 데이터 업데이트
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          district: location.address?.region_2depth_name || '',
          neighborhood: location.address?.region_3depth_name || ''
        }));

        Swal.fire({
          icon: 'success',
          title: '주소 검색 완료',
          text: '지도에서 정확한 위치를 클릭해서 조정해주세요.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('주소를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주소 검색 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '주소 검색 실패',
        text: '주소를 찾을 수 없습니다. 다시 시도해주세요.',
        confirmButtonColor: '#667eea'
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.includes(option)
        ? prev.options.filter(opt => opt !== option)
        : [...prev.options, option]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.title || !formData.description || !formData.address || 
        !formData.monthlyRent || !formData.deposit) {
      Swal.fire({
        icon: 'warning',
        title: '필수 정보 누락',
        text: '제목, 설명, 주소, 월세, 보증금은 필수 입력 사항입니다.',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Swal.fire({
        icon: 'warning',
        title: '위치 정보 누락',
        text: '지도에서 정확한 위치를 선택해주세요.',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        monthlyRent: parseInt(formData.monthlyRent),
        deposit: parseInt(formData.deposit),
        maintenanceFee: formData.maintenanceFee ? parseInt(formData.maintenanceFee) : 0,
        area: formData.area ? parseFloat(formData.area) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : null,
        roomCount: parseInt(formData.roomCount),
        bathroomCount: parseInt(formData.bathroomCount)
      };

      const response = await fetch('/api/marketplace/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: '매물 등록 완료',
          text: '매물이 성공적으로 등록되었습니다.',
          confirmButtonColor: '#10b981'
        }).then(() => {
          router.push(`/marketplace/rooms/${data.room.id}`);
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('매물 등록 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '등록 실패',
        text: '매물 등록 중 오류가 발생했습니다.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setLoading(false);
    }
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
            <div style={{ fontSize: 32 }}>🏠</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 20 : 24,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                매물 등록
              </h1>
              <p style={{ 
                fontSize: 14, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "4px 0 0 0" 
              }}>
                원룸/투룸 매물을 등록해보세요
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
            gap: 24 
          }}>
            {/* 메인 폼 */}
            <div>
              {/* 기본 정보 */}
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 20,
                  color: '#fff'
                }}>
                  기본 정보
                </h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    매물 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="예: 신촌역 도보 5분, 깔끔한 원룸"
                    className="input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    방 종류 *
                  </label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => handleInputChange('roomType', e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="one-room">원룸</option>
                    <option value="two-room">투룸</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    상세 설명 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="매물의 특징, 교통, 주변 환경 등을 자세히 설명해주세요."
                    className="input"
                    style={{ width: '100%', height: 120, resize: 'vertical' }}
                    required
                  />
                </div>
              </div>

              {/* 위치 정보 */}
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 20,
                  color: '#fff'
                }}>
                  위치 정보
                </h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    주소 *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="도로명 주소를 입력해주세요"
                      className="input"
                      style={{ flex: 1 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={searchAddress}
                      className="button-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      주소 검색
                    </button>
                  </div>
                </div>

                {mapLoaded && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#ccc',
                      marginBottom: 8 
                    }}>
                      지도에서 정확한 위치를 클릭해주세요
                    </div>
                    <div 
                      id="address-map" 
                      style={{ 
                        width: '100%', 
                        height: 300,
                        borderRadius: 8
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 가격 정보 */}
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 20,
                  color: '#fff'
                }}>
                  가격 정보
                </h2>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                  marginBottom: 16
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      월세 (만원) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      placeholder="50"
                      className="input"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      보증금 (만원) *
                    </label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => handleInputChange('deposit', e.target.value)}
                      placeholder="1000"
                      className="input"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    관리비 (만원)
                  </label>
                  <input
                    type="number"
                    value={formData.maintenanceFee}
                    onChange={(e) => handleInputChange('maintenanceFee', e.target.value)}
                    placeholder="5"
                    className="input"
                    style={{ width: isMobile ? '100%' : '200px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="negotiable"
                    checked={formData.negotiable}
                    onChange={(e) => handleInputChange('negotiable', e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="negotiable" style={{ color: '#fff', fontSize: 14 }}>
                    가격 협의 가능
                  </label>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 20,
                  color: '#fff'
                }}>
                  상세 정보
                </h2>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
                  gap: 16,
                  marginBottom: 16
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      면적 (평)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      placeholder="10.5"
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      층수
                    </label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => handleInputChange('floor', e.target.value)}
                      placeholder="3"
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      총 층수
                    </label>
                    <input
                      type="number"
                      value={formData.totalFloors}
                      onChange={(e) => handleInputChange('totalFloors', e.target.value)}
                      placeholder="5"
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      건물 유형
                    </label>
                    <select
                      value={formData.buildingType}
                      onChange={(e) => handleInputChange('buildingType', e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      <option value="">선택</option>
                      <option value="아파트">아파트</option>
                      <option value="빌라">빌라</option>
                      <option value="원룸텔">원룸텔</option>
                      <option value="오피스텔">오피스텔</option>
                      <option value="단독주택">단독주택</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
                  gap: 16,
                  marginBottom: 20
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      방 개수
                    </label>
                    <select
                      value={formData.roomCount}
                      onChange={(e) => handleInputChange('roomCount', e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      <option value="1">1개</option>
                      <option value="2">2개</option>
                      <option value="3">3개</option>
                      <option value="4">4개 이상</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      화장실 개수
                    </label>
                    <select
                      value={formData.bathroomCount}
                      onChange={(e) => handleInputChange('bathroomCount', e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      <option value="1">1개</option>
                      <option value="2">2개</option>
                      <option value="3">3개 이상</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: isMobile ? 'span 2' : 'span 2' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: 14, 
                      fontFamily: 'Pretendard-SemiBold',
                      color: '#fff',
                      marginBottom: 8 
                    }}>
                      입주 가능일
                    </label>
                    <input
                      type="date"
                      value={formData.availableDate}
                      onChange={(e) => handleInputChange('availableDate', e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* 옵션 선택 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 12 
                  }}>
                    옵션 (복수 선택 가능)
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: 8
                  }}>
                    {optionsList.map(option => (
                      <label 
                        key={option}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          color: '#fff',
                          fontSize: 14,
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: 4,
                          background: formData.options.includes(option) 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : 'transparent',
                          border: `1px solid ${formData.options.includes(option) ? '#10b981' : 'transparent'}`
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.options.includes(option)}
                          onChange={() => handleOptionToggle(option)}
                          style={{ width: 16, height: 16 }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
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
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    연락처
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="010-1234-5678"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ 
                  fontSize: 12, 
                  color: '#999',
                  lineHeight: 1.4
                }}>
                  입력하신 연락처로 문의가 전달됩니다.
                  연락처를 입력하지 않으면 등록된 계정 정보로 연락을 받을 수 있습니다.
                </div>
              </div>

              {/* 등록 버튼 */}
              <div className="glass" style={{ padding: 20 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="button-primary"
                  style={{
                    width: '100%',
                    background: loading ? '#666' : '#10b981',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontFamily: 'Pretendard-SemiBold'
                  }}
                >
                  {loading ? '등록 중...' : '🏠 매물 등록하기'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
