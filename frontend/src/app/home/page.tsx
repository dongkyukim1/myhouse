"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CarouselRow from "@/components/CarouselRow";
import VideoCard from "@/components/VideoCard";
import Hero from "@/components/Hero";
import Chips from "@/components/Chips";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

type Video = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails?: any;
};

type Channel = {
  id: string;
  title: string;
  description?: string;
  thumbnails?: any;
  banner?: string | null;
  subscriberCount?: string;
  videoCount?: string;
};

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "youth", label: "청년" },
  { key: "newlywed", label: "신혼" },
  { key: "lhsh", label: "LH/SH" },
  { key: "announce", label: "공고/모집" },
];

const KEYWORDS: Record<string, string[]> = {
  youth: ["청년", "청년주택", "행복주택"],
  newlywed: ["신혼", "신혼부부", "특공"],
  lhsh: ["LH", "SH", "공사"],
  announce: ["공고", "모집", "청약"],
  all: []
};

export default function HomePage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // 임시로 handle 사용하되, 실제 채널 ID를 찾아서 교체 예정
        const handle = "%40%EC%95%84%EC%98%81%EC%9D%B4%EB%84%A4%ED%96%89%EB%B3%B5%EC%A3%BC%ED%83%9D";
        const res = await fetch(`/api/videos?handle=${handle}`);
        const data = await res.json();
        
        if (!res.ok) {
          // 할당량 초과 에러 특별 처리
          if (data.code === "QUOTA_EXCEEDED" || res.status === 429) {
            throw new Error("🚫 YouTube API 일일 할당량이 초과되었습니다.\n내일 다시 시도해주세요.");
          }
          throw new Error(data.message || `API 오류: ${res.status}`);
        }
        
        setVideos(data.items || []);
        setChannel(data.channel || null);
        if (data.items?.[0]?.videoId) setPlayingId(data.items[0].videoId);
      } catch (e: any) {
        const errorMessage = e?.message || "로드 실패";
        setError(errorMessage);
        
        // YouTube API 할당량 초과 등 중요한 에러만 알림으로 표시
        if (errorMessage.includes("할당량") || errorMessage.includes("API")) {
          await Swal.fire({
            title: '⚠️ API 제한',
            text: errorMessage,
            icon: 'warning',
            confirmButtonText: '확인',
            confirmButtonColor: '#f59e0b',
            background: '#fff',
            customClass: {
              popup: 'swal-popup'
            }
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 히어로 element 탐색
  useEffect(() => {
    heroRef.current = (document.querySelector('#hero-top') as HTMLElement) || null;
  }, []);

  const featured = useMemo(() => videos.find(v => v.videoId === playingId) || videos[0], [videos, playingId]);

  const filtered = useMemo(() => {
    const base = category === "all" ? videos : videos.filter((v) => {
      const keys = KEYWORDS[category] || [];
      const has = (t: string) => keys.some((k) => t.toLowerCase().includes(k.toLowerCase()));
      return has(v.title || "") || has(v.description || "");
    });
    return base;
  }, [videos, category]);

  // 최신순 정렬 후 10개만 노출 (캐러셀 스크롤 여유 확보)
  const recommendedTop10 = useMemo(() => {
    return [...filtered]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);
  }, [filtered]);

  function playAtHero(v: Video) {
    setPlayingId(v.videoId);
    // 상단으로 스크롤 후 재생
    requestAnimationFrame(() => {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleSummaryClick(videoId: string) {
    router.push(`/video-summary?videoId=${videoId}`);
  }

  return (
    <AuthGuard>
      <main>
        {channel && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <img src={channel.thumbnails?.default?.url || channel.thumbnails?.high?.url} alt={channel.title} style={{ width: 48, height: 48, borderRadius: 999 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{channel.title}</div>
              <div style={{ color: "#bbb", fontSize: 12 }}>구독자 {Number(channel.subscriberCount || 0).toLocaleString()}명 · 영상 {Number(channel.videoCount || 0).toLocaleString()}개</div>
            </div>
          </div>
        )}

        <Hero
          title={featured?.title}
          description={featured?.description}
          backgroundUrl={featured?.thumbnails?.maxres?.url || featured?.thumbnails?.high?.url}
          onPlay={() => featured && playAtHero(featured)}
          videoId={playingId || undefined}
          playing={Boolean(playingId)}
        />

        <Chips items={CATEGORIES} value={category} onChange={setCategory} />

        {loading && <div>로딩 중...</div>}
        {error && <div style={{ color: "#f55" }}>{error}</div>}

        <CarouselRow title="추천 영상">
          {recommendedTop10.map((v) => (
            <VideoCard
              key={v.videoId}
              videoId={v.videoId}
              title={v.title}
              thumbnailUrl={v.thumbnails?.medium?.url || v.thumbnails?.default?.url}
              onClick={() => playAtHero(v)}
              onSummaryClick={handleSummaryClick}
            />
          ))}
        </CarouselRow>
      </main>
    </AuthGuard>
  );
}
