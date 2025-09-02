"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
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

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/board/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
        // 첫 번째 카테고리를 기본으로 선택
        if (data.categories.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
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
        confirmButtonText: '확인'
      });
      return;
    }

    if (!content.trim()) {
      await Swal.fire({
        title: '내용을 입력해주세요',
        icon: 'warning',
        confirmButtonText: '확인'
      });
      return;
    }

    if (!categoryId) {
      await Swal.fire({
        title: '카테고리를 선택해주세요',
        icon: 'warning',
        confirmButtonText: '확인'
      });
      return;
    }

    try {
      setLoading(true);

      const postData = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        categoryId,
        tags,
        metaDescription: metaDescription.trim() || undefined
      };

      const response = await fetch('/api/board/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: '✅ 게시글 작성 완료!',
          text: '게시글이 성공적으로 작성되었습니다.',
          icon: 'success',
          confirmButtonText: '확인'
        });
        router.push(`/board/posts/${data.post.id}`);
      } else {
        throw new Error(data.error || '게시글 작성 실패');
      }
    } catch (error: any) {
      await Swal.fire({
        title: '❌ 작성 실패',
        text: error.message || '게시글 작성 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
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
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'align',
    'link', 'image'
  ];

  return (
    <AuthGuard>
      <div className="container" style={{ 
        padding: isMobile ? "10px" : "20px",
        minHeight: "100vh",
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        {/* 헤더 */}
        <div className="glass" style={{ 
          padding: isMobile ? 20 : 24, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32 }}>✏️</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 20 : 24,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                새 글 작성
              </h1>
              <p style={{ 
                fontSize: 14, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "4px 0 0 0" 
              }}>
                유용한 정보를 다른 사용자들과 공유해보세요
              </p>
            </div>
          </div>
        </div>

        {/* 작성 폼 */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 기본 정보 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: 'Pretendard-SemiBold',
                marginBottom: 16,
                color: '#fff'
              }}>
                기본 정보
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 제목 */}
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: 14,
                    fontFamily: 'Pretendard-Medium',
                    marginBottom: 8,
                    color: '#fff'
                  }}>
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="게시글 제목을 입력하세요"
                    className="input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: 14,
                    fontFamily: 'Pretendard-Medium',
                    marginBottom: 8,
                    color: '#fff'
                  }}>
                    카테고리 *
                  </label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="input"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 요약 */}
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: 14,
                    fontFamily: 'Pretendard-Medium',
                    marginBottom: 8,
                    color: '#fff'
                  }}>
                    요약 (선택사항)
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="게시글의 간단한 요약을 입력하세요 (200자 이내)"
                    className="input"
                    style={{ 
                      width: '100%',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    maxLength={200}
                  />
                  <div style={{ 
                    fontSize: 12, 
                    color: '#999', 
                    textAlign: 'right',
                    marginTop: 4
                  }}>
                    {excerpt.length}/200
                  </div>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: 'Pretendard-SemiBold',
                marginBottom: 16,
                color: '#fff'
              }}>
                내용 *
              </h3>

              <div style={{ 
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: '450px'
              }}>
                <ReactQuill
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{
                    height: '400px'
                  }}
                  placeholder="게시글 내용을 작성하세요..."
                  theme="snow"
                />
              </div>
              

            </div>

            {/* 태그 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: 'Pretendard-SemiBold',
                marginBottom: 16,
                color: '#fff'
              }}>
                태그 (선택사항)
              </h3>

              <div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  placeholder="태그를 입력하고 Enter를 누르세요 (최대 5개)"
                  className="input"
                  style={{ width: '100%' }}
                  disabled={tags.length >= 5}
                />
                
                {tags.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 8, 
                    marginTop: 12 
                  }}>
                    {tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="badge"
                        style={{ 
                          background: 'rgba(102, 126, 234, 0.2)',
                          color: '#667eea',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleTagRemove(tag)}
                        title="클릭하여 제거"
                      >
                        #{tag} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEO 설정 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: 'Pretendard-SemiBold',
                marginBottom: 16,
                color: '#fff'
              }}>
                SEO 설정 (선택사항)
              </h3>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 14,
                  fontFamily: 'Pretendard-Medium',
                  marginBottom: 8,
                  color: '#fff'
                }}>
                  메타 설명
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="검색엔진에 표시될 설명을 입력하세요 (160자 이내)"
                  className="input"
                  style={{ 
                    width: '100%',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                  maxLength={160}
                />
                <div style={{ 
                  fontSize: 12, 
                  color: '#999', 
                  textAlign: 'right',
                  marginTop: 4
                }}>
                  {metaDescription.length}/160
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="glass" style={{ 
              padding: isMobile ? 16 : 20,
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => router.back()}
                className="button-primary"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="button-primary"
                style={{
                  background: loading 
                    ? 'rgba(102, 126, 234, 0.5)' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  minWidth: '100px'
                }}
              >
                {loading ? '작성 중...' : '게시글 작성'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quill CSS */}
      <style jsx global>{`
        .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom: none !important;
        }
        .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-top: none !important;
        }
        .ql-editor {
          min-height: 350px;
          font-size: 14px;
          line-height: 1.6;
          color: #000;
        }
        .ql-editor::before {
          color: #999;
          font-style: normal;
        }
      `}</style>
    </AuthGuard>
  );
}
