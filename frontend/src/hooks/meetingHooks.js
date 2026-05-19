/**
 * Custom React Hooks for Meeting Features
 */

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useChat Hook
 * Manages chat state and Socket.IO integration
 */
export const useChat = (socket, meetingCode) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const sendMessage = useCallback(() => {
    if (!messageInput.trim()) return;
    socket?.emit("chat-message", {
      code: meetingCode,
      text: messageInput,
      timestamp: new Date().toISOString(),
    });
    setMessageInput("");
  }, [socket, meetingCode, messageInput]);

  const deleteMessage = useCallback(
    (messageId) => {
      socket?.emit("chat-message-delete", { code: meetingCode, message_id: messageId });
    },
    [socket, meetingCode]
  );

  const editMessage = useCallback(
    (messageId, newContent) => {
      socket?.emit("chat-message-edit", {
        code: meetingCode,
        message_id: messageId,
        new_content: newContent,
      });
    },
    [socket, meetingCode]
  );

  useEffect(() => {
    socket?.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket?.on("chat-message-deleted", ({ message_id }) => {
      setMessages((prev) => prev.filter((m) => m.message_id !== message_id));
    });

    socket?.on("chat-message-edited", ({ message_id, new_content, edited_at }) => {
      setMessages((prev) =>
        prev.map((m) => (m.message_id === message_id ? { ...m, content: new_content, edited_at } : m))
      );
    });

    return () => {
      socket?.off("chat-message");
      socket?.off("chat-message-deleted");
      socket?.off("chat-message-edited");
    };
  }, [socket]);

  return {
    messages,
    messageInput,
    setMessageInput,
    sendMessage,
    deleteMessage,
    editMessage,
  };
};

/**
 * useHandRaise Hook
 * Manages hand raise queue
 */
export const useHandRaise = (socket, meetingCode) => {
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [queue, setQueue] = useState([]);

  const raiseHand = useCallback(() => {
    socket?.emit("raise-hand", { code: meetingCode });
    setHandRaised(true);
  }, [socket, meetingCode]);

  const lowerHand = useCallback(() => {
    socket?.emit("lower-hand", { code: meetingCode });
    setHandRaised(false);
  }, [socket, meetingCode]);

  const approveHand = useCallback(
    (userId) => {
      socket?.emit("hand-raise-approve", { code: meetingCode, user_id: userId });
    },
    [socket, meetingCode]
  );

  useEffect(() => {
    socket?.on("hand-raised", ({ userId, queue_position }) => {
      setRaisedHands((prev) => new Set([...prev, userId]));
      setQueue((prev) => [...prev, { userId, position: queue_position }]);
    });

    socket?.on("hand-lowered", ({ userId }) => {
      setRaisedHands((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setQueue((prev) => prev.filter((h) => h.userId !== userId));
    });

    socket?.on("hand-raise-approved", ({ user_id }) => {
      setQueue((prev) => prev.filter((h) => h.userId !== user_id));
    });

    return () => {
      socket?.off("hand-raised");
      socket?.off("hand-lowered");
      socket?.off("hand-raise-approved");
    };
  }, [socket]);

  return {
    handRaised,
    raiseHand,
    lowerHand,
    raisedHands,
    queue,
    approveHand,
  };
};

/**
 * useRecording Hook
 * Manages meeting recording
 */
export const useRecording = (socket, meetingCode, isHost) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);

  const startRecording = useCallback(() => {
    socket?.emit("recording-started", { code: meetingCode });
    setIsRecording(true);
  }, [socket, meetingCode]);

  const stopRecording = useCallback(() => {
    socket?.emit("recording-stopped", { code: meetingCode, duration_seconds: recDuration });
    setIsRecording(false);
    setRecDuration(0);
  }, [socket, meetingCode, recDuration]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    socket?.on("recording-started", () => {
      setIsRecording(true);
    });

    socket?.on("recording-stopped", () => {
      setIsRecording(false);
    });

    return () => {
      socket?.off("recording-started");
      socket?.off("recording-stopped");
    };
  }, [socket]);

  return {
    isRecording,
    recDuration,
    startRecording: isHost ? startRecording : null,
    stopRecording: isHost ? stopRecording : null,
  };
};

/**
 * useScreenShare Hook
 * Manages screen sharing
 */
export const useScreenShare = (socket, meetingCode, peersRef) => {
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      screenStreamRef.current = stream;
      const screenTrack = stream.getVideoTracks()[0];

      // Replace video track in all peer connections
      Object.values(peersRef.current || {}).forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });

      socket?.emit("screen-share-started", { code: meetingCode });
      setIsSharingScreen(true);

      screenTrack.onended = stopScreenShare;
    } catch (err) {
      console.error("[Screen Share Error]", err);
    }
  }, [socket, meetingCode, peersRef]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    socket?.emit("screen-share-stopped", { code: meetingCode });
    setIsSharingScreen(false);
  }, [socket, meetingCode]);

  return {
    isSharingScreen,
    startScreenShare,
    stopScreenShare,
    screenStreamRef,
  };
};

/**
 * useAttendance Hook
 * Auto-log attendance
 */
export const useAttendance = (socket, meetingCode, userId) => {
  useEffect(() => {
    // Log join (sent by Socket.IO in join-meeting handler)
    socket?.emit("join-meeting", meetingCode);

    return () => {
      // Log leave automatically on disconnect
      socket?.disconnect();
    };
  }, [socket, meetingCode, userId]);
};

/**
 * useParticipants Hook
 * Manages participant list
 */
export const useParticipants = (socket) => {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    socket?.on("meeting-users", (users) => {
      setParticipants(users);
    });

    socket?.on("user-joined", (userId) => {
      setParticipants((prev) => [...prev, userId]);
    });

    socket?.on("user-left", (userId) => {
      setParticipants((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket?.off("meeting-users");
      socket?.off("user-joined");
      socket?.off("user-left");
    };
  }, [socket]);

  return { participants };
};

export default {
  useChat,
  useHandRaise,
  useRecording,
  useScreenShare,
  useAttendance,
  useParticipants,
};
