/**
 * WebRTC Signaling Server via Socket.IO
 *
 * Flow:
 *  1. Both mentor & learner navigate to /room/:roomId
 *  2. Each emits  `join-room`  with { roomId, userId, userName, role }
 *  3. Server places them in a Socket.IO room and announces peers
 *  4. First peer to arrive becomes the "offerer" and emits `offer`
 *  5. Server relays offer → second peer; second peer replies with `answer`
 *  6. ICE candidates are relayed bidirectionally
 *  7. On disconnect the room is notified
 */

const rooms = {}; // roomId → [ { socketId, userId, userName, role } ]

module.exports = (io) => {
    io.on('connection', (socket) => {

        // ── JOIN ROOM ──────────────────────────────────────────────────────────
        socket.on('join-room', ({ roomId, userId, userName, role }) => {
            if (!roomId) return;

            socket.join(roomId);

            if (!rooms[roomId]) rooms[roomId] = [];

            // Remove stale entry for the same user (reconnect)
            rooms[roomId] = rooms[roomId].filter(p => p.userId !== userId);

            // track per-user metadata (including presenting state)
            rooms[roomId].push({ socketId: socket.id, userId, userName, role, isPresenting: false });

            console.log(`[join-room] socket=${socket.id} userId=${userId} userName=${userName} role=${role} room=${roomId}`);
            console.log(`[room ${roomId}] participants:`, rooms[roomId].map(p => ({ socketId: p.socketId, userId: p.userId, userName: p.userName, role: p.role, isPresenting: p.isPresenting })));
            const others = rooms[roomId].filter(p => p.socketId !== socket.id);

            // Tell the new joiner who is already in the room
            socket.emit('room-users', others);

            // Tell everyone else that a new peer arrived
            socket.to(roomId).emit('user-connected', {
                socketId: socket.id,
                userId,
                userName,
                role
            });

            console.log(`[room ${roomId}] ${userName} (${role}) joined – peers: ${rooms[roomId].length}`);
        });

        // ── WEBRTC OFFER ───────────────────────────────────────────────────────
        socket.on('offer', ({ roomId, offer, to }) => {
            // `to` is the target socketId; if omitted, broadcast to room
            if (to) {
                io.to(to).emit('offer', { offer, from: socket.id });
            } else {
                socket.to(roomId).emit('offer', { offer, from: socket.id });
            }
        });

        // ── WEBRTC ANSWER ──────────────────────────────────────────────────────
        socket.on('answer', ({ roomId, answer, to }) => {
            if (to) {
                io.to(to).emit('answer', { answer, from: socket.id });
            } else {
                socket.to(roomId).emit('answer', { answer, from: socket.id });
            }
        });

        // ── ICE CANDIDATE ─────────────────────────────────────────────────────
        socket.on('ice-candidate', ({ roomId, candidate, to }) => {
            if (to) {
                io.to(to).emit('ice-candidate', { candidate, from: socket.id });
            } else {
                socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
            }
        });

        // ── CONTROL SIGNALS ────────────────────────────────────────────────────
        socket.on('toggle-video', ({ roomId, enabled }) => {
            socket.to(roomId).emit('peer-video-toggle', { from: socket.id, enabled });
        });

        socket.on('toggle-audio', ({ roomId, enabled }) => {
            socket.to(roomId).emit('peer-audio-toggle', { from: socket.id, enabled });
        });

        // ── SCREEN SHARING SIGNALS ─────────────────────────────────────────────
        socket.on('screen-share-started', ({ roomId }) => {
            // mark this participant as presenting so future joiners can learn state
            if (rooms[roomId]) {
                const p = rooms[roomId].find(x => x.socketId === socket.id);
                if (p) p.isPresenting = true;
            }
            socket.to(roomId).emit('peer-screen-share-started', { from: socket.id });
        });

        socket.on('screen-share-stopped', ({ roomId }) => {
            if (rooms[roomId]) {
                const p = rooms[roomId].find(x => x.socketId === socket.id);
                if (p) p.isPresenting = false;
            }
            socket.to(roomId).emit('peer-screen-share-stopped', { from: socket.id });
        });

        // Request a presenter to create a fresh offer targeted at a joining peer.
        // Payload: { to: <presenterSocketId>, target: <newJoinerSocketId> }
        socket.on('request-presenter-offer', ({ to, target }) => {
            if (!to || !target) return;
            io.to(to).emit('request-presenter-offer', { target });
        });

        socket.on('end-call', ({ roomId }) => {
            socket.to(roomId).emit('call-ended', { from: socket.id });
        });

        // ── CHAT IN ROOM ───────────────────────────────────────────────────────
        socket.on('room-message', ({ roomId, message, userName, timestamp }) => {
            io.to(roomId).emit('room-message', { message, userName, timestamp, from: socket.id });
        });

        // ── DISCONNECT ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            for (const roomId in rooms) {
                const idx = rooms[roomId].findIndex(p => p.socketId === socket.id);
                if (idx !== -1) {
                    const [departed] = rooms[roomId].splice(idx, 1);
                    socket.to(roomId).emit('user-disconnected', {
                        socketId: socket.id,
                        userId: departed.userId,
                        userName: departed.userName
                    });
                    if (rooms[roomId].length === 0) delete rooms[roomId];
                    console.log(`[room ${roomId}] ${departed.userName} left`);
                    break;
                }
            }
        });
    });
};
