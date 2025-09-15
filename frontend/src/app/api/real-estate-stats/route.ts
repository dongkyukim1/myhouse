import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// 부동산 공공데이터 포털 API 설정
const REB_BASE_URL = 'https://www.reb.or.kr/r-one/openapi/SttsApiTblItm.do';
const API_KEY = '17dd78d413c848de9ae9190dcc27767f'; // 제공된 API 키

// 통계표 정보
const STATISTICS_TABLES = {
  HOUSING_PRICE_INDEX: 'A_2024_00016', // (월) 매매가격지수_주택종합
  APARTMENT_PRICE_INDEX: 'A_2024_00045' // (월) 매매가격지수_아파트
};

// 부동산 통계 데이터 타입 정의
interface RealEstateStatsItem {
  STATBL_ID: string;     // 통계표 ID
  ITM_TAG: string;       // 항목정보
  ITM_ID: number;        // 항목 ID
  PAR_ITM_ID: number;    // 상위항목 ID
  ITM_NM: string;        // 항목명
  ITM_FULLNM: string;    // 항목전체명
  UI_NM: string;         // 단위명
  ITM_CMMT_IDTFR: string; // 항목 주석 식별자
  ITM_CMMT_CONT: string; // 항목 주석
  V_ORDER: number;       // 출력순서
}

// 포맷된 데이터 타입 정의
interface FormattedStatsItem {
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

interface ApiResponse {
  success: boolean;
  data?: FormattedStatsItem[];
  regions?: any;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
  message?: string;
}

// API 호출 함수
async function fetchRealEstateStats(
  statblId: string,
  itmTag?: string,
  pIndex: number = 1,
  pSize: number = 100
): Promise<RealEstateStatsItem[]> {
  const params = new URLSearchParams({
    KEY: API_KEY,
    Type: 'json',
    pIndex: pIndex.toString(),
    pSize: pSize.toString(),
    STATBL_ID: statblId
  });

  if (itmTag) {
    params.append('ITM_TAG', itmTag);
  }

  const url = `${REB_BASE_URL}?${params.toString()}`;
  
  try {
    console.log(`부동산 통계 API 호출: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // API 응답 구조에 따라 데이터 추출
    if (data && data.SttsApiTblItm && data.SttsApiTblItm.row) {
      return Array.isArray(data.SttsApiTblItm.row) 
        ? data.SttsApiTblItm.row 
        : [data.SttsApiTblItm.row];
    }
    
    return [];
  } catch (error) {
    console.error('부동산 통계 API 호출 오류:', error);
    throw error;
  }
}

// 지역별 데이터 처리 함수
function processRegionalData(items: RealEstateStatsItem[]) {
  // 지역별로 그룹화
  const regions = new Map();
  
  items.forEach(item => {
    const region = item.ITM_NM || '전국';
    if (!regions.has(region)) {
      regions.set(region, []);
    }
    regions.get(region).push(item);
  });

  return Object.fromEntries(regions);
}

// 사용자 친화적 데이터 변환
function formatStatsData(items: RealEstateStatsItem[]): FormattedStatsItem[] {
  return items.map(item => ({
    id: item.ITM_ID,
    parentId: item.PAR_ITM_ID,
    name: item.ITM_NM,
    fullName: item.ITM_FULLNM,
    unit: item.UI_NM,
    order: item.V_ORDER,
    description: item.ITM_CMMT_CONT,
    tableId: item.STATBL_ID,
    tag: item.ITM_TAG
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'housing'; // housing, apartment
    const region = searchParams.get('region');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 통계표 ID 선택
    const statblId = type === 'apartment' 
      ? STATISTICS_TABLES.APARTMENT_PRICE_INDEX 
      : STATISTICS_TABLES.HOUSING_PRICE_INDEX;

    console.log(`부동산 통계 조회 요청: type=${type}, region=${region}, page=${page}, limit=${limit}`);

    // API 데이터 가져오기
    const statsData = await fetchRealEstateStats(statblId, undefined, page, limit);
    
    if (!statsData || statsData.length === 0) {
      // 데이터가 없는 경우 샘플 데이터 제공
      const sampleData = getSampleData(type);
      return NextResponse.json({
        success: true,
        data: formatStatsData(sampleData),
        regions: processRegionalData(sampleData),
        total: sampleData.length,
        page,
        limit,
        message: '샘플 데이터가 제공되었습니다.'
      });
    }

    // 지역 필터링
    let filteredData = statsData;
    if (region) {
      filteredData = statsData.filter(item => 
        item.ITM_NM && item.ITM_NM.includes(region)
      );
    }

    const response: ApiResponse = {
      success: true,
      data: formatStatsData(filteredData),
      regions: processRegionalData(statsData),
      total: filteredData.length,
      page,
      limit
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('부동산 통계 API 오류:', error);
    
    // 오류 발생시 샘플 데이터로 폴백
    const type = new URL(req.url).searchParams.get('type') || 'housing';
    const sampleData = getSampleData(type);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      data: formatStatsData(sampleData),
      regions: processRegionalData(sampleData),
      message: '실제 API 호출 실패로 샘플 데이터를 제공합니다.'
    }, { status: 200 }); // 사용자 경험을 위해 200으로 반환
  }
}

// 샘플 데이터 생성 함수
function getSampleData(type: string): RealEstateStatsItem[] {
  const baseData = [
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100001',
      ITM_ID: 100001,
      PAR_ITM_ID: 0,
      ITM_NM: '전국',
      ITM_FULLNM: `전국 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `전국 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수 (2021.11=100)`,
      V_ORDER: 1
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100002',
      ITM_ID: 100002,
      PAR_ITM_ID: 100001,
      ITM_NM: '서울',
      ITM_FULLNM: `서울 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `서울지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 2
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100003',
      ITM_ID: 100003,
      PAR_ITM_ID: 100001,
      ITM_NM: '경기',
      ITM_FULLNM: `경기 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `경기지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 3
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100004',
      ITM_ID: 100004,
      PAR_ITM_ID: 100001,
      ITM_NM: '인천',
      ITM_FULLNM: `인천 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `인천지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 4
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100005',
      ITM_ID: 100005,
      PAR_ITM_ID: 100001,
      ITM_NM: '부산',
      ITM_FULLNM: `부산 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `부산지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 5
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100006',
      ITM_ID: 100006,
      PAR_ITM_ID: 100001,
      ITM_NM: '대구',
      ITM_FULLNM: `대구 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `대구지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 6
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100007',
      ITM_ID: 100007,
      PAR_ITM_ID: 100001,
      ITM_NM: '대전',
      ITM_FULLNM: `대전 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `대전지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 7
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100008',
      ITM_ID: 100008,
      PAR_ITM_ID: 100001,
      ITM_NM: '광주',
      ITM_FULLNM: `광주 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `광주지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 8
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100009',
      ITM_ID: 100009,
      PAR_ITM_ID: 100001,
      ITM_NM: '울산',
      ITM_FULLNM: `울산 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `울산지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 9
    },
    {
      STATBL_ID: type === 'apartment' ? 'A_2024_00045' : 'A_2024_00016',
      ITM_TAG: '100010',
      ITM_ID: 100010,
      PAR_ITM_ID: 100001,
      ITM_NM: '세종',
      ITM_FULLNM: `세종 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      UI_NM: '지수',
      ITM_CMMT_IDTFR: 'IDX',
      ITM_CMMT_CONT: `세종지역 ${type === 'apartment' ? '아파트' : '주택종합'} 매매가격지수`,
      V_ORDER: 10
    }
  ];

  return baseData;
}

// POST 메소드로 특정 지역의 세부 데이터 조회
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { statblId, itmTag, regions } = body;

    if (!statblId) {
      return NextResponse.json({
        success: false,
        error: '통계표 ID가 필요합니다.'
      }, { status: 400 });
    }

    const detailData = await fetchRealEstateStats(statblId, itmTag);
    
    // 요청된 지역들로 필터링
    let filteredData = detailData;
    if (regions && Array.isArray(regions)) {
      filteredData = detailData.filter(item => 
        regions.some(region => item.ITM_NM && item.ITM_NM.includes(region))
      );
    }

    return NextResponse.json({
      success: true,
      data: formatStatsData(filteredData),
      total: filteredData.length
    });

  } catch (error: any) {
    console.error('부동산 통계 세부 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: '세부 데이터 조회에 실패했습니다.'
    }, { status: 500 });
  }
}
