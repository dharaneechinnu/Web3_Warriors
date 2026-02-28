/**
 * VideoRoom.js  –  Google Meet-inspired WebRTC video room
 * Route: /room/:roomId
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ─── SVG Icon components ─────────────────────────────────────── */
const Icon = {
  Mic:       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  MicOff:    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  Video:     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  VideoOff:  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Screen:    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  ScreenOff: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="2.5"/></svg>,
  Phone:     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4Z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2.5"/></svg>,
  Chat:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send:      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  People:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Copy:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Info:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

/* ─── helper: get initials ────────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

/* ─── helper: random avatar color from name ──────────────────── */
const avatarColors = ["#1e88e5","#e53935","#43a047","#fb8c00","#8e24aa","#00acc1","#6d4c41","#546e7a"];
const getAvatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
};

/* ─── helper: format clock ───────────────────────────────────── */
const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ═══════════════════════════════════ component ═══════════════════════════ */
export default function VideoRoom() {
  const { roomId }     = useParams();
  const { state }      = useLocation();
  const navigate       = useNavigate();
  const clock          = useClock();

  const userId   = localStorage.getItem("userId");
  const userName = state?.userName || localStorage.getItem("userName") || "You";
  const role     = state?.role || "learner";
  const session  = state?.session || {};

  /* refs */
  const localRef       = useRef(null);
  const remoteRef      = useRef(null);
  const socketRef      = useRef(null);
  const pcRef          = useRef(null);     // RTCPeerConnection
  const localStream    = useRef(null);
  const screenStream   = useRef(null);     // screen capture stream
  const screenSender   = useRef(null);     // RTCRtpSender for screen track
  const remoteStreamRef = useRef(null);    // single MediaStream for all remote tracks
  const chatEndRef     = useRef(null);
  const offerSent      = useRef(false);
  const remoteSockId   = useRef(null);

  /* state */
  const [joined, setJoined]               = useState(false);       // lobby → in-call
  const [connected, setConnected]         = useState(false);
  const [videoOn, setVideoOn]             = useState(true);
  const [audioOn, setAudioOn]             = useState(true);
  const [chatOpen, setChatOpen]           = useState(false);
  const [messages, setMessages]           = useState([]);
  const [chatInput, setChatInput]         = useState("");
  const [status, setStatus]               = useState("Joining room\u2026");
  const [peerName, setPeerName]           = useState("");
  const [screenSharing, setScreenSharing] = useState(false);       // am I sharing?
  const [peerSharing, setPeerSharing]     = useState(false);       // is peer sharing?
  const [cameraReady, setCameraReady]     = useState(false);       // camera acquired?

  /* ── helpers ──────────────────────────────────────────────────────────── */
  const addMsg = (msg) => setMessages(prev => [...prev, msg]);

  /** Attach remoteStreamRef to the remote video element whenever ref mounts */
  const setRemoteVideoRef = useCallback((el) => {
    remoteRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  /** Attach localStream to the local video element whenever ref mounts/changes */
  const setLocalVideoRef = useCallback((el) => {
    localRef.current = el;
    if (el && localStream.current) {
      el.srcObject = localStream.current;
      el.play().catch(() => {});
    }
  }, []);

  const createPC = useCallback((remoteSocketId) => {
    // If existing PC is still open and usable, return it
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      return pcRef.current;
    }
    // Close stale connection if it exists
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (_) {}
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Prepare a single MediaStream to collect all remote tracks
    remoteStreamRef.current = new MediaStream();

    // Add local tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current));
    }

    // Remote stream — simply add every incoming track to one MediaStream
    pc.ontrack = (e) => {
      const track = e.track;
      console.log(`[WebRTC] ontrack: kind=${track.kind}, id=${track.id}`);

      // Avoid duplicates
      const existing = remoteStreamRef.current.getTracks().find(t => t.id === track.id);
      if (!existing) {
        remoteStreamRef.current.addTrack(track);
      }

      // Assign to video element (handles case where ref already mounted)
      if (remoteRef.current) {
        remoteRef.current.srcObject = remoteStreamRef.current;
        remoteRef.current.play().catch(() => {});
      }

      setConnected(true);
      setStatus("Connected");

      // Safety: retry after React re-render mounts the video element
      setTimeout(() => {
        if (remoteRef.current && remoteStreamRef.current) {
          remoteRef.current.srcObject = remoteStreamRef.current;
          remoteRef.current.play().catch(() => {});
        }
      }, 200);
    };

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId, candidate: e.candidate, to: remoteSocketId
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnected(false);
        setStatus("Peer disconnected");
      }
    };

    return pc;
  }, [roomId]);

  /* ── Phase 1: Lobby — acquire camera only (no socket) ────────────────── */
  useEffect(() => {
    let cancelled = false;
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStream.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        setCameraReady(true);
      } catch (err) {
        console.warn("Camera/mic not available:", err.message);
        setCameraReady(true); // still allow joining without camera
      }
    };
    getCamera();
    return () => {
      cancelled = true;
      // Only stop camera if we never joined (cleanup on unmount from lobby)
      if (!joined) {
        localStream.current?.getTracks().forEach(t => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Phase 2: In-call — connect socket + WebRTC after user clicks Join ── */
  useEffect(() => {
    if (!joined) return;
    let socket;

    /* Connect Socket.IO */
    socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected to server. Waiting for peer\u2026");
      socket.emit("join-room", { roomId, userId, userName, role });
    });

    /* 3. Someone already in room → I am the offerer */
    socket.on("room-users", async (others) => {
      if (!others.length) return;
      const other = others[0];
      remoteSockId.current = other.socketId;
      setPeerName(other.userName);
      setStatus(`${other.userName} is already here. Connecting\u2026`);
      offerSent.current = true;

      try {
        const pc = createPC(other.socketId);
        if (pc.signalingState === "closed") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer, to: other.socketId });
      } catch (err) {
        console.warn("Failed to create offer:", err.message);
      }
    });

    /* 4. New peer arrived → wait for offer */
    socket.on("user-connected", ({ socketId, userName: n }) => {
      remoteSockId.current = socketId;
      setPeerName(n);
      setStatus(`${n} joined. Connecting\u2026`);
      createPC(socketId);
    });

    /* 5. Receive offer → answer */
    socket.on("offer", async ({ offer, from }) => {
      if (offerSent.current) return;
      remoteSockId.current = from;
      try {
        const pc = createPC(from);
        if (pc.signalingState === "closed") return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer, to: from });
      } catch (err) {
        console.warn("Failed to handle offer:", err.message);
      }
    });

    /* 6. Receive answer */
    socket.on("answer", async ({ answer }) => {
      const pc = pcRef.current;
      if (pc && pc.signalingState !== "stable") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    /* 7. ICE candidates */
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        const pc = pcRef.current;
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    });

    /* 8. Peer disconnected */
    socket.on("user-disconnected", ({ userName: n }) => {
      setConnected(false);
      setPeerName("");
      setPeerSharing(false);
      setStatus(`${n} left the call.`);
      if (remoteRef.current) remoteRef.current.srcObject = null;
      remoteStreamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      offerSent.current = false;
    });

    /* 9. Peer ended call */
    socket.on("call-ended", () => {
      setConnected(false);
      setPeerName("");
      setPeerSharing(false);
      setStatus("Call ended by peer.");
      if (remoteRef.current) remoteRef.current.srcObject = null;
      remoteStreamRef.current = null;
      if (pcRef.current) {
        try { pcRef.current.close(); } catch (_) {}
        pcRef.current = null;
      }
      offerSent.current = false;
    });

    /* 10. Peer media toggles */
    socket.on("peer-video-toggle", ({ enabled }) => {
      if (remoteRef.current?.srcObject) {
        remoteRef.current.srcObject.getVideoTracks().forEach(t => { t.enabled = enabled; });
      }
    });

    /* 11. Peer screen share signals */
    socket.on("peer-screen-share-started", () => {
      setPeerSharing(true);
    });

    socket.on("peer-screen-share-stopped", () => {
      setPeerSharing(false);
    });

    /* 12. Chat — ignore own messages (server broadcasts to full room) */
    socket.on("room-message", ({ message, userName: n, timestamp, from }) => {
      if (from === socket.id) return;  // already added locally
      addMsg({ text: message, sender: n, ts: timestamp, mine: false });
    });

    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      screenStream.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      socket?.disconnect();
    };
  }, [joined, roomId, userId, userName, role, createPC]);

  /* scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Safety net: re-assign remote srcObject when connected view mounts */
  useEffect(() => {
    if (connected && remoteRef.current && remoteStreamRef.current) {
      remoteRef.current.srcObject = remoteStreamRef.current;
      remoteRef.current.play().catch(() => {});
    }
  }, [connected]);

  /* ── controls ────────────────────────────────────────────────────────────── */
  const handleJoinNow = () => {
    setJoined(true);
    setStatus("Connecting\u2026");
  };

  const toggleVideo = () => {
    if (!localStream.current) return;
    const enabled = !videoOn;
    localStream.current.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setVideoOn(enabled);
    socketRef.current?.emit("toggle-video", { roomId, enabled });
  };

  const toggleAudio = () => {
    if (!localStream.current) return;
    const enabled = !audioOn;
    localStream.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setAudioOn(enabled);
    socketRef.current?.emit("toggle-audio", { roomId, enabled });
  };

  /* ── Screen Sharing ──────────────────────────────────────────────────────── */
  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (screenSharing) {
      // STOP screen sharing — revert to camera
      stopScreenShare();
      return;
    }

    try {
      // Get screen capture stream
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });

      screenStream.current = screen;
      const screenTrack = screen.getVideoTracks()[0];

      // Replace the video track in the peer connection with the screen track
      const videoSender = pc.getSenders().find(s => s.track && s.track.kind === "video");

      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
        screenSender.current = videoSender;
      } else {
        // No existing video sender, add the screen track
        screenSender.current = pc.addTrack(screenTrack, screen);
      }

      setScreenSharing(true);

      // Notify peer about screen share
      socketRef.current?.emit("screen-share-started", { roomId });

      // When user clicks "Stop sharing" in the browser's built-in UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

    } catch (err) {
      console.warn("Screen share error:", err.message);
      // User cancelled the screen share picker — do nothing
    }
  };

  const stopScreenShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    // Stop screen stream tracks
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(t => t.stop());
      screenStream.current = null;
    }

    // Replace screen track back with camera video track
    const cameraTrack = localStream.current?.getVideoTracks()[0];
    if (cameraTrack && screenSender.current) {
      try {
        await screenSender.current.replaceTrack(cameraTrack);
      } catch (err) {
        console.warn("Failed to revert to camera:", err);
      }
    }

    screenSender.current = null;
    setScreenSharing(false);

    // Notify peer
    socketRef.current?.emit("screen-share-stopped", { roomId });
  };

  const endCall = () => {
    // Stop screen share if active
    if (screenSharing) stopScreenShare();

    // Clean up peer connection
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (_) {}
      pcRef.current = null;
    }

    // Stop all local tracks
    localStream.current?.getTracks().forEach(t => t.stop());
    screenStream.current?.getTracks().forEach(t => t.stop());

    socketRef.current?.emit("end-call", { roomId });
    socketRef.current?.disconnect();
    navigate(-1);
  };

  const sendChat = () => {
    const txt = chatInput.trim();
    if (!txt || !socketRef.current) return;
    const ts = new Date().toISOString();
    socketRef.current.emit("room-message", { roomId, message: txt, userName, timestamp: ts });
    addMsg({ text: txt, sender: userName, ts, mine: true });
    setChatInput("");
  };

  /* ── Layout ──────────────────────────────────────────────────────────────── */
  const [hovered, setHovered] = useState(null); // control button hover
  const [copied, setCopied]   = useState(false);

  const copyRoomId = () => {
    navigator.clipboard?.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* avatar component for when video is off */
  const Avatar = ({ name, size = 96 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: getAvatarColor(name), display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 600, color: "#fff",
      letterSpacing: 1, userSelect: "none",
    }}>
      {getInitials(name)}
    </div>
  );

  /* ── render ───────────────────────────────────────────────────────────────── */

  /* ═══════════════════  LOBBY (pre-join)  ═══════════════════════════════════ */
  if (!joined) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "#202124",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif",
        color: "#e8eaed",
      }}>
        {/* Logo / title */}
        <div style={{
          position: "absolute", top: 24, left: 32,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #8ab4f8, #4285f4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {Icon.Video}
          </div>
          <span style={{ fontSize: 20, fontWeight: 500 }}>Meeting</span>
        </div>

        {/* Main lobby layout — preview + join info side by side */}
        <div style={{
          display: "flex", alignItems: "center", gap: 64,
          maxWidth: 960, width: "100%", padding: "0 32px",
        }}>
          {/* Left — Camera preview card */}
          <div style={{
            flex: "0 0 540px", height: 380,
            borderRadius: 16, overflow: "hidden",
            background: "#3c4043", position: "relative",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            {videoOn && localStream.current ? (
              <video
                ref={setLocalVideoRef}
                autoPlay muted playsInline
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                  transform: "scaleX(-1)",
                }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
                background: "#3c4043",
              }}>
                <Avatar name={userName} size={96} />
                {!cameraReady && (
                  <div style={{ fontSize: 13, color: "#9aa0a6" }}>Setting up camera…</div>
                )}
              </div>
            )}

            {/* Overlay controls on preview */}
            <div style={{
              position: "absolute", bottom: 16, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", gap: 12,
            }}>
              <button
                onClick={toggleAudio}
                title={audioOn ? "Turn off microphone" : "Turn on microphone"}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: audioOn ? "rgba(60,64,67,0.9)" : "#ea4335",
                  border: "none", cursor: "pointer", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s",
                }}
              >
                {audioOn ? Icon.Mic : Icon.MicOff}
              </button>
              <button
                onClick={toggleVideo}
                title={videoOn ? "Turn off camera" : "Turn on camera"}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: videoOn ? "rgba(60,64,67,0.9)" : "#ea4335",
                  border: "none", cursor: "pointer", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s",
                }}
              >
                {videoOn ? Icon.Video : Icon.VideoOff}
              </button>
            </div>

            {/* Name tag */}
            <div style={{
              position: "absolute", top: 16, left: 16,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
              padding: "4px 12px", borderRadius: 6,
              fontSize: 13, fontWeight: 500,
            }}>
              {userName}
            </div>
          </div>

          {/* Right — Join info */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.3 }}>
              Ready to join?
            </div>
            <div style={{ fontSize: 15, color: "#9aa0a6", lineHeight: 1.5, maxWidth: 300 }}>
              {session.title
                ? <>Joining: <span style={{ color: "#e8eaed", fontWeight: 500 }}>{session.title}</span></>
                : "No one else is here yet"
              }
            </div>

            {/* Join button */}
            <button
              onClick={handleJoinNow}
              style={{
                background: "#1a73e8",
                border: "none", borderRadius: 24,
                padding: "14px 48px",
                fontSize: 16, fontWeight: 500,
                color: "#fff", cursor: "pointer",
                transition: "background 0.2s, transform 0.1s",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 2px 8px rgba(26,115,232,0.3)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1557b0"; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1a73e8"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              Join now
            </button>

            {/* Room ID row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#303134", borderRadius: 8,
              padding: "10px 18px", fontSize: 13, color: "#9aa0a6",
              marginTop: 8,
            }}>
              <span>Room:</span>
              <code style={{ color: "#8ab4f8", fontFamily: "'Roboto Mono', monospace", fontSize: 13, letterSpacing: 0.5 }}>
                {roomId.length > 16 ? roomId.slice(0, 16) + "…" : roomId}
              </code>
              <button
                onClick={copyRoomId}
                style={{
                  background: "none", border: "none",
                  color: "#8ab4f8", cursor: "pointer",
                  display: "flex", alignItems: "center", padding: 4,
                  borderRadius: 4,
                }}
                title="Copy room ID"
              >
                {copied ? <span style={{ fontSize: 11, color: "#81c995" }}>Copied!</span> : Icon.Copy}
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                localStream.current?.getTracks().forEach(t => t.stop());
                navigate(-1);
              }}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 24, padding: "10px 32px",
                fontSize: 14, color: "#9aa0a6", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#e8eaed"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#9aa0a6"; }}
            >
              Go back
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div style={{
          position: "absolute", bottom: 24,
          fontSize: 12, color: "#5f6368", textAlign: "center",
        }}>
          Your mic and camera can be toggled before or during the call
        </div>
      </div>
    );
  }

  /* ═══════════════════  IN-CALL  ════════════════════════════════════════════ */
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#202124",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif",
      color: "#e8eaed",
    }}>

      {/* ─── Top bar ──────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56,
        background: "#202124",
        zIndex: 20,
      }}>
        {/* Left — room info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #8ab4f8, #4285f4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700,
          }}>
            {Icon.Video}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>
              {session.title || "Meeting"}
            </div>
            <div style={{ fontSize: 12, color: "#9aa0a6", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{clock}</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span
                onClick={copyRoomId}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                title="Click to copy room ID"
              >
                {roomId.slice(0, 10)}…
                {copied
                  ? <span style={{ color: "#81c995", fontSize: 11 }}>Copied!</span>
                  : Icon.Copy
                }
              </span>
            </div>
          </div>
        </div>

        {/* Center — status / screen share indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {screenSharing && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#1a73e8", borderRadius: 20,
              padding: "4px 14px", fontSize: 13, fontWeight: 500,
            }}>
              {Icon.Screen} <span>You are presenting</span>
            </div>
          )}
          {peerSharing && !screenSharing && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#137333", borderRadius: 20,
              padding: "4px 14px", fontSize: 13, fontWeight: 500,
            }}>
              {Icon.Screen} <span>{peerName || "Peer"} is presenting</span>
            </div>
          )}
        </div>

        {/* Right — participant count + chat toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.08)", borderRadius: 20,
            padding: "6px 14px", fontSize: 13, color: "#e8eaed",
          }}>
            {Icon.People}
            <span>{connected ? 2 : 1}</span>
          </div>
          <button
            onClick={() => setChatOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: chatOpen ? "rgba(138,180,248,0.15)" : "rgba(255,255,255,0.08)",
              border: "none", borderRadius: 20,
              padding: "6px 14px", fontSize: 13,
              color: chatOpen ? "#8ab4f8" : "#e8eaed",
              cursor: "pointer", transition: "all 0.2s",
              position: "relative",
            }}
          >
            {Icon.Chat}
            <span>Chat</span>
            {messages.filter(m => !m.mine).length > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 20, height: 20, borderRadius: "50%",
                background: "#ea4335", fontSize: 11, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {messages.filter(m => !m.mine).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ─── Video area ─── */}
        <div style={{
          flex: 1, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "8px 8px 80px 8px", // extra bottom for floating controls
          background: "#202124",
        }}>
          {connected ? (
            <>
              {/* Main video grid */}
              <div style={{
                width: "100%", height: "100%",
                display: "flex", gap: 8,
                alignItems: "stretch",
              }}>
                {/* Remote video — always mounted */}
                <div style={{
                  flex: 1, position: "relative",
                  borderRadius: 12, overflow: "hidden",
                  background: "#3c4043",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <video
                    ref={setRemoteVideoRef}
                    autoPlay playsInline
                    style={{
                      width: "100%", height: "100%",
                      objectFit: "contain",
                      display: "block",
                      background: "#3c4043",
                    }}
                  />
                  {/* Name label */}
                  <div style={{
                    position: "absolute", bottom: 12, left: 12,
                    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                    padding: "4px 12px", borderRadius: 6,
                    fontSize: 13, fontWeight: 500, display: "flex",
                    alignItems: "center", gap: 6,
                  }}>
                    {peerSharing && (
                      <span style={{ color: "#8ab4f8" }}>{Icon.Screen}</span>
                    )}
                    {peerName || "Participant"}
                  </div>
                </div>

                {/* My screen share preview (if I'm sharing) */}
                {screenSharing && screenStream.current && (
                  <div style={{
                    flex: 1, position: "relative",
                    borderRadius: 12, overflow: "hidden",
                    background: "#3c4043",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <video
                      ref={el => { if (el && screenStream.current) el.srcObject = screenStream.current; }}
                      autoPlay playsInline muted
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "contain", display: "block",
                        background: "#202124",
                      }}
                    />
                    <div style={{
                      position: "absolute", bottom: 12, left: 12,
                      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                      padding: "4px 12px", borderRadius: 6,
                      fontSize: 13, fontWeight: 500, display: "flex",
                      alignItems: "center", gap: 6,
                    }}>
                      <span style={{ color: "#8ab4f8" }}>{Icon.Screen}</span>
                      Your screen
                    </div>
                  </div>
                )}
              </div>

              {/* Local PiP */}
              <div style={{
                position: "absolute",
                top: 16, right: chatOpen ? 376 : 16,
                width: 200, height: 150,
                borderRadius: 12, overflow: "hidden",
                background: "#3c4043",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                transition: "right 0.3s ease",
                zIndex: 10, cursor: "move",
              }}>
                {videoOn ? (
                  <video ref={setLocalVideoRef} autoPlay muted playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }} />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#3c4043",
                  }}>
                    <Avatar name={userName} size={56} />
                  </div>
                )}
                <div style={{
                  position: "absolute", bottom: 8, left: 8,
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                  padding: "2px 10px", borderRadius: 6,
                  fontSize: 12, fontWeight: 500,
                }}>
                  You {screenSharing ? "(presenting)" : ""}
                </div>
                {/* Mic indicator dot */}
                <div style={{
                  position: "absolute", bottom: 8, right: 8,
                  width: 24, height: 24, borderRadius: "50%",
                  background: audioOn ? "rgba(0,0,0,0.5)" : "#ea4335",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={audioOn ? "#81c995" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {audioOn ? (
                      <>
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      </>
                    ) : (
                      <>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/>
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </>
          ) : (
            /* ─── Waiting for peer (already joined, socket connected) ─── */
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 20, textAlign: "center", width: "100%", height: "100%",
            }}>
              {/* Large self-view */}
              <div style={{
                width: "100%", maxWidth: 640, height: "60%", maxHeight: 400,
                borderRadius: 12, overflow: "hidden",
                background: "#3c4043", position: "relative",
              }}>
                {videoOn ? (
                  <video ref={setLocalVideoRef} autoPlay muted playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }} />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Avatar name={userName} size={96} />
                  </div>
                )}
                <div style={{
                  position: "absolute", bottom: 12, left: 12,
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                  padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
                }}>
                  You
                </div>
              </div>

              {/* Status */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Animated dots */}
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#8ab4f8",
                      animation: `meetPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 16, color: "#9aa0a6" }}>{status}</span>
              </div>

              {/* Inline pulse animation */}
              <style>{`
                @keyframes meetPulse {
                  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                  40% { opacity: 1; transform: scale(1.1); }
                }
              `}</style>
            </div>
          )}

          {/* ─── Floating controls bar (Google Meet style) — always visible once joined ─── */}
          <div style={{
              position: "absolute", bottom: 16, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 12,
              background: "#303134",
              borderRadius: 28, padding: "8px 16px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
              zIndex: 20,
            }}>
              {/* Mic */}
              <button
                onMouseEnter={() => setHovered("mic")}
                onMouseLeave={() => setHovered(null)}
                onClick={toggleAudio}
                title={audioOn ? "Turn off microphone" : "Turn on microphone"}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: "none", cursor: "pointer",
                  background: audioOn
                    ? (hovered === "mic" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)")
                    : "#ea4335",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                {audioOn ? Icon.Mic : Icon.MicOff}
              </button>

              {/* Video */}
              <button
                onMouseEnter={() => setHovered("vid")}
                onMouseLeave={() => setHovered(null)}
                onClick={toggleVideo}
                title={videoOn ? "Turn off camera" : "Turn on camera"}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: "none", cursor: "pointer",
                  background: videoOn
                    ? (hovered === "vid" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)")
                    : "#ea4335",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                {videoOn ? Icon.Video : Icon.VideoOff}
              </button>

              {/* Screen share */}
              <button
                onMouseEnter={() => setHovered("scr")}
                onMouseLeave={() => setHovered(null)}
                onClick={toggleScreenShare}
                title={screenSharing ? "Stop presenting" : "Present now"}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: "none", cursor: "pointer",
                  background: screenSharing
                    ? "#1a73e8"
                    : (hovered === "scr" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"),
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                {screenSharing ? Icon.ScreenOff : Icon.Screen}
              </button>

              {/* Divider */}
              <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

              {/* End call */}
              <button
                onMouseEnter={() => setHovered("end")}
                onMouseLeave={() => setHovered(null)}
                onClick={endCall}
                title="Leave call"
                style={{
                  width: 56, height: 48, borderRadius: 24,
                  border: "none", cursor: "pointer",
                  background: hovered === "end" ? "#c5221f" : "#ea4335",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                {Icon.Phone}
              </button>
            </div>
        </div>

        {/* ─── Chat panel (Google Meet style) ─── */}
        {chatOpen && (
          <div style={{
            width: 360, display: "flex", flexDirection: "column",
            background: "#303134",
            borderRadius: "12px 0 0 12px",
            margin: "8px 0",
            overflow: "hidden",
          }}>
            {/* Chat header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ fontSize: 16, fontWeight: 500 }}>In-call messages</span>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: "none", border: "none", color: "#9aa0a6",
                  cursor: "pointer", fontSize: 20, lineHeight: 1,
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                title="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "12px 16px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              {messages.length === 0 && (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  flex: 1, gap: 12, color: "#9aa0a6", textAlign: "center",
                }}>
                  {Icon.Chat}
                  <div style={{ fontSize: 14 }}>Messages can only be seen by people in the call</div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: m.mine ? "flex-end" : "flex-start",
                  marginBottom: 2,
                }}>
                  {/* Show sender name if not mine and different from prev */}
                  {!m.mine && (i === 0 || messages[i - 1]?.mine || messages[i - 1]?.sender !== m.sender) && (
                    <div style={{
                      fontSize: 12, color: "#8ab4f8", fontWeight: 500,
                      margin: "8px 0 4px 4px",
                    }}>{m.sender}</div>
                  )}
                  <div style={{
                    padding: "8px 14px", borderRadius: 18,
                    background: m.mine ? "#1a73e8" : "rgba(255,255,255,0.08)",
                    maxWidth: "85%", wordBreak: "break-word",
                    fontSize: 14, lineHeight: 1.45,
                  }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 10, color: "#9aa0a6", margin: "2px 4px 0" }}>
                    {m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex", gap: 8,
            }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Send a message to everyone"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 24, padding: "10px 16px",
                  color: "#e8eaed", fontSize: 14,
                  outline: "none",
                  transition: "border 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#8ab4f8"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "none", cursor: chatInput.trim() ? "pointer" : "default",
                  background: chatInput.trim() ? "#8ab4f8" : "rgba(255,255,255,0.06)",
                  color: chatInput.trim() ? "#202124" : "#5f6368",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {Icon.Send}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
