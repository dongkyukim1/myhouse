"use client";

import React from "react";
import { Play, Info } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  backgroundUrl?: string;
  onPlay?: () => void;
  videoId?: string;
  playing?: boolean;
};

export default function Hero({ title, description, backgroundUrl, onPlay, videoId, playing }: Props) {
  return (
    <section className="relative h-[420px] lg:h-[480px] rounded-2xl overflow-hidden mb-8 group">
      {/* Video Player when playing */}
      {playing && videoId ? (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&modestbranding=1&showinfo=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : (
        <>
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800" />

          {/* Background Image */}
          {backgroundUrl && (
            <img
              src={backgroundUrl}
              alt={title || "Hero background"}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500"
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
            <div className="max-w-2xl">
              {title && (
                <h1 className="text-white font-bold text-2xl lg:text-4xl mb-3 lg:mb-4 leading-tight">
                  {title}
                </h1>
              )}

              {description && (
                <p className="text-neutral-200 text-sm lg:text-base leading-relaxed mb-6 line-clamp-3">
                  {description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {onPlay && (
                  <button
                    onClick={onPlay}
                    className="btn-primary flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    재생
                  </button>
                )}

                <button className="btn-outline flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all duration-200 backdrop-blur-sm">
                  <Info className="w-4 h-4" />
                  자세히 보기
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-6 right-6">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white/80 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      )}
    </section>
  );
}
