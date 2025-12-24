import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';

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
  courseId, 
  lectureId, 
  sectionId,
  lectureDuration,
  onProgressUpdate,
  onLectureComplete,
  onCourseProgressUpdate 
}) => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const userId = localStorage.getItem('userId');

  const updateProgress = async (videoProgress, completed = false) => {
    if (!userId) return;

    try {
      const response = await api.post('/courses/updateLectureProgress', {
        learnerId: userId,
        courseId,
        lectureId,
        sectionId,
        completed,
        videoProgress,
        watchTime: Math.round(watchTime),
        totalDuration: Math.round(totalDuration)
      });

      // Update course overall progress if server returns it
      if (response.data.courseProgress && onCourseProgressUpdate) {
        onCourseProgressUpdate(response.data.courseProgress);
      }

      if (onProgressUpdate) {
        onProgressUpdate(videoProgress, completed);
      }

      if (completed && onLectureComplete) {
        onLectureComplete(lectureId);
      }
    } catch (error) {
      console.error('Error updating lecture progress:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (duration > 0) {
      const newProgress = Math.round((currentTime / duration) * 100);
      setProgress(newProgress);
      setWatchTime(currentTime);
      setTotalDuration(duration);

      // Save progress every 10% increment or every 30 seconds
      if (newProgress - lastSavedProgress >= 10 || 
          (Math.round(currentTime) % 30 === 0 && Math.round(currentTime) !== Math.round(lastSavedProgress))) {
        updateProgress(newProgress);
        setLastSavedProgress(newProgress);
      }

      // Mark as completed when 90% watched
      if (newProgress >= 90 && !isCompleted) {
        setIsCompleted(true);
        updateProgress(newProgress, true);
      }
    }
  };

  const handleVideoEnd = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      updateProgress(100, true);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleVideoEnd);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [isCompleted, lastSavedProgress]);

  return (
    <VideoContainer>
      <Video
        ref={videoRef}
        controls
        preload="metadata"
        onError={(e) => console.error('Video error:', e)}
        onLoadStart={() => console.log('Video loading started:', videoUrl)}
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