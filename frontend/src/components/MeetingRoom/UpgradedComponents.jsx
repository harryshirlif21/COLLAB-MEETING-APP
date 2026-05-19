import React from "react";
import { motion } from "framer-motion";
import { designSystem, animationPresets } from "../design/designSystem";

/**
 * VideoTile Component
 * Displays participant video with glassmorphic design
 */
export const VideoTile = React.forwardRef(
  (
    {
      userId,
      isActive = false,
      isHost = false,
      handRaised = false,
      isMuted = false,
      videoRef,
      userName = "Unknown",
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className="relative bg-cover bg-center rounded-2xl overflow-hidden aspect-video"
        style={{
          background: designSystem.colors.background.tertiary,
          border: `1px solid ${designSystem.colors.ui.border}`,
          ...(isActive && {
            boxShadow: `inset 0 0 0 4px ${designSystem.colors.ui.active}`,
          }),
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Name Badge */}
        <motion.div
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(10px)",
            color: designSystem.colors.text.primary,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {userName} {isHost && "👑"}
          {isMuted && " 🔇"}
        </motion.div>

        {/* Hand Raise Badge */}
        {handRaised && (
          <motion.div
            className="absolute top-3 right-3 text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            ✋
          </motion.div>
        )}
      </motion.div>
    );
  }
);

VideoTile.displayName = "VideoTile";

/**
 * ControlBar Component
 * Floating control bar with glassmorphic design
 */
export const ControlBar = ({
  onMicToggle,
  onVideoToggle,
  onScreenShare,
  onReaction,
  onHandRaise,
  isMuted = false,
  isVideoOff = false,
  handRaised = false,
}) => {
  const buttons = [
    {
      icon: isMuted ? "🔇" : "🎤",
      label: isMuted ? "Unmute" : "Mute",
      onClick: onMicToggle,
      color: isMuted ? designSystem.colors.ui.error : designSystem.colors.ui.active,
    },
    {
      icon: isVideoOff ? "🚫" : "📷",
      label: isVideoOff ? "Camera Off" : "Camera On",
      onClick: onVideoToggle,
      color: isVideoOff ? designSystem.colors.ui.error : designSystem.colors.ui.active,
    },
    {
      icon: "🖥️",
      label: "Share Screen",
      onClick: onScreenShare,
      color: designSystem.colors.ui.active,
    },
    {
      icon: handRaised ? "🖐️" : "✋",
      label: handRaised ? "Lower Hand" : "Raise Hand",
      onClick: onHandRaise,
      color: handRaised ? designSystem.colors.ui.warning : designSystem.colors.ui.active,
    },
  ];

  return (
    <motion.div
      className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2 p-3 rounded-2xl"
      style={{
        background: designSystem.colors.background.glass,
        backdropFilter: "blur(10px)",
        border: `1px solid ${designSystem.colors.ui.border}`,
        boxShadow: designSystem.shadow.glass,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {buttons.map((btn) => (
        <motion.button
          key={btn.label}
          onClick={btn.onClick}
          className="w-11 h-11 rounded-lg flex items-center justify-center text-xl font-semibold"
          style={{
            background: btn.color,
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={btn.label}
        >
          {btn.icon}
        </motion.button>
      ))}
    </motion.div>
  );
};

/**
 * ChatMessage Component
 */
export const ChatMessage = ({ sender, text, timestamp, isOwn = false }) => {
  return (
    <motion.div
      className="mb-3 text-sm"
      {...animationPresets.fadeInUp}
    >
      <div style={{ color: designSystem.colors.text.secondary }}>
        <span style={{ color: designSystem.colors.text.accent, fontWeight: 600 }}>
          {sender}
        </span>
        <span style={{ fontSize: "0.75rem", marginLeft: "8px" }}>
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p style={{ color: designSystem.colors.text.primary, marginTop: "4px" }}>
        {text}
      </p>
    </motion.div>
  );
};

/**
 * ParticipantCard Component
 */
export const ParticipantCard = ({ user, role, isMuted, onMute, onRemove }) => {
  return (
    <motion.div
      className="p-3 rounded-lg flex items-center justify-between"
      style={{
        background: designSystem.colors.background.tertiary,
        border: `1px solid ${designSystem.colors.ui.border}`,
      }}
      {...animationPresets.fadeInUp}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full"
          style={{
            background: designSystem.colors.ui.active,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {user?.name?.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: "0.875rem", color: designSystem.colors.text.primary }}>
            {user?.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: designSystem.colors.text.secondary }}>
            {role} {isMuted && "🔇"}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {onMute && (
          <button
            onClick={onMute}
            className="px-2 py-1 rounded text-xs"
            style={{
              background: designSystem.colors.ui.error,
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Mute
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="px-2 py-1 rounded text-xs"
            style={{
              background: designSystem.colors.ui.error,
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * RecordingIndicator Component
 */
export const RecordingIndicator = ({ duration, onStop }) => {
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <motion.div
      className="fixed top-20 right-6 flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        background: designSystem.colors.background.glass,
        backdropFilter: "blur(10px)",
        border: `1px solid ${designSystem.colors.ui.error}`,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        className="w-3 h-3 rounded-full"
        style={{ background: designSystem.colors.ui.error }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      />
      <span style={{ color: designSystem.colors.ui.error, fontWeight: 700 }}>
        REC {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      {onStop && (
        <button
          onClick={onStop}
          style={{
            background: designSystem.colors.ui.error,
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "0.75rem",
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          Stop
        </button>
      )}
    </motion.div>
  );
};

export default {
  VideoTile,
  ControlBar,
  ChatMessage,
  ParticipantCard,
  RecordingIndicator,
};
