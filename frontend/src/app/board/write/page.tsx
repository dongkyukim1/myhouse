"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// ReactQuill을 동적으로 import (SSR 문제 해결)
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div style={{ 
    padding: '20px', 
    background: 'rgba(255,255,255,0.1)', 
    borderRadius: '8px',
    color: '#fff',
    textAlign: 'center'
  }}>에디터 로딩 중...</div>
});

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 카테고리 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // URL 파라미터에서 카테고리 설정
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.length > 0) {
      const category = categories.find(cat => cat.slug === categoryParam);
      if (category) {
        handleCategoryChange(category.id.toString());
      }
    }
  }, [searchParams, categories]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/board/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const handleCategoryChange = (value: string) => {
    const id = parseInt(value);
    setCategoryId(id);
    const category = categories.find(cat => cat.id === id);
    setSelectedCategory(category || null);
    
    // 장터 카테고리일 때 템플릿 적용
    if (category?.slug === 'one-room-market' || category?.slug === 'two-room-market') {
      applyRoomTemplate(category.slug);
    }
  };

  const applyRoomTemplate = (categorySlug: string) => {
    const roomType = categorySlug === 'one-room-market' ? '원룸' : '투룸';
    
    setTitle(`${roomType} 매물 - `);
    setContent(`
<h3>📍 위치 정보</h3>
<p>주소: </p>
<p>교통: </p>

<h3>💰 가격 정보</h3>
<p>월세: 만원</p>
<p>보증금: 만원</p>
<p>관리비: 만원 (포함사항: )</p>

<h3>🏠 매물 정보</h3>
<p>방 종류: ${roomType}</p>
<p>면적: 평</p>
<p>층수: 층 / 총 층</p>
<p>건물 유형: </p>

<h3>🔧 옵션</h3>
<p>포함 옵션: </p>

<h3>📞 연락처</h3>
<p>연락처: </p>
<p>카카오톡 ID: </p>

<h3>📝 상세 설명</h3>
<p></p>

<h3>📸 사진</h3>
<p>매물 사진을 첨부해 주세요.</p>
    `);
    
    // 기본 태그 설정
    if (categorySlug === 'one-room-market') {
      setTags(['원룸', '매물']);
    } else {
      setTags(['투룸', '매물']);
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      await Swal.fire({
        title: '제목을 입력해주세요',
        icon: 'warning',
        confirmButtonText: '확인',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    if (!content.trim()) {
      await Swal.fire({
        title: '내용을 입력해주세요',
        icon: 'warning',
        confirmButtonText: '확인',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    if (!categoryId) {
      await Swal.fire({
        title: '카테고리를 선택해주세요',
        icon: 'warning',
        confirmButtonText: '확인',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/board/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || undefined,
          categoryId,
          tags,
          metaDescription: metaDescription.trim() || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: '글이 성공적으로 등록되었습니다!',
          icon: 'success',
          confirmButtonText: '확인',
          confirmButtonColor: '#10b981'
        });
        router.push(`/board/posts/${data.post.id}`);
      } else {
        throw new Error(data.error || '글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('글 등록 실패:', error);
      await Swal.fire({
        title: '글 등록 실패',
        text: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Quill 에디터 설정
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'image'
  ];

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            marginBottom: 12
          }}>
            <button
              onClick={() => router.push('/board')}
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
            <div style={{ fontSize: 32 }}>✏️</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 20 : 24,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                글쓰기
              </h1>
              <p style={{ 
                fontSize: 14, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "4px 0 0 0" 
              }}>
                {selectedCategory ? `${selectedCategory.name} 카테고리` : '새로운 글을 작성해보세요'}
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
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="글 제목을 입력해주세요"
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
                    카테고리 *
                  </label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">카테고리를 선택해주세요</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
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
                    요약 (선택사항)
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="글의 간단한 요약을 입력해주세요 (목록에서 표시됩니다)"
                    className="input"
                    style={{ width: '100%', height: 80, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* 내용 작성 */}
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 20,
                  color: '#fff'
                }}>
                  내용 작성
                </h2>

                <div style={{ 
                  background: '#fff', 
                  borderRadius: 8
                }} className="quill-editor-container">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="내용을 작성해주세요..."
                  />
                </div>
              </div>
            </div>

            {/* 사이드바 */}
            <div>
              {/* 태그 */}
              <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ 
                  fontSize: 18, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 16,
                  color: '#fff'
                }}>
                  태그
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagAdd}
                    placeholder="태그 입력 후 Enter"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="badge" 
                        style={{ 
                          background: 'rgba(102, 126, 234, 0.2)',
                          color: '#667eea',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onClick={() => handleTagRemove(tag)}
                      >
                        #{tag} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SEO */}
              <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ 
                  fontSize: 18, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 16,
                  color: '#fff'
                }}>
                  SEO 설정
                </h3>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                    marginBottom: 8 
                  }}>
                    메타 설명
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="검색 엔진에 표시될 설명"
                    className="input"
                    style={{ width: '100%', height: 80, resize: 'vertical' }}
                  />
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
                  {loading ? '등록 중...' : '✏️ 글 등록하기'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}