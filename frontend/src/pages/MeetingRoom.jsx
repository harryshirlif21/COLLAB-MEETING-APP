import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  Hand, Hand as HandRaised, MessageSquare, Users, FileText, 
  PhoneOff, Radio, X, Send, ChevronLeft, ChevronRight, 
  Crown, Clock, MoreVertical
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";

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
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { auth: { token } });
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

  const isConnected = connectionStatus.startsWith("Connected");

  const tabData = [
    { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "participants", label: `Participants (${participants.length + 1})`, icon: <Users className="w-4 h-4" /> },
    { id: "files", label: "Files", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex flex-col">
      {/* Floating Reactions */}
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -120 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 }}
            className="fixed bottom-36 text-4xl pointer-events-none z-50"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="h-14 bg-surface border-b border-white/10 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5 text-primary" />
          <span className="font-semibold font-display">{code}</span>
          <span className={`text-xs font-medium ${isConnected ? 'text-secondary' : 'text-danger'}`}>
            ● {connectionStatus}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg text-danger text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              REC {fmt(Math.floor(recSeconds / 60))}:{fmt(recSeconds % 60)}
            </div>
          )}
          <Button onClick={leaveMeeting} variant="danger" size="sm">
            <PhoneOff className="w-4 h-4" />
            Leave
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className={`flex-1 flex ${mobile ? 'flex-col' : ''}`}>
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
          {mediaError && (
            <div className="bg-warning/20 border border-warning/30 text-warning p-3 rounded-xl text-sm">
              ⚠️ {mediaError}
            </div>
          )}

          {/* Video Grid */}
          <div className={`grid ${mobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {/* Local Video */}
            <Card className="relative overflow-hidden aspect-video p-0">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-white">
                You {handRaised && <HandRaised className="w-3 h-3 inline ml-1" />}
              </div>
            </Card>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <Card key={id} className="relative overflow-hidden aspect-video p-0">
                <video 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover" 
                  ref={(v) => { if (v && v.srcObject !== stream) v.srcObject = stream; }} 
                />
                <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-white">
                  {id.slice(0, 8)}
                </div>
                {raisedHands.has(id) && (
                  <div className="absolute top-3 right-3">
                    <HandRaised className="w-6 h-6 text-warning" />
                  </div>
                )}
              </Card>
            ))}

            {/* Screen Share */}
            {isSharingScreen && (
              <Card className="relative overflow-hidden aspect-video p-0 border-2 border-primary">
                <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-white">
                  Your Screen
                </div>
              </Card>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={toggleMic} 
              variant={micEnabled ? "primary" : "ghost"}
              size="sm"
              className="flex items-center gap-2"
            >
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {micEnabled ? "Mic" : "Muted"}
            </Button>
            <Button 
              onClick={toggleCamera} 
              variant={cameraEnabled ? "primary" : "ghost"}
              size="sm"
              className="flex items-center gap-2"
            >
              {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              {cameraEnabled ? "Camera" : "Off"}
            </Button>
            {!isSharingScreen ? (
              <Button onClick={startScreenShare} variant="accent" size="sm" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Share
              </Button>
            ) : (
              <Button onClick={stopScreenShare} variant="danger" size="sm" className="flex items-center gap-2">
                <MonitorOff className="w-4 h-4" />
                Stop
              </Button>
            )}
            {isHost && !isRecording && (
              <Button onClick={startRecording} variant="primary" size="sm" className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Record
              </Button>
            )}
            {isHost && isRecording && (
              <Button onClick={stopRecording} variant="danger" size="sm" className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Save
              </Button>
            )}
            <Button 
              onClick={toggleHand} 
              variant={handRaised ? "warning" : "ghost"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Hand className="w-4 h-4" />
              {handRaised ? "Lower" : "Raise Hand"}
            </Button>
            {isHost && (
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/20 text-secondary hover:bg-secondary/30 cursor-pointer transition-colors text-sm font-semibold">
                <FileText className="w-4 h-4" />
                Share Files
                <input type="file" accept="image/*,.pdf" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            )}
            {isHost && (
              <Button onClick={() => setShowBreakout(true)} variant="primary" size="sm" className="flex items-center gap-2">
                <MoreVertical className="w-4 h-4" />
                Breakout Rooms
              </Button>
            )}
          </div>

          {/* Reactions */}
          <div className="flex flex-wrap gap-2">
            {REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => sendReaction(emoji)}
                className="w-11 h-11 rounded-full bg-surface border border-white/10 text-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className={`${mobile ? (showSidebar ? 'fixed inset-0 z-50' : 'hidden') : 'w-80'} bg-surface border-l border-white/10 flex flex-col`}>
          {mobile && (
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-semibold">Chat & Participants</span>
              <button onClick={() => setShowSidebar(false)} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <Tabs tabs={tabData} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 overflow-auto p-4">
            {activeTab === "chat" && (
              <>
                {messages.length === 0 && (
                  <p className="text-text-muted text-sm text-center py-8">No messages yet.</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className="mb-3 text-sm leading-relaxed">
                    <span className="text-primary font-semibold mr-2">{m.sender}</span>
                    <span className="text-text-secondary">{m.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </>
            )}
            {activeTab === "participants" && (
              <ul className="space-y-2">
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 text-secondary text-sm">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">You</span>
                  {isHost && <Crown className="w-4 h-4 text-warning" />}
                  {handRaised && <HandRaised className="w-4 h-4" />}
                </li>
                {participants.map((id) => (
                  <li key={id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-text-primary text-sm">
                    <Users className="w-4 h-4 text-text-muted" />
                    <span>{id.slice(0, 12)}…</span>
                    {raisedHands.has(id) && <HandRaised className="w-4 h-4 text-warning" />}
                  </li>
                ))}
              </ul>
            )}
            {activeTab === "files" && (
              <div>
                {slides.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">
                    {isHost ? "Use Share Files to present." : "No files shared yet."}
                  </p>
                ) : (
                  <div className="text-center">
                    <p className="text-text-secondary text-sm mb-4">
                      {slides.length} file(s) · Slide {slideIndex + 1}/{slides.length}
                    </p>
                    <Button onClick={() => setShowSlides(true)} variant="primary" size="sm">
                      View Slides
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === "chat" && (
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
                className="flex-1"
              />
              <Button onClick={sendMessage} size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Chat FAB */}
      {mobile && !showSidebar && (
        <button 
          onClick={() => setShowSidebar(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center text-2xl z-40"
        >
          <MessageSquare className="w-6 h-6" />
          {messages.length > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white text-xs font-bold flex items-center justify-center">
              {messages.length > 9 ? "9+" : messages.length}
            </span>
          )}
        </button>
      )}

      {/* Slides Modal */}
      {showSlides && slides.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
          <img 
            src={slides[slideIndex]} 
            alt={`Slide ${slideIndex + 1}`} 
            className="max-w-full max-h-[80vh] object-contain rounded-2xl"
          />
          <div className="flex items-center gap-4 mt-6">
            <Button 
              onClick={() => navigateSlide(-1)} 
              disabled={slideIndex === 0}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="text-text-secondary text-sm">
              {slideIndex + 1} / {slides.length}
            </span>
            <Button 
              onClick={() => navigateSlide(1)} 
              disabled={slideIndex === slides.length - 1}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
            {isHost && (
              <Button onClick={closeSlides} variant="danger" size="sm">
                <X className="w-4 h-4" />
                Close
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Breakout Rooms Modal */}
      <Modal
        isOpen={showBreakout}
        onClose={() => setShowBreakout(false)}
        title="Breakout Rooms"
        size="md"
      >
        {isHost && breakoutRooms.length === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-2 block">Number of rooms (2–10)</label>
              <Input 
                type="number" 
                min={2} 
                max={10} 
                value={numRooms} 
                onChange={(e) => setNumRooms(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-2 block">Duration (minutes)</label>
              <Input 
                type="number" 
                min={1} 
                max={60} 
                value={breakoutDuration} 
                onChange={(e) => setBreakoutDuration(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={createBreakoutRooms} className="flex-1">
                Create Rooms
              </Button>
              <Button onClick={() => setShowBreakout(false)} variant="ghost" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
        {breakoutRooms.length > 0 && (
          <div className="space-y-4">
            {breakoutTimer > 0 && (
              <div className="flex items-center gap-2 text-warning font-semibold">
                <Clock className="w-4 h-4" />
                {fmt(Math.floor(breakoutTimer / 60))}:{fmt(breakoutTimer % 60)} remaining
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {breakoutRooms.map((room, i) => (
                <div 
                  key={room.id} 
                  className={`p-4 rounded-xl ${
                    myBreakoutRoom === room.id 
                      ? 'bg-primary/20 border border-primary/50' 
                      : 'bg-surface border border-white/10'
                  }`}
                >
                  <div className="font-semibold mb-1">Room {i + 1}</div>
                  <div className="text-text-secondary text-sm">{room.members?.length || 0} participant(s)</div>
                </div>
              ))}
            </div>
            {!isHost && !myBreakoutRoom && (
              <div className="flex gap-3 items-center">
                <Input 
                  type="number" 
                  min={1} 
                  max={breakoutRooms.length} 
                  value={breakoutInput} 
                  onChange={(e) => setBreakoutInput(e.target.value)}
                  placeholder={`Room # (1–${breakoutRooms.length})`}
                  className="w-40"
                />
                <Button onClick={joinBreakoutRoom} variant="primary">
                  Join
                </Button>
              </div>
            )}
            {myBreakoutRoom && !isHost && (
              <p className="text-secondary font-semibold">
                ✓ Room {breakoutRooms.findIndex(r => r.id === myBreakoutRoom) + 1}
              </p>
            )}
            <div className="flex gap-3">
              {isHost && (
                <Button onClick={endBreakoutRooms} variant="danger">
                  End All
                </Button>
              )}
              <Button onClick={() => setShowBreakout(false)} variant="ghost">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
