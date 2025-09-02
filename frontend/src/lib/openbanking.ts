import axios from 'axios';
import CryptoJS from 'crypto-js';

// 오픈뱅킹 API 설정
const OPENBANKING_BASE_URL = 'https://testapi.openbanking.or.kr/v2.0';
const CLIENT_ID = process.env.OPENBANKING_CLIENT_ID || '63970cd9-dd3b-47b9-99af-795776949491';
const CLIENT_SECRET = process.env.OPENBANKING_CLIENT_SECRET || '9da7395e-de4e-40ee-93e2-bdeb453fa47f';

export interface BankAccount {
  fintech_use_num: string;
  account_alias: string;
  bank_code_std: string;
  bank_name: string;
  account_num_masked: string;
  account_holder_name: string;
  account_type: string;
  product_name?: string;
  inquiry_agree_yn: string;
  inquiry_agree_dtime: string;
  transfer_agree_yn: string;
  transfer_agree_dtime: string;
}

export interface BalanceInfo {
  api_tran_id: string;
  api_tran_dtm: string;
  rsp_code: string;
  rsp_message: string;
  bank_code_std: string;
  bank_code_sub: string;
  bank_name: string;
  savings_bank_name?: string;
  fintech_use_num: string;
  balance_amt: string;
  available_amt: string;
  account_type: string;
  product_name: string;
  account_issue_date: string;
  maturity_date?: string;
  last_tran_date?: string;
}

export interface TransactionHistory {
  api_tran_id: string;
  api_tran_dtm: string;
  rsp_code: string;
  rsp_message: string;
  bank_code_std: string;
  bank_name: string;
  fintech_use_num: string;
  savings_bank_name?: string;
  account_num_masked: string;
  account_holder_name: string;
  account_alias: string;
  account_type: string;
  res_list: Transaction[];
  next_page_yn: string;
  befor_inquiry_trace_info?: string;
}

export interface Transaction {
  tran_date: string;
  tran_time: string;
  inout_type: string;
  tran_type: string;
  printed_content: string;
  tran_amt: string;
  after_balance_amt: string;
  branch_name?: string;
}

export interface AutoPayment {
  id: string;
  user_id: string;
  fintech_use_num: string;
  account_alias: string;
  payment_amount: number;
  payment_day: number; // 매월 납입일 (1-31)
  is_active: boolean;
  created_at: string;
  last_payment_date?: string;
  next_payment_date: string;
}

export interface LoanInfo {
  api_tran_id: string;
  api_tran_dtm: string;
  rsp_code: string;
  rsp_message: string;
  bank_code_std: string;
  bank_name: string;
  loan_limit_amt: string;
  loan_balance_amt: string;
  available_limit_amt: string;
  loan_rate: string;
  loan_type: string;
  product_name: string;
}

export interface CreditScore {
  score: number;
  grade: string;
  update_date: string;
  provider: string;
}

// API 공통 헤더 생성
function createHeaders(accessToken: string, userSeqNo: string) {
  const timestamp = Date.now().toString();
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-API-TRAN-ID': generateTransactionId(),
    'X-API-TRAN-DTM': new Date().toISOString().replace(/[-:]/g, '').slice(0, 14),
    'X-USER-SEQ-NO': userSeqNo,
    'Content-Type': 'application/json',
  };
}

// 거래고유번호 생성
function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `M${timestamp.slice(-9)}${random}`.toUpperCase();
}

// 사용자 계좌 목록 조회
export async function getUserAccounts(accessToken: string, userSeqNo: string): Promise<BankAccount[]> {
  try {
    const headers = createHeaders(accessToken, userSeqNo);
    const params = new URLSearchParams({
      user_seq_no: userSeqNo,
      include_cancel_yn: 'N',
      sort_order: 'D'
    });

    const response = await axios.get(
      `${OPENBANKING_BASE_URL}/account/list?${params}`,
      {
        headers
      }
    );

    if (response.data.rsp_code === 'A0000') {
      return response.data.res_list || [];
    } else {
      throw new Error(response.data.rsp_message || '계좌 조회 실패');
    }
  } catch (error) {
    console.error('계좌 목록 조회 오류:', error);
    throw error;
  }
}

// 계좌 잔액 조회
export async function getAccountBalance(
  accessToken: string, 
  userSeqNo: string, 
  fintechUseNum: string
): Promise<BalanceInfo> {
  try {
    const headers = createHeaders(accessToken, userSeqNo);
    const params = new URLSearchParams({
      bank_tran_id: generateTransactionId(),
      fintech_use_num: fintechUseNum,
      tran_dtime: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14)
    });

    const response = await axios.get(
      `${OPENBANKING_BASE_URL}/account/balance/fin_num?${params}`,
      {
        headers
      }
    );

    if (response.data.rsp_code === 'A0000') {
      return response.data;
    } else {
      throw new Error(response.data.rsp_message || '잔액 조회 실패');
    }
  } catch (error) {
    console.error('잔액 조회 오류:', error);
    throw error;
  }
}

// 계좌 거래내역 조회
export async function getTransactionHistory(
  accessToken: string,
  userSeqNo: string,
  fintechUseNum: string,
  inquiryType: 'A' | 'I' | 'O' = 'A', // A: 전체, I: 입금, O: 출금
  fromDate: string,
  toDate: string,
  sortOrder: 'D' | 'A' = 'D' // D: 내림차순, A: 오름차순
): Promise<TransactionHistory> {
  try {
    const headers = createHeaders(accessToken, userSeqNo);
    const params = new URLSearchParams({
      bank_tran_id: generateTransactionId(),
      fintech_use_num: fintechUseNum,
      inquiry_type: inquiryType,
      inquiry_base: 'D', // D: 일자기준
      from_date: fromDate,
      to_date: toDate,
      sort_order: sortOrder,
      tran_dtime: new Date().toISOString().replace(/[-:]/g, '').slice(0, 14)
    });

    const response = await axios.get(
      `${OPENBANKING_BASE_URL}/account/transaction_list/fin_num?${params}`,
      {
        headers
      }
    );

    if (response.data.rsp_code === 'A0000') {
      return response.data;
    } else {
      throw new Error(response.data.rsp_message || '거래내역 조회 실패');
    }
  } catch (error) {
    console.error('거래내역 조회 오류:', error);
    throw error;
  }
}

// 청약통장 관련 계좌 필터링
export function filterSubscriptionAccounts(accounts: BankAccount[]): BankAccount[] {
  return accounts.filter(account => 
    account.account_type === '1' || // 저축예금
    account.product_name?.includes('청약') ||
    account.product_name?.includes('주택') ||
    account.account_alias?.includes('청약')
  );
}

// 금액 포맷팅
export function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseInt(amount) : amount;
  return new Intl.NumberFormat('ko-KR').format(num);
}

// 은행코드별 은행명 매핑
export const BANK_CODES: { [key: string]: string } = {
  '004': 'KB국민은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '088': '신한은행',
  '081': '하나은행',
  '071': '우체국예금보험',
  '023': 'SC제일은행',
  '039': '경남은행',
  '034': '광주은행',
  '032': '부산은행',
  '031': '대구은행',
  '090': '카카오뱅크',
  '089': '케이뱅크',
  '092': '토스뱅크',
};

// 계좌 타입별 설명
export const ACCOUNT_TYPES: { [key: string]: string } = {
  '1': '저축예금',
  '2': '수시입출금',
  '3': '정기예금',
  '4': '정기적금',
  '5': '청약예금',
  '6': '청약적금',
};

// 오류 메시지 한글화
export function getErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'A0001': '접근토큰이 유효하지 않습니다.',
    'A0002': '계좌번호가 유효하지 않습니다.',
    'A0003': '거래한도를 초과했습니다.',
    'A0004': '계좌가 해지되었습니다.',
    'A0005': '이용시간이 아닙니다.',
    'A0006': '시스템 점검중입니다.',
    'A0007': '잔액이 부족합니다.',
    'A0008': '계좌가 정지되었습니다.',
    'A0009': '1일 이체한도를 초과했습니다.',
    'A0010': '1회 이체한도를 초과했습니다.',
  };
  
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
}
