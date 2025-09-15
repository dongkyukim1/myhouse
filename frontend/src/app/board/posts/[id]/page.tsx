"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  category_name: string;
  category_slug: string;
  category_icon: string;
  author_name: string;
  author_email: string;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_email: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 게시글 데이터 로드
  useEffect(() => {
    if (params.id) {
      loadPost();
      loadLikeStatus();
    }
  }, [params.id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/board/posts/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        setComments(data.comments || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '게시글을 불러올 수 없습니다.',
        confirmButtonColor: '#667eea'
      }).then(() => {
        router.push('/board');
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLikeStatus = async () => {
    try {
      const response = await fetch(`/api/board/posts/${params.id}/like`);
      const data = await response.json();

      if (data.success) {
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('좋아요 상태 로드 실패:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/board/posts/${params.id}/like`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setIsLiked(data.action === 'liked');
        setLikeCount(prev => data.action === 'liked' ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '좋아요 처리 중 오류가 발생했습니다.',
        confirmButtonColor: '#667eea'
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentContent.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '댓글 내용을 입력해주세요',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    try {
      setCommentLoading(true);
      const response = await fetch('/api/board/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: params.id,
          content: commentContent.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCommentContent('');
        loadPost(); // 댓글 목록 새로고침
        Swal.fire({
          icon: 'success',
          title: '댓글이 등록되었습니다',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      Swal.fire({
        icon: 'error',
        title: '댓글 등록 실패',
        text: '댓글 등록 중 오류가 발생했습니다.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            게시글을 불러오는 중...
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!post) {
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
              게시글을 찾을 수 없습니다
            </h3>
            <button 
              onClick={() => router.push('/board')}
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            marginBottom: 16
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: 'rgba(255,255,255,0.8)'
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
          </div>

          <h1 style={{ 
            fontSize: isMobile ? 20 : 28,
            fontFamily: 'Pretendard-Bold',
            margin: 0,
            color: '#fff',
            lineHeight: 1.4,
            marginBottom: 12
          }}>
            {post.title}
          </h1>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            flexWrap: 'wrap'
          }}>
            <div>👤 {post.author_name}</div>
            <div>📅 {formatDate(post.created_at)}</div>
            <div>👁️ {post.view_count.toLocaleString()}</div>
            <div>❤️ {likeCount.toLocaleString()}</div>
            <div>💬 {post.comment_count.toLocaleString()}</div>
          </div>
        </div>


        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
          gap: 24 
        }}>
          {/* 메인 콘텐츠 */}
          <div>
            {/* 본문 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
              <div style={{ 
                color: '#fff',
                lineHeight: 1.8,
                fontSize: 16
              }} 
              dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
              <div className="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: 24 }}>
                <h3 style={{ 
                  fontSize: 18, 
                  fontFamily: 'Pretendard-Bold', 
                  marginBottom: 16,
                  color: '#fff'
                }}>
                  태그
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {post.tags.map((tag, index) => (
                    <span key={index} className="badge" style={{ 
                      background: 'rgba(102, 126, 234, 0.2)',
                      color: '#667eea',
                      fontSize: 12
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 좋아요 버튼 */}
            <div className="glass" style={{ 
              padding: 20, 
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <button
                onClick={handleLike}
                style={{
                  background: isLiked ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${isLiked ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: 16,
                  fontFamily: 'Pretendard-SemiBold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {isLiked ? '❤️' : '🤍'} 좋아요 ({likeCount})
              </button>
            </div>

            {/* 댓글 섹션 */}
            <div className="glass" style={{ padding: isMobile ? 16 : 24 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontFamily: 'Pretendard-Bold', 
                marginBottom: 20,
                color: '#fff'
              }}>
                💬 댓글 ({comments.length})
              </h3>

              {/* 댓글 작성 폼 */}
              <form onSubmit={handleCommentSubmit} style={{ marginBottom: 24 }}>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글을 작성해주세요..."
                  className="input"
                  style={{ 
                    width: '100%', 
                    height: 100, 
                    resize: 'vertical',
                    marginBottom: 12
                  }}
                />
                <button
                  type="submit"
                  disabled={commentLoading}
                  className="button-primary"
                  style={{
                    background: commentLoading ? '#666' : '#10b981',
                    cursor: commentLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {commentLoading ? '등록 중...' : '💬 댓글 등록'}
                </button>
              </form>

              {/* 댓글 목록 */}
              {comments.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999',
                  padding: 40
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                  첫 번째 댓글을 작성해보세요!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{
                      background: 'rgba(255,255,255,0.05)',
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8
                      }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontFamily: 'Pretendard-SemiBold',
                          color: '#fff'
                        }}>
                          👤 {comment.author_name}
                        </div>
                        <div style={{ 
                          fontSize: 12, 
                          color: '#999'
                        }}>
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                      <div style={{ 
                        color: '#ccc',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div>
            {/* 작성자 정보 */}
            <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontFamily: 'Pretendard-Bold', 
                marginBottom: 16,
                color: '#fff'
              }}>
                작성자
              </h3>
              <div style={{ color: '#fff' }}>
                👤 {post.author_name}
              </div>
            </div>

            {/* 게시글 정보 */}
            <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontFamily: 'Pretendard-Bold', 
                marginBottom: 16,
                color: '#fff'
              }}>
                게시글 정보
              </h3>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>작성일</div>
                <div style={{ color: '#fff', fontSize: 14 }}>
                  {formatDate(post.created_at)}
                </div>
              </div>

              {post.updated_at !== post.created_at && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>수정일</div>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {formatDate(post.updated_at)}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>조회수</div>
                <div style={{ color: '#fff', fontSize: 14 }}>
                  {post.view_count.toLocaleString()}회
                </div>
              </div>
            </div>

            {/* 목록으로 버튼 */}
            <div className="glass" style={{ padding: 20 }}>
              <button
                onClick={() => router.push('/board')}
                className="button-primary"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                📋 목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}