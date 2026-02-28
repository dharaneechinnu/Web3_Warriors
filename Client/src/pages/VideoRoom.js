/**
 * VideoRoom.js
 * Full WebRTC video call room with Screen Sharing using Socket.IO signaling.
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

/* ─── minimal inline styles ──────────────────────────────────── */
const S = {
  root: {
    position: "fixed", inset: 0, background: "#0a0f1e", display: "flex",
    flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", color: "#fff",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.75rem 1.25rem",
    background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)",
    zIndex: 10,
  },
  title: { fontWeight: 700, fontSize: "1rem" },
  pill: (on) => ({
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.78rem",
    background: on ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
    color: on ? "#86efac" : "#fca5a5",
  }),
  videos: {
    flex: 1, display: "grid", gap: "0.75rem", padding: "0.75rem",
    overflow: "hidden",
  },
  videoWrap: {
    position: "relative", borderRadius: "0.75rem", overflow: "hidden",
    background: "#111827", display: "flex", alignItems: "center", justifyContent: "center",
  },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  screenVideo: { width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" },
  label: {
    position: "absolute", bottom: "0.5rem", left: "0.75rem",
    background: "rgba(0,0,0,0.6)", padding: "0.2rem 0.6rem",
    borderRadius: "0.5rem", fontSize: "0.75rem",
  },
  screenLabel: {
    position: "absolute", top: "0.5rem", left: "0.75rem",
    background: "rgba(124,58,237,0.8)", padding: "0.25rem 0.7rem",
    borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
  },
  localWrap: {
    position: "absolute", bottom: "1rem", right: "1rem",
    width: 180, height: 135, borderRadius: "0.6rem", overflow: "hidden",
    border: "2px solid rgba(124,58,237,0.6)", zIndex: 5,
    background: "#111827",
  },
  controls: {
    display: "flex", justifyContent: "center", gap: "0.75rem",
    padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },
  ctrl: (active, danger) => ({
    width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
    fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center",
    background: danger ? "rgba(239,68,68,0.85)"
              : active  ? "rgba(255,255,255,0.12)"
              : "rgba(239,68,68,0.25)",
    color: danger ? "#fff" : active ? "#fff" : "#ef4444",
    transition: "background 0.15s",
  }),
  ctrlScreen: (sharing) => ({
    width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
    fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center",
    background: sharing ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.12)",
    color: "#fff", transition: "background 0.15s",
    boxShadow: sharing ? "0 0 15px rgba(124,58,237,0.5)" : "none",
  }),
  chat: {
    width: 300, display: "flex", flexDirection: "column",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.3)",
  },
  chatMessages: { flex: 1, overflowY: "auto", padding: "0.75rem", fontSize: "0.82rem" },
  chatMsg: (mine) => ({
    marginBottom: "0.6rem", textAlign: mine ? "right" : "left",
  }),
  chatBubble: (mine) => ({
    display: "inline-block", padding: "0.4rem 0.75rem", borderRadius: "0.75rem",
    background: mine ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)",
    maxWidth: "80%", wordBreak: "break-word",
  }),
  chatInput: {
    display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "0.5rem", gap: "0.4rem",
  },
  waitBanner: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "1rem", color: "#94a3b8",
  },
};

/* ═══════════════════════════════════ component ═══════════════════════════ */
export default function VideoRoom() {
  const { roomId }     = useParams();
  const { state }      = useLocation();
  const navigate       = useNavigate();

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

  /* ── helpers ──────────────────────────────────────────────────────────── */
  const addMsg = (msg) => setMessages(prev => [...prev, msg]);

  /** Attach remoteStreamRef to the remote video element whenever ref mounts */
  const setRemoteVideoRef = useCallback((el) => {
    remoteRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
    }
  }, []);

  const createPC = useCallback((remoteSocketId) => {
    if (pcRef.current) return pcRef.current;

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
      }

      setConnected(true);
      setStatus("Connected");
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

  /* ── Main setup ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    let socket;

    const start = async () => {
      /* 1. Get local media */
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStream.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
      } catch (err) {
        console.warn("Camera/mic not available:", err.message);
        setStatus("Camera unavailable \u2014 audio only");
      }

      /* 2. Connect Socket.IO */
      socket = io(SOCKET_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        setStatus("Connected to server. Waiting for peer\u2026");
        socket.emit("join-room", { roomId, userId, userName, role });
      });

      /* 3. Someone already in room \u2192 I am the offerer */
      socket.on("room-users", async (others) => {
        if (!others.length) return;
        const other = others[0];
        remoteSockId.current = other.socketId;
        setPeerName(other.userName);
        setStatus(`${other.userName} is already here. Connecting\u2026`);
        offerSent.current = true;

        const pc = createPC(other.socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer, to: other.socketId });
      });

      /* 4. New peer arrived \u2192 wait for offer */
      socket.on("user-connected", ({ socketId, userName: n }) => {
        remoteSockId.current = socketId;
        setPeerName(n);
        setStatus(`${n} joined. Connecting\u2026`);
        createPC(socketId);
      });

      /* 5. Receive offer \u2192 answer */
      socket.on("offer", async ({ offer, from }) => {
        if (offerSent.current) return;
        remoteSockId.current = from;
        const pc = createPC(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer, to: from });
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
        setStatus("Call ended by peer.");
        setConnected(false);
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
    };

    start();

    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      screenStream.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      socket?.disconnect();
    };
  }, [roomId, userId, userName, role, createPC]);

  /* scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── controls ────────────────────────────────────────────────────────────── */
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
    socketRef.current?.emit("end-call", { roomId });
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

  /* ── render ───────────────────────────────────────────────────────────────── */
  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>{"\uD83C\uDFA5"} {session.title || `Room: ${roomId.slice(0, 8)}\u2026`}</div>
          <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginTop:"0.1rem" }}>
            {session.duration && `\u23F1 ${session.duration} min`}
            {screenSharing && <span style={{ marginLeft: "0.75rem", color: "#a78bfa", fontWeight: 700 }}>{"\uD83D\uDCBB"} You are sharing your screen</span>}
            {peerSharing && !screenSharing && <span style={{ marginLeft: "0.75rem", color: "#06b6d4", fontWeight: 700 }}>{"\uD83D\uDCBB"} {peerName || "Peer"} is sharing their screen</span>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <span style={S.pill(connected)}>{connected ? `\uD83D\uDFE2 ${peerName || "Peer"} connected` : `\u23F3 ${status}`}</span>
          <button
            onClick={() => setChatOpen(o => !o)}
            style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff",
                     padding:"0.35rem 0.85rem", borderRadius:"0.5rem", cursor:"pointer", fontSize:"0.85rem" }}>
            {"\uD83D\uDCAC"} Chat {messages.filter(m=>!m.mine).length > 0 && `(${messages.filter(m=>!m.mine).length})`}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Video area */}
        <div style={{ flex:1, position:"relative", padding:"0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Main video area — always render ONE remote video element so the ref never unmounts */}
          <div style={{ flex: 1, display: "flex", gap: "0.75rem", minHeight: 0 }}>

            {/* Remote video — ALWAYS mounted */}
            <div style={{ ...S.videoWrap, flex: 1, position: "relative" }}>
              {connected ? (
                <>
                  <video
                    ref={setRemoteVideoRef}
                    autoPlay
                    playsInline
                    style={peerSharing ? S.screenVideo : S.video}
                  />
                  {/* Label changes based on screen share state */}
                  {peerSharing ? (
                    <div style={S.screenLabel}>{"\uD83D\uDCBB"} {peerName || "Peer"}'s Screen</div>
                  ) : (
                    peerName && <div style={S.label}>{peerName}</div>
                  )}
                </>
              ) : (
                <div style={S.waitBanner}>
                  <div style={{ fontSize:"3rem" }}>{"\uD83D\uDCF9"}</div>
                  <div style={{ fontWeight:600 }}>{status}</div>
                  <div style={{ fontSize:"0.85rem" }}>Room ID: <code style={{color:"#a78bfa"}}>{roomId}</code></div>
                  <div style={{ fontSize:"0.8rem", opacity:0.6 }}>Share this room link to invite the other participant</div>
                </div>
              )}
            </div>

            {/* When I'm screen-sharing, show my screen locally for reference */}
            {screenSharing && screenStream.current && (
              <div style={{ ...S.videoWrap, flex: 1, position: "relative" }}>
                <video
                  ref={el => { if (el && screenStream.current) el.srcObject = screenStream.current; }}
                  autoPlay playsInline muted
                  style={S.screenVideo}
                />
                <div style={S.screenLabel}>{"\uD83D\uDCBB"} Your Screen</div>
              </div>
            )}
          </div>

          {/* Local video (PiP) */}
          <div style={S.localWrap}>
            <video ref={localRef} autoPlay muted playsInline style={S.video} />
            <div style={S.label}>You{screenSharing ? " (sharing)" : ""}</div>
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div style={S.chat}>
            <div style={{ padding:"0.75rem", borderBottom:"1px solid rgba(255,255,255,0.08)", fontWeight:600, fontSize:"0.9rem" }}>
              {"\uD83D\uDCAC"} In-call chat
            </div>
            <div style={S.chatMessages}>
              {messages.length === 0 && <div style={{ color:"#64748b", marginTop:"1rem", textAlign:"center" }}>No messages yet</div>}
              {messages.map((m, i) => (
                <div key={i} style={S.chatMsg(m.mine)}>
                  {!m.mine && <div style={{ fontSize:"0.7rem", color:"#94a3b8", marginBottom:"0.15rem" }}>{m.sender}</div>}
                  <span style={S.chatBubble(m.mine)}>{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={S.chatInput}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Type a message\u2026"
                style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                         borderRadius:"0.4rem", padding:"0.4rem 0.6rem", color:"#fff", fontSize:"0.85rem" }}
              />
              <button onClick={sendChat}
                style={{ background:"rgba(124,58,237,0.7)", border:"none", borderRadius:"0.4rem",
                         padding:"0.4rem 0.75rem", color:"#fff", cursor:"pointer" }}>
                {"\u27A4"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={S.controls}>
        <button style={S.ctrl(audioOn, false)} onClick={toggleAudio} title={audioOn ? "Mute" : "Unmute"}>
          {audioOn ? "\uD83C\uDF99\uFE0F" : "\uD83D\uDD07"}
        </button>
        <button style={S.ctrl(videoOn, false)} onClick={toggleVideo} title={videoOn ? "Stop video" : "Start video"}>
          {videoOn ? "\uD83D\uDCF9" : "\uD83D\uDEAB"}
        </button>
        <button
          style={S.ctrlScreen(screenSharing)}
          onClick={toggleScreenShare}
          title={screenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          {screenSharing ? "\uD83D\uDEAB" : "\uD83D\uDCBB"}
        </button>
        <button style={S.ctrl(false, true)} onClick={endCall} title="End call">
          {"\uD83D\uDCF5"}
        </button>
      </div>
    </div>
  );
}
