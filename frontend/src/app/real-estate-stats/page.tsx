'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// 타입 정의
interface StatsItem {
  id: number;
  parentId: number;
  name: string;
  fullName: string;
  unit: string;
  order: number;
  description: string;
  tableId: string;
  tag: string;
}

interface RegionalData {
  [region: string]: StatsItem[];
}

interface ApiResponse {
  success: boolean;
  data: StatsItem[];
  regions: RegionalData;
  total: number;
  page: number;
  limit: number;
  message?: string;
  error?: string;
}

const RealEstateStatsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsItem[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData>({});
  const [selectedType, setSelectedType] = useState<'housing' | 'apartment'>('housing');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string>('');

  // API 데이터 가져오기
  const fetchStatsData = async (
    type: 'housing' | 'apartment' = 'housing',
    region: string = '',
    page: number = 1
  ) => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        type,
        page: page.toString(),
        limit: '50'
      });
      
      if (region) {
        params.append('region', region);
      }

      const response = await fetch(`/api/real-estate-stats?${params.toString()}`);
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setStatsData(result.data || []);
        setRegionalData(result.regions || {});
        setTotalCount(result.total || 0);
        
        if (result.message) {
          console.log('API 메시지:', result.message);
        }
      } else {
        setError(result.error || '데이터를 가져오는데 실패했습니다.');
        // 오류 시에도 백업 데이터가 있으면 표시
        if (result.data) {
          setStatsData(result.data);
          setRegionalData(result.regions || {});
        }
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const type = (searchParams?.get('type') as 'housing' | 'apartment') || 'housing';
    const region = searchParams?.get('region') || '';
    
    setSelectedType(type);
    setSelectedRegion(region);
    fetchStatsData(type, region, 1);
  }, [searchParams]);

  // 타입 변경 핸들러
  const handleTypeChange = (type: 'housing' | 'apartment') => {
    setSelectedType(type);
    setCurrentPage(1);
    fetchStatsData(type, selectedRegion, 1);
  };

  // 지역 변경 핸들러
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setCurrentPage(1);
    fetchStatsData(selectedType, region, 1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStatsData(selectedType, selectedRegion, page);
  };

  // 지역 목록 생성
  const getRegionList = () => {
    const regions = Object.keys(regionalData);
    return regions.filter(region => region !== '전국').sort();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Pretendard-Bold' }}>
            부동산 매매가격지수
          </h1>
          <p className="text-xl text-gray-600" style={{ fontFamily: 'Pretendard-Regular' }}>
            전국 및 지역별 부동산 시장 동향을 한눈에 확인하세요
          </p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 주택 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Pretendard-Medium' }}>
                주택 유형
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => handleTypeChange('housing')}
                  className={`px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedType === 'housing'
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Pretendard-Medium' }}
                >
                  주택종합
                </button>
                <button
                  onClick={() => handleTypeChange('apartment')}
                  className={`px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedType === 'apartment'
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Pretendard-Medium' }}
                >
                  아파트
                </button>
              </div>
            </div>

            {/* 지역 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Pretendard-Medium' }}>
                지역
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                style={{ fontFamily: 'Pretendard-Regular' }}
              >
                <option value="">전체 지역</option>
                {getRegionList().map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* 새로고침 버튼 */}
            <div className="flex items-end lg:col-span-1 sm:col-span-2">
              <button
                onClick={() => fetchStatsData(selectedType, selectedRegion, currentPage)}
                disabled={loading}
                className="w-full px-4 sm:px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ fontFamily: 'Pretendard-Medium' }}
              >
                {loading ? '로딩 중...' : '새로고침'}
              </button>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800" style={{ fontFamily: 'Pretendard-Regular' }}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 정보 표시 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* 통계 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Pretendard-Medium' }}>
                      총 지역 수
                    </p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Pretendard-Bold' }}>
                      {Object.keys(regionalData).length}개
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Pretendard-Medium' }}>
                      통계 항목 수
                    </p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Pretendard-Bold' }}>
                      {totalCount}개
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Pretendard-Medium' }}>
                      선택된 유형
                    </p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Pretendard-Bold' }}>
                      {selectedType === 'housing' ? '주택종합' : '아파트'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 데이터 테이블 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Pretendard-SemiBold' }}>
                  지역별 매매가격지수 정보
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Pretendard-Medium' }}>
                        순서
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Pretendard-Medium' }}>
                        지역명
                      </th>
                      <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Pretendard-Medium' }}>
                        전체명
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Pretendard-Medium' }}>
                        단위
                      </th>
                      <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Pretendard-Medium' }}>
                        설명
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsData.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ fontFamily: 'Pretendard-Regular' }}>
                          {item.order}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-xs sm:text-sm" style={{ fontFamily: 'Pretendard-Medium' }}>
                                  {item.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-4">
                              <div className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Pretendard-Medium' }}>
                                {item.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500" style={{ fontFamily: 'Pretendard-Regular' }}>
                                ID: {item.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900" style={{ fontFamily: 'Pretendard-Regular' }}>
                          <div className="max-w-xs truncate" title={item.fullName}>
                            {item.fullName}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" style={{ fontFamily: 'Pretendard-Medium' }}>
                            {item.unit}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-sm text-gray-500" style={{ fontFamily: 'Pretendard-Regular' }}>
                          <div className="max-w-xs truncate" title={item.description}>
                            {item.description || '설명 없음'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 데이터가 없는 경우 */}
              {statsData.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: 'Pretendard-Medium' }}>
                    데이터가 없습니다
                  </h3>
                  <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'Pretendard-Regular' }}>
                    선택한 조건에 맞는 통계 데이터를 찾을 수 없습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {statsData.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Pretendard-Medium' }}
                  >
                    이전
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-lg" style={{ fontFamily: 'Pretendard-Medium' }}>
                    {currentPage} 페이지
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={statsData.length < 50}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Pretendard-Medium' }}
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 정보 섹션 */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Pretendard-Bold' }}>
                매매가격지수란?
              </h3>
              <p className="text-blue-100 leading-relaxed" style={{ fontFamily: 'Pretendard-Regular' }}>
                매매가격지수는 부동산 시장의 가격 변동을 나타내는 지표입니다. 
                기준 시점(2021.11=100)을 100으로 하여 현재 가격 수준을 비교할 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Pretendard-Bold' }}>
                데이터 출처
              </h3>
              <p className="text-blue-100 leading-relaxed" style={{ fontFamily: 'Pretendard-Regular' }}>
                본 데이터는 부동산 공공데이터 포털(REB)에서 제공하는 
                공식 통계 정보를 바탕으로 구성되었습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateStatsPage;
