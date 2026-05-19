import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * VideoTile Component
 * A premium, glassmorphic video container for meeting participants.
 * 
 * Features:
 * - Framer Motion layout animations
 * - Active speaker glow highlight
 * - Glassmorphic name and status badges
 * - Academic hand-raise indicator
 * - Real-time speaking animation
 */
const VideoTile = ({
  userId,
  stream,
  userName,
  isActive,      // Set true if user is the current active speaker
  isHost,        // Shows host crown badge
  handRaised,    // Shows ordered hand-raise badge
  isMuted,       // Shows mute indicator and dims video
  isSpeaking,    // Triggers audio visualization bars
  networkQuality = 'good' // 'good', 'fair', 'poor'
}) => {
  const videoRef = useRef(null);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl aspect-video bg-background-secondary border-2 transition-all duration-500 ${
        isActive 
          ? 'border-primary shadow-glow ring-2 ring-primary/20 z-10' 
          : 'border-white/5 shadow-glass'
      }`}
    >
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={userId === 'me'}
        className={`w-full h-full object-cover transition-all duration-700 ${
          isMuted && userId !== 'me' ? 'opacity-40 grayscale-[0.5] scale-105' : 'opacity-100 scale-100'
        }`}
      />

      {/* Top Left: Mute Indicator */}
      <AnimatePresence>
        {isMuted && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="absolute top-3 left-3 p-1.5 rounded-lg bg-danger/80 backdrop-blur-md border border-white/10 z-20"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <line x1="1" y1="1" x2="23" y2="23" stroke="white" strokeWidth={2} />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right: Hand Raise Badge (Academic Feature) */}
      <AnimatePresence>
        {handRaised && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/90 backdrop-blur-md border border-white/20 z-20 shadow-lg"
          >
            <span className="text-sm">✋</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Left: Glassmorphic Name Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/60 backdrop-blur-xl border border-white/10 z-20 max-w-[85%]">
        <span className="text-sm font-semibold text-text-primary truncate">
          {userName || `Student_${userId.substring(0, 4)}`}
          {userId === 'me' && <span className="ml-1 text-text-muted opacity-70 font-normal">(You)</span>}
        </span>
        
        {isHost && (
          <div className="flex items-center justify-center p-1 bg-primary/20 rounded-md border border-primary/30">
            <svg className="w-3 h-3 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}

        {/* Audio Visualizer (Speaking Indicator) */}
        {isSpeaking && !isMuted && (
          <div className="flex gap-0.5 items-end h-3 mb-0.5">
            {[0.1, 0.3, 0.2].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 12, 6] }}
                transition={{ repeat: Infinity, duration: 0.6, delay }}
                className="w-0.5 bg-primary-light rounded-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Right: Network Status */}
      <div className="absolute bottom-4 right-4 flex gap-1 items-end opacity-60 hover:opacity-100 transition-opacity">
        {[6, 10, 14].map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-colors ${
              networkQuality === 'poor' && i > 0 ? 'bg-white/20' : 
              networkQuality === 'fair' && i > 1 ? 'bg-white/20' : 
              networkQuality === 'poor' ? 'bg-danger' :
              networkQuality === 'fair' ? 'bg-warning' : 'bg-secondary'
            }`}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      {/* Overlay for inactive video (Academic Lecture Mode) */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-tertiary/90 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <span className="text-2xl font-display text-text-muted">
              {(userName || userId).charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-text-muted uppercase tracking-widest font-medium">Camera Off</span>
        </div>
      )}
    </motion.div>
  );
};

export default VideoTile;