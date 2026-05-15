"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Minimal typing for YT API
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (sec: number, allow: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (r: number) => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
};
type YTNS = {
  Player: new (
    id: string,
    opts: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: { onReady: () => void; onStateChange: (e: { data: number }) => void };
    }
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};
declare const YT: YTNS;

export function VideoPlayer({
  videoId,
  title,
  onTimeUpdate,
  onDurationChange,
}: {
  videoId: string;
  title: string;
  onTimeUpdate: (sec: number) => void;
  onDurationChange?: (sec: number) => void;
}) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerId = "yt-player";
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(80);
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function init() {
      if (!window.YT || !videoId) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          disablekb: 1,
        },
        events: {
          onReady: () => {
            const d = playerRef.current?.getDuration() ?? 0;
            setDuration(d);
            onDurationChange?.(d);
            setApiReady(true);
          },
          onStateChange: (e) => {
            const ST = window.YT!.PlayerState;
            if (e.data === ST.PLAYING) setIsPlaying(true);
            else if (e.data === ST.PAUSED || e.data === ST.ENDED) setIsPlaying(false);
          },
        },
      });
    }
    if (window.YT?.Player) init();
    else window.onYouTubeIframeAPIReady = init;
    return () => {
      playerRef.current = null;
    };
  }, [videoId]);

  // RAF time poll
  useEffect(() => {
    if (!apiReady) return;
    let raf = 0;
    const loop = () => {
      const t = playerRef.current?.getCurrentTime() ?? 0;
      setCurrentTime(t);
      onTimeUpdate(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [apiReady, onTimeUpdate]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };
  const skip = (s: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(Math.max(0, currentTime + s), true);
  };
  const seekTo = (sec: number) => {
    playerRef.current?.seekTo(sec, true);
  };
  const handleRate = (r: number) => {
    setRate(r);
    playerRef.current?.setPlaybackRate(r);
  };
  const handleVolume = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Empty/invalid videoId fallback
  if (!videoId) {
    return (
      <div className="rounded-xl bg-black aspect-video flex items-center justify-center text-white/60">
        Video chưa có
      </div>
    );
  }

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />
      <div className="rounded-xl bg-black overflow-hidden">
        <div className="relative aspect-video">
          <div id={containerId} className="absolute inset-0 w-full h-full" />
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition group"
            >
              <span className="size-20 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/30 flex items-center justify-center group-hover:scale-105 transition">
                <Play className="size-9 text-white fill-white" />
              </span>
            </button>
          )}
          <div className="absolute top-3 left-3 text-xs text-white/80 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full max-w-[60%] truncate">
            {title}
          </div>
        </div>

        <div className="bg-stone-900 text-white px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="tabular-nums w-12 text-right text-stone-400">
              {formatDuration(currentTime)}
            </span>
            <div
              className="flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seekTo(ratio * duration);
              }}
            >
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="tabular-nums w-12 text-stone-400">{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white/90 hover:text-white">
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white" title="-10s">
              <SkipBack className="size-4" />
            </button>
            <button onClick={() => skip(10)} className="text-white/70 hover:text-white" title="+10s">
              <SkipForward className="size-4" />
            </button>
            <div className="flex gap-1 ml-2">
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRate(r)}
                  className={`text-[11px] px-1.5 py-0.5 rounded ${
                    rate === r ? "bg-brand-600 text-white" : "text-stone-400 hover:text-white"
                  }`}
                >
                  {r}×
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 max-w-32">
              <Volume2 className="size-4 text-stone-400" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolume(Number(e.target.value))}
                className="w-20 accent-brand-500"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
