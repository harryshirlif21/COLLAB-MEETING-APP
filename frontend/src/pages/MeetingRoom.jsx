import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

// ✅ No hardcoded URL — socket.io-client connects to same origin automatically
// Nginx proxies /socket.io/ requests to the backend

const fmt = (s) => (s < 10 ? `0${s}` : `${s}`);
const REACTIONS = ["👍", "👏", "❤️", "😂", "😮", "🔥"];
const isMobile = () => window.innerWidth < 768;

export default function MeetingRoom() {
  const { code } = useParams();
  const navigate = useNavigate();

  const socketRef        = useRef(null);
  const localStreamRef   = useRef(null);
  const screenStreamRef  = useRef(null);
  const peersRef         = useRef({});
  const localVideoRef    = useRef(null);
  const screenVideoRef   = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef  = useRef([]);
  const chatEndRef       = useRef(null);

  const [remoteStreams,     setRemoteStreams]     = useState({});
  const [participants,      setParticipants]      = useState([]);
  const [micEnabled,        setMicEnabled]        = useState(true);
  const [cameraEnabled,     setCameraEnabled]     = useState(true);
  const [connectionStatus,  setConnectionStatus]  = useState("Connecting…");
  const [mediaError,        setMediaError]        = useState("");
  const [isHost,            setIsHost]            = useState(false);
  const [mobile,            setMobile]            = useState(isMobile());
  const [showSidebar,       setShowSidebar]       = useState(false);

  const [messages,      setMessages]      = useState([]);
  const [messageInput,  setMessageInput]  = useState("");

  const [isSharingScreen,   setIsSharingScreen]   = useState(false);
  const [remoteScreen,      setRemoteScreen]      = useState(null);

  const [slides,        setSlides]        = useState([]);
  const [slideIndex,    setSlideIndex]    = useState(0);
  const [showSlides,    setShowSlides]    = useState(false);

  const [isRecording,   setIsRecording]   = useState(false);
  const [recSeconds,    setRecSeconds]    = useState(0);

  const [handRaised,    setHandRaised]    = useState(false);
  const [raisedHands,   setRaisedHands]   = useState(new Set());
  const [reactions,     setReactions]     = useState([]);
  const [activeTab,     setActiveTab]     = useState("chat");

  const [showBreakout,      setShowBreakout]      = useState(false);
  const [breakoutRooms,     setBreakoutRooms]     = useState([]);
  const [numRooms,          setNumRooms]          = useState(2);
  const [myBreakoutRoom,    setMyBreakoutRoom]    = useState(null);
  const [breakoutInput,     setBreakoutInput]     = useState("");
  const [breakoutTimer,     setBreakoutTimer]     = useState(0);
  const [breakoutDuration,  setBreakoutDuration]  = useState(10);

  useEffect(() => {
    const handler = () => setMobile(isMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const createPeerConnection = useCallback((userId) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "turn:openrelay.metered.ca:80",  username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
      ],
    });

    peer.oniceconnectionstatechange = () => console.log(`[ICE] ${userId.slice(0,8)}: ${peer.iceConnectionState}`);
    peer.onconnectionstatechange    = () => console.log(`[PEER] ${userId.slice(0,8)}: ${peer.connectionState}`);

    peer.onicecandidate = (e) => {
      if (e.candidate)
        socketRef.current?.emit("signal", { to: userId, candidate: e.candidate });
    };

    peer.ontrack = (e) => {
      console.log(`[TRACK] received from ${userId.slice(0,8)}`, e.streams[0]);
      setRemoteStreams((prev) => ({ ...prev, [userId]: e.streams[0] }));
    };

    localStreamRef.current?.getTracks().forEach((t) => peer.addTrack(t, localStreamRef.current));
    return peer;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (socketRef.current) socketRef.current._host_id = payload.id;
    } catch {}

    // ✅ Connect to same origin — Nginx proxies /socket.io/ to backend:5000
    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on("connect",       () => console.log("[SOCKET] Connected:", socket.id));
    socket.on("connect_error", (err) => {
      console.error("[SOCKET] connect_error:", err.message);
      setConnectionStatus(`Failed: ${err.message}`);
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socket.emit("join-meeting", code);
        setConnectionStatus("Connected");
      })
      .catch((err) => {
        console.warn("[MEDIA] getUserMedia failed:", err.message);
        setMediaError("Camera/mic denied — joining without video.");
        socket.emit("join-meeting", code);
        setConnectionStatus("Connected (no media)");
      });

    socket.on("meeting-meta", ({ hostId }) => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsHost(payload.id === hostId);
      } catch {}
    });

    socket.on("meeting-users", (users) => { setParticipants(users); });

    socket.on("user-joined", async (userId) => {
      const peer = createPeerConnection(userId);
      peersRef.current[userId] = peer;
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("signal", { to: userId, offer });
      } catch (e) { console.error("[WebRTC] offer error:", e); }
    });

    socket.on("signal", async ({ from, offer, answer, candidate }) => {
      let peer = peersRef.current[from];
      if (!peer) { peer = createPeerConnection(from); peersRef.current[from] = peer; }
      try {
        if (offer) {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const ans = await peer.createAnswer();
          await peer.setLocalDescription(ans);
          socket.emit("signal", { to: from, answer: ans });
        }
        if (answer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
        if (candidate && peer.remoteDescription) await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.error("[WebRTC] signal error:", e); }
    });

    socket.on("user-left", (userId) => {
      peersRef.current[userId]?.close();
      delete peersRef.current[userId];
      setRemoteStreams((p) => { const u = { ...p }; delete u[userId]; return u; });
      setParticipants((p) => p.filter((id) => id !== userId));
      setRaisedHands((p) => { const u = new Set(p); u.delete(userId); return u; });
    });

    socket.on("chat-message",       (msg)          => { setMessages((p) => [...p, msg]); setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50); });
    socket.on("screen-share-started", ({ userId }) => setRemoteScreen({ userId }));
    socket.on("screen-share-stopped", ()           => setRemoteScreen(null));
    socket.on("slide-update",       ({ slides: s, index }) => { setSlides(s); setSlideIndex(index); setShowSlides(true); });
    socket.on("slide-navigate",     ({ index })    => setSlideIndex(index));
    socket.on("slides-closed",      ()             => setShowSlides(false));
    socket.on("hand-raised",        ({ userId })   => setRaisedHands((p) => new Set([...p, userId])));
    socket.on("hand-lowered",       ({ userId })   => setRaisedHands((p) => { const u = new Set(p); u.delete(userId); return u; }));
    socket.on("reaction",           ({ emoji })    => {
      const id = Date.now() + Math.random();
      const x  = 10 + Math.random() * 80;
      setReactions((p) => [...p, { id, emoji, x }]);
      setTimeout(() => setReactions((p) => p.filter((r) => r.id !== id)), 2500);
    });
    socket.on("breakout-rooms-created",  ({ rooms, duration }) => { setBreakoutRooms(rooms); setBreakoutTimer(duration * 60); setShowBreakout(true); });
    socket.on("breakout-join-ack",       ({ roomId })          => setMyBreakoutRoom(roomId));
    socket.on("breakout-ended",          ()                    => { setMyBreakoutRoom(null); setShowBreakout(false); setBreakoutRooms([]); });
    socket.on("breakout-rooms-update",   ({ rooms })           => setBreakoutRooms(rooms));

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach((p) => p.close());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [code, navigate, createPeerConnection]);

  useEffect(() => {
    if (breakoutTimer <= 0) return;
    const t = setInterval(() => setBreakoutTimer((s) => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [breakoutTimer]);

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  const toggleMic    = () => { const t = localStreamRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !micEnabled;    setMicEnabled((v) => !v); } };
  const toggleCamera = () => { const t = localStreamRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !cameraEnabled; setCameraEnabled((v) => !v); } };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
      const screenTrack = stream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });
      setIsSharingScreen(true);
      socketRef.current?.emit("screen-share-started", { code });
      screenTrack.onended = stopScreenShare;
    } catch (e) { console.error("Screen share error:", e); }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) Object.values(peersRef.current).forEach((peer) => { const sender = peer.getSenders().find((s) => s.track?.kind === "video"); sender?.replaceTrack(camTrack); });
    setIsSharingScreen(false);
    socketRef.current?.emit("screen-share-stopped", { code });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.readAsDataURL(file);
    }))).then((dataURLs) => {
      setSlides(dataURLs); setSlideIndex(0); setShowSlides(true);
      socketRef.current?.emit("slide-update", { code, slides: dataURLs, index: 0 });
    });
  };

  const navigateSlide = (dir) => {
    const next = Math.max(0, Math.min(slides.length - 1, slideIndex + dir));
    setSlideIndex(next);
    socketRef.current?.emit("slide-navigate", { code, index: next });
  };

  const closeSlides    = () => { setShowSlides(false); socketRef.current?.emit("slides-closed", { code }); };
  const startRecording = () => {
    const stream = localStreamRef.current; if (!stream) return;
    recordChunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(recordChunksRef.current, { type: "video/webm" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `meeting-${code}-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    mr.start(); mediaRecorderRef.current = mr; setIsRecording(true); setRecSeconds(0);
  };

  const stopRecording  = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };
  const toggleHand     = () => { const next = !handRaised; setHandRaised(next); socketRef.current?.emit(next ? "raise-hand" : "lower-hand", { code }); };
  const sendReaction   = (emoji) => socketRef.current?.emit("reaction", { code, emoji });
  const sendMessage    = () => { if (!messageInput.trim()) return; socketRef.current?.emit("chat-message", { code, text: messageInput, timestamp: new Date().toISOString() }); setMessageInput(""); };
  const createBreakoutRooms = () => { const n = Math.max(2, Math.min(10, numRooms)); socketRef.current?.emit("create-breakout-rooms", { code, numRooms: n, duration: breakoutDuration }); };
  const joinBreakoutRoom = () => {
    const n = parseInt(breakoutInput, 10);
    if (!n || n < 1 || n > breakoutRooms.length) return alert(`Enter a room number between 1 and ${breakoutRooms.length}`);
    const room = breakoutRooms[n - 1];
    socketRef.current?.emit("join-breakout-room", { code, roomId: room.id });
    setMyBreakoutRoom(room.id);
  };
  const endBreakoutRooms = () => socketRef.current?.emit("end-breakout-rooms", { code });

  const leaveMeeting = () => {
    if (isRecording) stopRecording();
    socketRef.current?.disconnect();
    Object.values(peersRef.current).forEach((p) => p.close());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/dashboard");
  };

  const styles = {
    root:        { minHeight: "100vh", background: "#0f1117", color: "#e8eaf0", fontFamily: "'DM Sans', sans-serif", padding: "0" },
    topBar:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: mobile ? "10px 14px" : "14px 24px", background: "#16181f", borderBottom: "1px solid #23262f" },
    topLeft:     { display: "flex", flexDirection: "column" },
    topTitle:    { fontSize: mobile ? "0.9rem" : "1.1rem", fontWeight: 700, letterSpacing: "0.02em" },
    statusDot:   (ok) => ({ fontSize: "0.78rem", color: ok ? "#4ade80" : "#f87171", marginTop: "2px" }),
    mainGrid:    { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 340px", gap: "0", height: mobile ? "auto" : "calc(100vh - 57px)", minHeight: mobile ? "calc(100vh - 57px)" : "auto" },
    videoArea:   { padding: mobile ? "12px" : "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" },
    videoGrid:   { display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" },
    videoCard:   { position: "relative", background: "#1a1d27", borderRadius: "14px", overflow: "hidden", aspectRatio: "16/9" },
    videoEl:     { width: "100%", height: "100%", objectFit: "cover" },
    videoLabel:  { position: "absolute", bottom: "8px", left: "10px", background: "rgba(0,0,0,0.65)", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 },
    handBadge:   { position: "absolute", top: "8px", right: "10px", fontSize: "1.2rem" },
    controls:    { display: "flex", gap: "8px", flexWrap: "wrap", padding: "0 0 4px" },
    btn:         (color, active) => ({ padding: mobile ? "8px 12px" : "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: mobile ? "0.78rem" : "0.85rem", transition: "all 0.15s", background: active === false ? "#2d3044" : color, color: active === false ? "#6b7280" : "#fff" }),
    leaveBtn:    { padding: mobile ? "8px 12px" : "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: mobile ? "0.78rem" : "0.85rem", background: "#dc2626", color: "#fff" },
    recBadge:    { display: "flex", alignItems: "center", gap: "6px", background: "#1a1d27", padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", color: "#f87171", fontWeight: 700 },
    sidebar:     { background: "#16181f", borderLeft: "1px solid #23262f", display: mobile ? (showSidebar ? "flex" : "none") : "flex", flexDirection: "column", ...(mobile && showSidebar ? { position: "fixed", inset: 0, zIndex: 100 } : {}) },
    tabs:        { display: "flex", borderBottom: "1px solid #23262f" },
    tab:         (active) => ({ flex: 1, padding: "13px 0", textAlign: "center", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", background: "none", border: "none", color: active ? "#818cf8" : "#6b7280", borderBottom: active ? "2px solid #818cf8" : "2px solid transparent" }),
    sideContent: { flex: 1, overflowY: "auto", padding: "16px" },
    chatMsg:     { marginBottom: "10px", fontSize: "0.88rem", lineHeight: 1.5 },
    chatSender:  { color: "#818cf8", fontWeight: 700, marginRight: "6px" },
    chatInput:   { display: "flex", gap: "8px", padding: "12px 16px", borderTop: "1px solid #23262f" },
    input:       { flex: 1, background: "#23262f", border: "1px solid #2d3044", borderRadius: "8px", padding: "9px 12px", color: "#e8eaf0", fontSize: "0.88rem" },
    sendBtn:     { background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontWeight: 700 },
    reactionBtn: { fontSize: "1.4rem", background: "#1a1d27", border: "1px solid #2d3044", borderRadius: "50%", width: "44px", height: "44px", cursor: "pointer", transition: "transform 0.1s" },
    floatEmoji:  (x) => ({ position: "fixed", bottom: "140px", left: `${x}%`, fontSize: "2rem", animation: "floatUp 2.5s ease-out forwards", pointerEvents: "none", zIndex: 100 }),
    modal:       { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
    modalBox:    { background: "#1a1d27", borderRadius: "16px", padding: "32px", width: "460px", maxWidth: "95vw" },
    modalTitle:  { fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" },
    slideBox:    { position: "fixed", inset: 0, background: "#000", zIndex: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
    chatFab:     { position: "fixed", bottom: "20px", right: "20px", width: "52px", height: "52px", borderRadius: "50%", background: "#4f46e5", border: "none", fontSize: "1.4rem", cursor: "pointer", zIndex: 50, boxShadow: "0 4px 16px rgba(79,70,229,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
  };

  const isConnected = connectionStatus.startsWith("Connected");

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-120px)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#16181f} ::-webkit-scrollbar-thumb{background:#2d3044;border-radius:4px}
      `}</style>

      {reactions.map((r) => <div key={r.id} style={styles.floatEmoji(r.x)}>{r.emoji}</div>)}

      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.topTitle}>📹 {code}</span>
          <span style={styles.statusDot(isConnected)}>● {connectionStatus}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isRecording && (
            <div style={styles.recBadge}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
              REC {fmt(Math.floor(recSeconds / 60))}:{fmt(recSeconds % 60)}
            </div>
          )}
          <button onClick={leaveMeeting} style={styles.leaveBtn}>Leave</button>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.videoArea}>
          {mediaError && <div style={{ background: "#78350f", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>⚠️ {mediaError}</div>}

          <div style={styles.videoGrid}>
            <div style={styles.videoCard}>
              <video ref={localVideoRef} autoPlay muted playsInline style={styles.videoEl} />
              <span style={styles.videoLabel}>You {handRaised ? "✋" : ""}</span>
            </div>
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div key={id} style={styles.videoCard}>
                <video autoPlay playsInline style={styles.videoEl} ref={(v) => { if (v && v.srcObject !== stream) v.srcObject = stream; }} />
                <span style={styles.videoLabel}>{id.slice(0, 8)}</span>
                {raisedHands.has(id) && <span style={styles.handBadge}>✋</span>}
              </div>
            ))}
            {isSharingScreen && (
              <div style={{ ...styles.videoCard, border: "2px solid #818cf8" }}>
                <video ref={screenVideoRef} autoPlay muted playsInline style={styles.videoEl} />
                <span style={styles.videoLabel}>Your Screen</span>
              </div>
            )}
          </div>

          <div style={styles.controls}>
            <button onClick={toggleMic}    style={styles.btn("#4f46e5", micEnabled)}>   {micEnabled    ? "🎤 Mic"  : "🔇 Muted"}</button>
            <button onClick={toggleCamera} style={styles.btn("#4f46e5", cameraEnabled)}>{cameraEnabled ? "📷 Cam"  : "🚫 Off"}</button>
            {!isSharingScreen ? <button onClick={startScreenShare} style={styles.btn("#0891b2")}>🖥️ Share</button>
                              : <button onClick={stopScreenShare}  style={styles.btn("#dc2626")}>⏹ Stop</button>}
            {isHost && !isRecording && <button onClick={startRecording} style={styles.btn("#7c3aed")}>⏺ Rec</button>}
            {isHost &&  isRecording && <button onClick={stopRecording}  style={styles.btn("#dc2626")}>⏹ Save</button>}
            <button onClick={toggleHand} style={styles.btn(handRaised ? "#d97706" : "#374151")}>{handRaised ? "✋ Lower" : "✋ Hand"}</button>
            {isHost && (
              <label style={{ ...styles.btn("#065f46"), display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                📂 Files
                <input type="file" accept="image/*,.pdf" multiple onChange={handleFileUpload} style={{ display: "none" }} />
              </label>
            )}
            {isHost && <button onClick={() => setShowBreakout(true)} style={styles.btn("#9333ea")}>🏠 Breakout</button>}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {REACTIONS.map((emoji) => <button key={emoji} onClick={() => sendReaction(emoji)} style={styles.reactionBtn}>{emoji}</button>)}
          </div>
        </div>

        <div style={styles.sidebar}>
          {mobile && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #23262f" }}>
              <span style={{ fontWeight: 700 }}>Chat & Participants</span>
              <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
          )}
          <div style={styles.tabs}>
            {["chat", "participants", "files"].map((t) => (
              <button key={t} style={styles.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
                {t === "chat" ? "💬" : t === "participants" ? `👥 ${participants.length + 1}` : "📁"}
              </button>
            ))}
          </div>

          <div style={styles.sideContent}>
            {activeTab === "chat" && (
              <>
                {messages.length === 0 && <p style={{ color: "#4b5563", fontSize: "0.85rem" }}>No messages yet.</p>}
                {messages.map((m, i) => <div key={i} style={styles.chatMsg}><span style={styles.chatSender}>{m.sender}</span>{m.text}</div>)}
                <div ref={chatEndRef} />
              </>
            )}
            {activeTab === "participants" && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ padding: "8px 0", fontSize: "0.88rem", color: "#4ade80", borderBottom: "1px solid #23262f" }}>👤 You {isHost ? "👑" : ""} {handRaised ? "✋" : ""}</li>
                {participants.map((id) => (
                  <li key={id} style={{ padding: "8px 0", fontSize: "0.88rem", color: "#d1d5db", borderBottom: "1px solid #1f2937" }}>👤 {id.slice(0, 12)}… {raisedHands.has(id) ? "✋" : ""}</li>
                ))}
              </ul>
            )}
            {activeTab === "files" && (
              <div>
                {slides.length === 0
                  ? <p style={{ color: "#4b5563", fontSize: "0.85rem" }}>{isHost ? "Use Share Files to present." : "No files shared yet."}</p>
                  : <div><p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "12px" }}>{slides.length} file(s) · Slide {slideIndex + 1}/{slides.length}</p><button onClick={() => setShowSlides(true)} style={styles.btn("#4f46e5")}>▶ View</button></div>
                }
              </div>
            )}
          </div>

          {activeTab === "chat" && (
            <div style={styles.chatInput}>
              <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message…" style={styles.input} />
              <button onClick={sendMessage} style={styles.sendBtn}>→</button>
            </div>
          )}
        </div>
      </div>

      {mobile && !showSidebar && (
        <button style={styles.chatFab} onClick={() => setShowSidebar(true)}>
          💬
          {messages.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", borderRadius: "50%", width: 16, height: 16, fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{messages.length > 9 ? "9+" : messages.length}</span>}
        </button>
      )}

      {showSlides && slides.length > 0 && (
        <div style={styles.slideBox}>
          <img src={slides[slideIndex]} alt={`Slide ${slideIndex + 1}`} style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }} />
          <div style={{ display: "flex", gap: "16px", marginTop: "20px", alignItems: "center" }}>
            <button onClick={() => navigateSlide(-1)} disabled={slideIndex === 0} style={{ ...styles.btn("#4f46e5"), opacity: slideIndex === 0 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: "0.9rem", color: "#9ca3af" }}>{slideIndex + 1} / {slides.length}</span>
            <button onClick={() => navigateSlide(1)} disabled={slideIndex === slides.length - 1} style={{ ...styles.btn("#4f46e5"), opacity: slideIndex === slides.length - 1 ? 0.4 : 1 }}>Next →</button>
            {isHost && <button onClick={closeSlides} style={styles.btn("#dc2626")}>✕ Close</button>}
          </div>
        </div>
      )}

      {showBreakout && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2 style={styles.modalTitle}>🏠 Breakout Rooms</h2>
            {isHost && breakoutRooms.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div><label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Number of rooms (2–10)</label><input type="number" min={2} max={10} value={numRooms} onChange={(e) => setNumRooms(Number(e.target.value))} style={{ ...styles.input, display: "block", marginTop: "6px", width: "100px" }} /></div>
                <div><label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Duration (minutes)</label><input type="number" min={1} max={60} value={breakoutDuration} onChange={(e) => setBreakoutDuration(Number(e.target.value))} style={{ ...styles.input, display: "block", marginTop: "6px", width: "100px" }} /></div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={createBreakoutRooms} style={styles.btn("#9333ea")}>Create Rooms</button>
                  <button onClick={() => setShowBreakout(false)} style={styles.btn("#374151")}>Cancel</button>
                </div>
              </div>
            )}
            {breakoutRooms.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {breakoutTimer > 0 && <div style={{ fontSize: "0.9rem", color: "#fbbf24", fontWeight: 700 }}>⏱ {fmt(Math.floor(breakoutTimer / 60))}:{fmt(breakoutTimer % 60)} remaining</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {breakoutRooms.map((room, i) => (
                    <div key={room.id} style={{ background: myBreakoutRoom === room.id ? "#312e81" : "#23262f", borderRadius: "10px", padding: "12px", fontSize: "0.85rem" }}>
                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>Room {i + 1}</div>
                      <div style={{ color: "#9ca3af" }}>{room.members?.length || 0} participant(s)</div>
                    </div>
                  ))}
                </div>
                {!isHost && !myBreakoutRoom && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input type="number" min={1} max={breakoutRooms.length} value={breakoutInput} onChange={(e) => setBreakoutInput(e.target.value)} placeholder={`Room # (1–${breakoutRooms.length})`} style={{ ...styles.input, width: "160px" }} />
                    <button onClick={joinBreakoutRoom} style={styles.btn("#9333ea")}>Join</button>
                  </div>
                )}
                {myBreakoutRoom && !isHost && <p style={{ color: "#4ade80", fontSize: "0.88rem" }}>✅ Room {breakoutRooms.findIndex(r => r.id === myBreakoutRoom) + 1}</p>}
                <div style={{ display: "flex", gap: "10px" }}>
                  {isHost && <button onClick={endBreakoutRooms} style={styles.btn("#dc2626")}>End All</button>}
                  <button onClick={() => setShowBreakout(false)} style={styles.btn("#374151")}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
