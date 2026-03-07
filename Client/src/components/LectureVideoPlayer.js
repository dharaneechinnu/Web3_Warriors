import React, { useRef, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (seconds) => {
  const s = Math.floor(seconds || 0);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

/**
 * Probe the video URL via fetch() to get a human-readable diagnosis.
 * Called after the <video> fires an error event.
 */
async function diagnoseVideoUrl(url) {
  if (!url) return 'No video URL provided.';

  // Normalise: if the URL is absolute but the host differs from current API_BASE_URL,
  // rewrite it so we always hit the running server (handles stale localhost: entries).
  let probeUrl = url;
  try {
    const parsed = new URL(url);
    const apiParsed = new URL(API_BASE_URL);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      // Replace host:port with the configured API host:port
      parsed.host = apiParsed.host;
      parsed.protocol = apiParsed.protocol;
      probeUrl = parsed.toString();
    }
  } catch (_) { /* not a full URL — leave as-is */ }

  try {
    const res = await fetch(probeUrl, { method: 'HEAD', mode: 'cors' });
    if (res.status === 404) return `Video file not found on the server (404). The mentor may need to re-upload this lecture.`;
    if (res.status === 403 || res.status === 401) return `Access denied to this video (${res.status}).`;
    if (res.status >= 500) return `Server error (${res.status}). Please try again later.`;
    if (res.ok) {
      const ct = res.headers.get('Content-Type') || '';
      if (!ct.startsWith('video/')) {
        return `The server returned an unexpected file type (${ct || 'unknown'}). Try re-uploading the lecture video.`;
      }
      // 200 + video/ type but browser still errored → codec/format mismatch
      return `Video codec or format not supported by your browser. Try using Chrome or a different device.`;
    }
    return `Unexpected server response (${res.status}). Please try again.`;
  } catch (fetchErr) {
    if (fetchErr.name === 'TypeError') {
      return `Cannot reach the video server. Make sure the server is running on ${API_BASE_URL}.`;
    }
    return `Network error: ${fetchErr.message}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
const LectureVideoPlayer = ({
  videoUrl,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
  startTime = 0,
  showCompletionOverlay = false,
}) => {
  const videoRef = useRef(null);
  const [progress, setProgress]             = useState(0);
  const [watchTime, setWatchTime]           = useState(0);
  const [totalDuration, setTotalDuration]   = useState(0);
  const [hasError, setHasError]             = useState(false);
  const [errorMsg, setErrorMsg]             = useState('');
  // Incrementing retryKey forces <video> to unmount/remount on retry.
  const [retryKey, setRetryKey]             = useState(0);

  // Keep a ref so event handlers always see the latest startTime without
  // needing it in their dependency array.
  const startTimeRef = useRef(startTime);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  // ── Reset state whenever the video URL changes (lecture switch) ────────────
  useEffect(() => {
    setProgress(0);
    setWatchTime(0);
    setTotalDuration(0);
    setHasError(false);
    setErrorMsg('');
  }, [videoUrl]);

  // ── Event handlers (inline JSX props — no stale closure risk) ─────────────

  const handleLoadedData = () => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || 0;
    setTotalDuration(dur);
    console.log('🎥 VIDEO PLAYER: Metadata loaded — duration:', dur, 'startTime:', startTimeRef.current);

    if (startTimeRef.current > 0 && dur > 0) {
      console.log(`⏩ VIDEO PLAYER: Seeking to ${startTimeRef.current}s`);
      video.currentTime = startTimeRef.current;
      setProgress((startTimeRef.current / dur) * 100);
    }
    if (autoPlay) {
      video.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const cur = video.currentTime;
    const dur = video.duration;
    const pct = Math.round((cur / dur) * 100);
    setProgress(pct);
    setWatchTime(cur);
    if (typeof onTimeUpdate === 'function') onTimeUpdate(cur, dur);
  };

  const handleError = async () => {
    const video = videoRef.current;
    const code  = video?.error?.code;
    console.error('❌ VIDEO PLAYER: Error (code', code, ') — URL:', videoUrl);
    // Show a loading placeholder while we probe the URL
    setHasError(true);
    setErrorMsg('Checking video… please wait.');
    const diagnosis = await diagnoseVideoUrl(videoUrl);
    setErrorMsg(diagnosis);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMsg('');
    setProgress(0);
    setWatchTime(0);
    setRetryKey(k => k + 1);
  };

  // ── No URL ─────────────────────────────────────────────────────────────────
  if (!videoUrl) {
    return (
      <div style={{
        width: '100%', minHeight: 300, background: '#0f172a',
        borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 8,
        color: '#64748b', fontSize: '0.95rem',
      }}>
        <span style={{ fontSize: '2rem' }}>🎬</span>
        <span>No video available for this lecture.</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <div style={{
        width: '100%', minHeight: 300, background: '#0f172a',
        borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '1rem',
        padding: '2rem',
      }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '0.6rem', padding: '0.8rem 1.2rem',
          color: '#fca5a5', fontSize: '0.9rem', textAlign: 'center', maxWidth: 400,
        }}>
          {errorMsg}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', maxWidth: 360 }}>
          If this persists, the video file may still be processing or the server may be unavailable.
        </div>
        <button
          onClick={handleRetry}
          style={{
            padding: '0.55rem 1.4rem', borderRadius: '0.6rem',
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            border: 'none', color: '#fff', fontWeight: 700,
            fontSize: '0.88rem', cursor: 'pointer',
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // ── Normal player ──────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', background: '#000', borderRadius: 8,
      overflow: 'hidden', position: 'relative',
    }}>
      {/* key=retryKey forces a true DOM remount on retry */}
      <video
        key={retryKey}
        ref={videoRef}
        src={videoUrl}
        controls
        preload="metadata"
        style={{ width: '100%', minHeight: 400, display: 'block' }}
        onLoadStart={() => {
          console.log('📼 VIDEO PLAYER: Loading started for:', videoUrl);
          console.log('🎯 VIDEO PLAYER: Expected startTime:', startTimeRef.current);
        }}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => typeof onPlay === 'function' && onPlay()}
        onPause={() => typeof onPause === 'function' && onPause()}
        onEnded={() => typeof onEnded === 'function' && onEnded()}
        onError={handleError}
      />

      {/* Watch progress overlay */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        background: 'rgba(0,0,0,0.75)', color: '#e2e8f0',
        padding: '6px 12px', borderRadius: 4, fontSize: '0.85rem',
        pointerEvents: 'none',
      }}>
        {progress}% watched &bull; {fmtTime(watchTime)} / {fmtTime(totalDuration)}
      </div>
    </div>
  );
};

export default LectureVideoPlayer;
