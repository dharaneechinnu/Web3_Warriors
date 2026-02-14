import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const VideoContainer = styled.div`
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  min-height: 400px;
`;

const ProgressOverlay = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const LectureVideoPlayer = ({
  videoUrl,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
  startTime = 0,
  showCompletionOverlay = false
}) => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // when metadata loads, set duration and optionally seek
  const handleLoadedData = () => {
    console.log('🎥 VIDEO PLAYER: Metadata loaded:', {
      duration: videoRef.current?.duration,
      startTime,
      autoPlay,
      videoUrl
    });
    
    setIsLoaded(true);
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      setTotalDuration(dur);
      
      if (startTime > 0) {
        console.log(`⏩ VIDEO PLAYER: Seeking to startTime: ${startTime}s`);
        videoRef.current.currentTime = startTime;
        setProgress((startTime / dur) * 100);
      } else {
        console.log('🆕 VIDEO PLAYER: Starting from beginning');
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && isLoaded && autoPlay) {
      videoRef.current.play().catch(() => {});
    }
  }, [isLoaded, autoPlay]);

  // Handle startTime prop changes (when switching between lectures)
  useEffect(() => {
    if (videoRef.current && isLoaded) {
      console.log('🔄 VIDEO PLAYER: startTime prop changed to:', startTime);
      if (startTime > 0) {
        console.log(`⏩ VIDEO PLAYER: Seeking to new startTime: ${startTime}s`);
        videoRef.current.currentTime = startTime;
        const dur = videoRef.current.duration || 0;
        setProgress(dur > 0 ? (startTime / dur) * 100 : 0);
      } else {
        console.log('🆕 VIDEO PLAYER: Resetting to beginning');
        videoRef.current.currentTime = 0;
        setProgress(0);
      }
    }
  }, [startTime, isLoaded]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    if (dur > 0) {
      const newProgress = Math.round((currentTime / dur) * 100);
      setProgress(newProgress);
      setWatchTime(currentTime);
      setTotalDuration(dur);
      if (typeof onTimeUpdate === 'function') onTimeUpdate(currentTime, dur);
    }
  };

  const handlePlay = () => {
    console.log('▶️ VIDEO PLAYER: Play event triggered');
    if (typeof onPlay === 'function') onPlay();
  };

  const handlePause = () => {
    console.log('⏸️ VIDEO PLAYER: Pause event triggered');
    if (typeof onPause === 'function') onPause();
  };

  const handleVideoEnd = () => {
    console.log('🏁 VIDEO PLAYER: Video ended');
    if (typeof onEnded === 'function') onEnded();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <VideoContainer>
      <Video
        ref={videoRef}
        controls
        preload="metadata"
        onError={(e) => {
          console.error('❌ VIDEO PLAYER: Video error:', e);
          console.error('❌ VIDEO PLAYER: Video URL:', videoUrl);
        }}
        onLoadStart={() => {
          console.log('📼 VIDEO PLAYER: Loading started for:', videoUrl);
          console.log('🎯 VIDEO PLAYER: Expected startTime:', startTime);
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </Video>
      <ProgressOverlay>
        {progress}% watched • {Math.floor(watchTime / 60)}:{(Math.floor(watchTime) % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(Math.floor(totalDuration) % 60).toString().padStart(2, '0')}
      </ProgressOverlay>
    </VideoContainer>
  );
};

export default LectureVideoPlayer;