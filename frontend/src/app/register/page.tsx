"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);

  const requirements = [
    { text: '8자 이상', met: formData.password.length >= 8 },
    { text: '특수문자 1개 이상', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
    { text: '대문자 1개 이상', met: /[A-Z]/.test(formData.password) },
    { text: '숫자 1개 이상', met: /[0-9]/.test(formData.password) },
    { text: '소문자 1개 이상', met: /[a-z]/.test(formData.password) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreedToTerms) {
      setError('이용약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }
    if (!requirements.every(r => r.met)) {
      setError('비밀번호 조건을 모두 충족해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '회원가입에 실패했습니다.');
      login(data.user);
      await Swal.fire({
        title: '🎉 회원가입 완료',
        text: '지금 바로 MyHouse를 시작해보세요.',
        icon: 'success',
        confirmButtonText: '시작하기',
        confirmButtonColor: '#111',
        background: '#fff',
        customClass: { popup: 'swal-popup', title: 'swal-title', confirmButton: 'swal-confirm-btn' }
      });
      router.push('/home');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-shell">
      <div className="register-card">
        <div className="register-head">
          <div className="register-logo" aria-hidden>🏠</div>
          <h1 className="register-title">회원가입</h1>
          <p className="register-desc">청약 계산과 관리를 위한 스마트 주택 플랫폼</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-field">
              <label className="input-label">이메일</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="text-input" placeholder="name@example.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="input-field">
              <label className="input-label">이름</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="text-input" placeholder="홍길동" />
            </div>
          </div>

          <div className="password-grid">
            <div className="input-field">
              <div className="label-row">
                <label className="input-label">비밀번호</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ghost-btn">
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="text-input" />
            </div>
            <div className="input-field">
              <label className="input-label">비밀번호 확인</label>
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="text-input" />
            </div>
          </div>

          <div className="requirements">
            {requirements.map((r, i) => (
              <div key={i} className={`req-item ${r.met ? 'met' : ''}`}>
                <span className="req-dot" />
                <span className="req-text">{r.text}</span>
              </div>
            ))}
          </div>

          <label className="checkbox-item">
            <input type="checkbox" checked={agreedToMarketing} onChange={(e) => setAgreedToMarketing(e.target.checked)} className="hidden-checkbox" />
            <span className="checkbox-box">{agreedToMarketing ? '✓' : ''}</span>
            <span className="checkbox-text">제품 소식, 업데이트, 이벤트 등 마케팅 이메일을 수신합니다.</span>
          </label>

          <label className="checkbox-item">
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="hidden-checkbox" />
            <span className="checkbox-box">{agreedToTerms ? '✓' : ''}</span>
            <span className="checkbox-text">계정을 생성하면 <button type="button" className="link-btn">이용약관</button> 및 <button type="button" className="link-btn">개인정보 처리방침</button>에 동의하게 됩니다.</span>
          </label>

          {error && <div className="error-banner">{error}</div>}

          <div className="register-actions">
            <button type="submit" disabled={loading || !agreedToTerms} className={`auth-primary-btn wide ${(!agreedToTerms || loading) ? 'disabled' : ''}`}>
              {loading ? '계정 생성 중...' : '계정 생성'}
            </button>
            <div className="auth-alt">
              이미 계정이 있으신가요?
              <button type="button" onClick={() => router.push('/login')} className="auth-link">로그인</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
