"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { BannerAd, SquareAd } from "@/components/GoogleAdsense";
import Link from "next/link";
import Swal from 'sweetalert2';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order_index: number;
}

interface Post {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  category_name: string;
  category_slug: string;
  category_icon: string;
  author_name: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function BoardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadCategories();
    loadPosts();
  }, []);

  // 카테고리/검색 변경 시 게시글 다시 로드
  useEffect(() => {
    loadPosts();
  }, [selectedCategory, searchTerm]);

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

  const loadPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/board/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '오늘';
    if (diffDays <= 7) return `${diffDays}일 전`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <AuthGuard>
      <div className="container" style={{ 
        padding: isMobile ? "10px" : "20px",
        minHeight: "100vh",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {/* 헤더 */}
        <div className="glass" style={{ 
          padding: isMobile ? 20 : 32, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>📝</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 24 : 32,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                정보글 게시판
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "8px 0 0 0" 
              }}>
                청약 관련 유용한 정보를 공유하고 소통하는 공간입니다
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
            {/* 검색 폼 */}
            <form onSubmit={handleSearch} style={{ 
              display: 'flex', 
              gap: 8,
              flex: 1,
              maxWidth: isMobile ? '100%' : '400px'
            }}>
              <input
                type="text"
                placeholder="게시글 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ 
                  flex: 1,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              />
              <button type="submit" className="button-primary" style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff'
              }}>
                🔍
              </button>
            </form>

            {/* 글쓰기 버튼 */}
            <Link href="/board/write" className="button-primary" style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              textDecoration: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: 14,
              fontFamily: 'Pretendard-SemiBold',
              whiteSpace: 'nowrap'
            }}>
              ✏️ 글쓰기
            </Link>
          </div>
        </div>

        {/* 상단 배너 광고 */}
        <BannerAd style={{ margin: '20px 0' }} />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '250px 1fr', 
          gap: 24 
        }}>
          {/* 카테고리 사이드바 */}
          <aside className="glass" style={{ 
            padding: 20,
            height: 'fit-content',
            order: isMobile ? 1 : 0
          }}>
            <h3 style={{ 
              fontSize: 18, 
              fontFamily: 'Pretendard-Bold', 
              marginBottom: 16,
              color: '#fff'
            }}>
              카테고리
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: selectedCategory === null 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'Pretendard-Medium',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                📋 전체
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: selectedCategory === category.slug 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 14,
                    fontFamily: 'Pretendard-Medium',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>

            {/* 사이드바 광고 */}
            {!isMobile && (
              <div style={{ marginTop: '20px' }}>
                <SquareAd />
              </div>
            )}
          </aside>

          {/* 게시글 목록 */}
          <main>
            {loading ? (
              <div className="glass" style={{ 
                padding: 40, 
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
                게시글을 불러오는 중...
              </div>
            ) : posts.length === 0 ? (
              <div className="glass" style={{ 
                padding: 40, 
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                <h3 style={{ fontFamily: 'Pretendard-SemiBold', marginBottom: 8 }}>
                  게시글이 없습니다
                </h3>
                <p style={{ color: '#ccc', marginBottom: 20 }}>
                  첫 번째 게시글을 작성해보세요!
                </p>
                <Link href="/board/write" className="button-primary">
                  글쓰기
                </Link>
              </div>
            ) : (
              <>
                {/* 게시글 리스트 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {posts.map(post => (
                    <article key={post.id} className="glass" style={{ 
                      padding: isMobile ? 16 : 20,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    }}
                    >
                      <Link href={`/board/posts/${post.id}`} style={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        display: 'block'
                      }}>
                        {/* 게시글 헤더 */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12, 
                          marginBottom: 12,
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6,
                            fontSize: 12,
                            color: '#999'
                          }}>
                            <span>{post.category_icon}</span>
                            <span>{post.category_name}</span>
                          </div>
                          
                          {post.is_pinned && (
                            <div className="badge" style={{ 
                              background: '#ef4444', 
                              fontSize: 10 
                            }}>
                              📌 고정
                            </div>
                          )}
                          
                          {post.is_featured && (
                            <div className="badge" style={{ 
                              background: '#f59e0b', 
                              fontSize: 10 
                            }}>
                              ⭐ 추천
                            </div>
                          )}

                          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>
                            {formatDate(post.created_at)}
                          </div>
                        </div>

                        {/* 제목 */}
                        <h3 style={{ 
                          fontSize: isMobile ? 16 : 18,
                          fontFamily: 'Pretendard-SemiBold',
                          margin: '0 0 8px 0',
                          color: '#fff',
                          lineHeight: 1.4
                        }}>
                          {post.title}
                        </h3>

                        {/* 요약 */}
                        {post.excerpt && (
                          <p style={{ 
                            fontSize: 14,
                            color: '#ccc',
                            margin: '0 0 12px 0',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {post.excerpt}
                          </p>
                        )}

                        {/* 태그 */}
                        {post.tags && post.tags.length > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            gap: 6, 
                            marginBottom: 12,
                            flexWrap: 'wrap'
                          }}>
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="badge" style={{ 
                                background: 'rgba(102, 126, 234, 0.2)',
                                color: '#667eea',
                                fontSize: 10
                              }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 통계 */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 16,
                          fontSize: 12,
                          color: '#999'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            👁️ {post.view_count.toLocaleString()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            ❤️ {post.like_count.toLocaleString()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            💬 {post.comment_count.toLocaleString()}
                          </div>
                          <div style={{ marginLeft: 'auto' }}>
                            👤 {post.author_name}
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
                      onClick={() => loadPosts(pagination.current_page - 1)}
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
                      onClick={() => loadPosts(pagination.current_page + 1)}
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
