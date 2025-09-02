"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
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
  user_id: number;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
  user_id: number;
  parent_id: number | null;
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 게시글 로드
  useEffect(() => {
    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/board/posts/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        setComments(data.comments || []);
        setLikeCount(data.post.like_count || 0);
        // 좋아요 상태 별도 로드
        loadLikeStatus();
      } else {
        await Swal.fire({
          title: '❌ 게시글을 찾을 수 없습니다',
          text: '삭제되었거나 존재하지 않는 게시글입니다.',
          icon: 'error',
          confirmButtonText: '확인'
        });
        router.push('/board');
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      await Swal.fire({
        title: '❌ 로드 실패',
        text: '게시글을 불러오는 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
      router.push('/board');
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
    if (likeLoading) return;

    try {
      setLikeLoading(true);

      const response = await fetch(`/api/board/posts/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
        
        // 게시글 객체의 like_count도 업데이트
        if (post) {
          setPost({
            ...post,
            like_count: data.likeCount
          });
        }
      } else {
        await Swal.fire({
          title: '❌ 오류',
          text: data.error || '좋아요 처리 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonText: '확인'
        });
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      await Swal.fire({
        title: '❌ 네트워크 오류',
        text: '네트워크 연결을 확인해주세요.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentContent.trim()) {
      await Swal.fire({
        title: '댓글 내용을 입력해주세요',
        icon: 'warning',
        confirmButtonText: '확인'
      });
      return;
    }

    try {
      setSubmitLoading(true);

      const response = await fetch('/api/board/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: params.id,
          content: commentContent.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setCommentContent('');
        loadPost(); // 댓글 목록 새로고침
        await Swal.fire({
          title: '✅ 댓글 작성 완료!',
          text: '댓글이 성공적으로 작성되었습니다.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error || '댓글 작성 실패');
      }
    } catch (error: any) {
      await Swal.fire({
        title: '❌ 댓글 작성 실패',
        text: error.message || '댓글 작성 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '게시글을 삭제하시겠습니까?',
      text: '삭제된 게시글은 복구할 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/board/posts/${params.id}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            title: '✅ 삭제 완료',
            text: '게시글이 삭제되었습니다.',
            icon: 'success',
            confirmButtonText: '확인'
          });
          router.push('/board');
        } else {
          throw new Error(data.error || '삭제 실패');
        }
      } catch (error: any) {
        await Swal.fire({
          title: '❌ 삭제 실패',
          text: error.message || '게시글 삭제 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonText: '확인'
        });
      }
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
          <div className="glass" style={{ 
            padding: 40, 
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            게시글을 불러오는 중...
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!post) {
    return null;
  }

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
          padding: isMobile ? 16 : 24, 
          marginBottom: 24
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            flexWrap: 'wrap'
          }}>
            <Link href="/board" className="button-primary" style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 12
            }}>
              ← 목록으로
            </Link>

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

            {/* 작성자 액션 버튼 */}
            {currentUser && currentUser.id === post.user_id && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <Link 
                  href={`/board/posts/${post.id}/edit`} 
                  className="button-primary"
                  style={{
                    background: 'rgba(102, 126, 234, 0.2)',
                    border: '1px solid #667eea',
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: 12
                  }}
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="button-primary"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: 12
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 제목 */}
          <h1 style={{ 
            fontSize: isMobile ? 20 : 28,
            fontFamily: 'Pretendard-Bold',
            margin: '0 0 16px 0',
            color: '#fff',
            lineHeight: 1.3
          }}>
            {post.title}
          </h1>

          {/* 메타 정보 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            fontSize: 14,
            color: '#ccc',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              👤 {post.author_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              📅 {formatDate(post.created_at)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              👁️ {post.view_count.toLocaleString()}
            </div>
            <button
              onClick={handleLike}
              disabled={likeLoading}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: isLiked ? '#ef4444' : '#ccc',
                cursor: likeLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                if (!likeLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {isLiked ? '❤️' : '🤍'} {likeCount.toLocaleString()}
              {likeLoading && <span style={{ fontSize: '12px' }}>...</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              💬 {post.comment_count.toLocaleString()}
            </div>
          </div>

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginTop: 16,
              flexWrap: 'wrap'
            }}>
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
          )}
        </div>

        {/* 본문 */}
        <article className="glass" style={{ 
          padding: isMobile ? 20 : 32,
          marginBottom: 24
        }}>
          <div 
            style={{
              color: '#fff',
              lineHeight: 1.7,
              fontSize: 16
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          {post.updated_at !== post.created_at && (
            <div style={{ 
              marginTop: 24,
              padding: 16,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              fontSize: 12,
              color: '#999',
              borderLeft: '3px solid #667eea'
            }}>
              마지막 수정: {formatDate(post.updated_at)}
            </div>
          )}
        </article>

        {/* 댓글 섹션 */}
        <div className="glass" style={{ 
          padding: isMobile ? 20 : 24
        }}>
          <h3 style={{ 
            fontSize: 18,
            fontFamily: 'Pretendard-Bold',
            marginBottom: 20,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 8
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
                minHeight: '100px',
                resize: 'vertical',
                marginBottom: 12
              }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitLoading || !commentContent.trim()}
                className="button-primary"
                style={{
                  background: submitLoading || !commentContent.trim()
                    ? 'rgba(102, 126, 234, 0.5)' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                {submitLoading ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </form>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <div style={{ 
              textAlign: 'center',
              padding: 40,
              color: '#999'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              첫 번째 댓글을 작성해보세요!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ 
                  padding: 16,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  borderLeft: '3px solid #667eea'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 8,
                    fontSize: 12,
                    color: '#ccc'
                  }}>
                    <span>👤 {comment.author_name}</span>
                    <span>📅 {formatDate(comment.created_at)}</span>
                    {currentUser && currentUser.id === comment.user_id && (
                      <div style={{ marginLeft: 'auto', fontSize: 10 }}>
                        <span style={{ color: '#667eea' }}>내 댓글</span>
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    color: '#fff',
                    lineHeight: 1.5,
                    fontSize: 14,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {comment.content}
                  </div>
                  {comment.updated_at !== comment.created_at && (
                    <div style={{ 
                      marginTop: 8,
                      fontSize: 10,
                      color: '#888'
                    }}>
                      수정됨: {formatDate(comment.updated_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 게시글 내용 스타일링 */}
      <style jsx global>{`
        article .ql-editor {
          padding: 0 !important;
        }
        article h1, article h2, article h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #fff;
        }
        article p {
          margin-bottom: 1em;
          color: #e5e5e5;
        }
        article ul, article ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
          color: #e5e5e5;
        }
        article li {
          margin-bottom: 0.5em;
        }
        article a {
          color: #667eea;
          text-decoration: underline;
        }
        article img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }
        article blockquote {
          border-left: 3px solid #667eea;
          padding-left: 1em;
          margin: 1em 0;
          color: #ccc;
          font-style: italic;
        }
        article code {
          background: rgba(255,255,255,0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          color: #fff;
        }
        article pre {
          background: rgba(0,0,0,0.3);
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
        }
        article pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </AuthGuard>
  );
}
