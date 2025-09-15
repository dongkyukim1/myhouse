"use client";

import React, { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  videoId?: string;
  title?: string;
};

export default function VideoModal({ open, onClose, videoId, title }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [open, onClose]);

  if (!open || !videoId) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Container */}
        <div className="relative aspect-video bg-neutral-900">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?origin=${typeof window !== 'undefined' ? window.location.origin : ''}&rel=0&modestbranding=1&showinfo=0&autoplay=1`}
            title={title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-t border-neutral-100">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg lg:text-xl font-semibold text-neutral-900 pr-4">
                {title}
              </h3>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Open in YouTube */}
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="YouTube에서 보기"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">YouTube에서 보기</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">닫기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
