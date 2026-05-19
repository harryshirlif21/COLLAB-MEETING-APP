import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import VideoTile from './VideoTile';

/**
 * MeetingRoom Component
 * 
 * Implements a responsive, adaptive grid for VideoTiles.
 * 
 * Key features:
 * - auto-fit Grid: Tiles resize dynamically based on container width.
 * - LayoutGroup: Handles smooth 60fps transitions when the grid structure changes.
 * - Side-panel awareness: Adjusts layout when the chat/participant drawer is toggled.
 */
const MeetingRoom = ({ 
  participants = [], 
  activeSpeakerId = null,
  isSidePanelOpen = false 
}) => {
  // Logic to determine grid density based on participant count
  const getMinTileWidth = () => {
    if (participants.length === 1) return 'min(100%, 800px)';
    if (participants.length <= 4) return 'min(100%, 400px)';
    return '280px';
  };

  return (
    <div className="flex flex-col h-screen bg-background-primary text-text-primary overflow-hidden font-sans">
      {/* Main content wrapper */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Responsive Video Grid */}
        <main className={`flex-1 overflow-y-auto px-6 py-8 transition-all duration-500 ease-in-out custom-scrollbar ${
          isSidePanelOpen ? 'lg:mr-[320px]' : ''
        }`}>
          <LayoutGroup>
            <motion.div 
              layout
              className="grid gap-4 w-full h-full max-w-7xl mx-auto"
              style={{
                // auto-fit ensures tiles fill the row, while minmax maintains 16:9 utility
                gridTemplateColumns: `repeat(auto-fit, minmax(${getMinTileWidth()}, 1fr))`,
                justifyContent: 'center',
                alignContent: 'center'
              }}
            >
              <AnimatePresence mode="popLayout">
                {participants.map((participant) => (
                  <VideoTile
                    key={participant.id}
                    userId={participant.id}
                    stream={participant.stream}
                    userName={participant.name}
                    isActive={participant.id === activeSpeakerId}
                    isHost={participant.isHost}
                    handRaised={participant.handRaised}
                    isMuted={participant.isMuted}
                    isSpeaking={participant.isSpeaking}
                    networkQuality={participant.networkQuality}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </main>

        {/* Side Panel (Glassmorphic sidebar) */}
        <AnimatePresence>
          {isSidePanelOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-background-secondary/80 backdrop-blur-2xl border-l border-white/5 z-40 shadow-glass"
            >
              {/* Sidebar Content (Chat/Participants) would be injected here */}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MeetingRoom;