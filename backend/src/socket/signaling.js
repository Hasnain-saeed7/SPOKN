
// const redisClient = require('../lib/redis');

// module.exports = function (io) {
//   io.on('connection', (socket) => {
//     console.log('Socket connected:', socket.id);

//     // ─── Dashboard Online Users ───────────────────────────────────────────────
//     socket.on('user_online', async (payload) => {
//       const { userId, level, name } = payload;
//       if (!userId || !redisClient || !redisClient.isOpen) return;
//       try {
//         const userData = {
//           userId,
//           socketId: socket.id,
//           level: level || 'intermediate',
//           name: name || 'User',
//           lastSeen: Date.now()
//         };
//         await redisClient.hSet('online_users', userId, JSON.stringify(userData));
//         socket.userId = userId;
//       } catch (err) {
//         console.error('Error setting user online in Redis:', err);
//       }
//     });

//     socket.on('get_online_count', async (callback) => {
//       if (!redisClient || !redisClient.isOpen) {
//         if (typeof callback === 'function') {
//           callback({ total: 0, byLevel: { beginner: 0, intermediate: 0, advanced: 0 }, users: [] });
//         }
//         return;
//       }
//       try {
//         const usersObj = await redisClient.hGetAll('online_users');
//         let total = 0;
//         const byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
//         const now = Date.now();
//         const activeUsers = [];
//         for (const [userId, dataStr] of Object.entries(usersObj)) {
//           const data = JSON.parse(dataStr);
//           if (now - data.lastSeen > 60000) {
//             redisClient.hDel('online_users', userId).catch(() => {});
//           } else {
//             total++;
//             const lvl = data.level.toLowerCase();
//             if (byLevel[lvl] !== undefined) byLevel[lvl]++;
//             activeUsers.push(data);
//           }
//         }
//         socket.emit('online_count_update', {
//           total,
//           byLevel,
//           users: activeUsers.map(u => ({ name: u.name, level: u.level }))
//         });
//       } catch (err) {
//         console.error('Error fetching online count from Redis:', err);
//       }
//     });

//     socket.on('user_offline', async () => {
//       if (socket.userId && redisClient && redisClient.isOpen) {
//         try {
//           await redisClient.hDel('online_users', socket.userId);
//         } catch (err) {
//           console.error('Error removing user from online_users:', err);
//         }
//       }
//     });

//     // ─── Matchmaking Queue ────────────────────────────────────────────────────
//     socket.on('join_queue', async (payload) => {
//       const { level, accent, name } = payload;
//       const queueKey = `queue:${level}`;

//       // Store name and accent on socket for later use
//       socket.displayName = name || 'User';
//       socket.accent = accent || 'british';

//       console.log(`${socket.id} (${socket.displayName}) joining queue: ${queueKey}`);

//       if (!redisClient || !redisClient.isOpen) {
//         console.log(`Redis offline. Instantly activating AI fallback for ${socket.id}`);
//         socket.emit('match_found', {
//           roomId: `ai-room:${socket.id}`,
//           partnerSocketId: 'ai_partner',
//           role: 'ai_mode',
//         });
//         return;
//       }

//       try {
//         // Queue stores "socketId::name" so we can recover name on match
//         const myEntry = `${socket.id}::${socket.displayName}`;

//         // Pop the first waiting entry
//         const partnerEntry = await redisClient.lPop(queueKey);

//         if (partnerEntry) {
//           const [partnerId, partnerName] = partnerEntry.split('::');

//           if (partnerId && partnerId !== socket.id) {
//             // ── Human match found ──
//             console.log(`Human match: ${socket.id} (${socket.displayName}) ↔ ${partnerId} (${partnerName})`);
//             const roomId = `room:${socket.id}-${partnerId}`;

//             // Store partner mapping on both sockets for disconnect notification
//             socket.partnerId = partnerId;
//             const partnerSocket = io.sockets.sockets.get(partnerId);
//             if (partnerSocket) partnerSocket.partnerId = socket.id;

//             socket.emit('match_found', {
//               roomId,
//               partnerSocketId: partnerId,
//               partnerName: partnerName || 'User',
//               role: 'offerer'
//             });
//             socket.to(partnerId).emit('match_found', {
//               roomId,
//               partnerSocketId: socket.id,
//               partnerName: socket.displayName,
//               role: 'answerer'
//             });
//             return;
//           }

//           // Popped our own entry or invalid — put it back
//           if (partnerId === socket.id) {
//             await redisClient.lPush(queueKey, partnerEntry);
//           } else if (partnerId) {
//             await redisClient.lPush(queueKey, partnerEntry);
//           }
//         }

//         // No partner found — add to queue and set AI fallback
//         await redisClient.rPush(queueKey, myEntry);
//         console.log(`${socket.id} added to queue, starting AI fallback timer.`);

//         setTimeout(async () => {
//           try {
//             if (redisClient && redisClient.isOpen) {
//               // Try to remove our entry (stored as "socketId::name")
//               const wasRemoved = await redisClient.lRem(queueKey, 1, myEntry);
//               if (wasRemoved) {
//                 console.log(`AI mode activated for ${socket.id}`);
//                 socket.emit('match_found', {
//                   roomId: `ai-room:${socket.id}`,
//                   partnerSocketId: 'ai_partner',
//                   role: 'ai_mode',
//                 });
//               }
//             }
//           } catch (err) {
//             console.error('Error in AI matchmaking timeout:', err);
//           }
//         }, 10000);

//       } catch (err) {
//         console.error('Redis error during matchmaking:', err);
//         socket.emit('matchmaking_error', { message: 'Could not process your request.' });
//       }
//     });

//     // ─── WebRTC Signal Relay ──────────────────────────────────────────────────
//     socket.on('offer', (payload) => {
//       const { target, sdp } = payload;
//       socket.to(target).emit('offer', { from: socket.id, sdp });
//     });

//     socket.on('answer', (payload) => {
//       const { target, sdp } = payload;
//       socket.to(target).emit('answer', { from: socket.id, sdp });
//     });

//     socket.on('ice-candidate', (payload) => {
//       const { target, candidate } = payload;
//       socket.to(target).emit('ice-candidate', { from: socket.id, candidate });
//     });

//     // ─── Disconnect ───────────────────────────────────────────────────────────
//     socket.on('disconnect', async (reason) => {
//       console.log('Socket disconnected:', socket.id, reason);

//       // ── Notify partner if in a P2P call ──
//       if (socket.partnerId) {
//         const partnerSocket = io.sockets.sockets.get(socket.partnerId);
//         if (partnerSocket) {
//           partnerSocket.emit('partner_disconnected', {
//             message: `${socket.displayName || 'Your partner'} has left the call.`
//           });
//           partnerSocket.partnerId = null; // clear the link
//         }
//         socket.partnerId = null;
//       }

//       // ── Redis cleanup ──
//       if (!redisClient || !redisClient.isOpen) return;
//       try {
//         if (socket.userId) {
//           await redisClient.hDel('online_users', socket.userId);
//         }
//         const levels = ['beginner', 'intermediate', 'advanced'];
//         for (const level of levels) {
//           const queueKey = `queue:${level}`;
//           // Remove both old format (just socketId) and new format (socketId::name)
//           await redisClient.lRem(queueKey, 0, socket.id);
//           if (socket.displayName) {
//             await redisClient.lRem(queueKey, 0, `${socket.id}::${socket.displayName}`);
//           }
//         }
//       } catch (err) {
//         console.error('Redis cleanup error on disconnect:', err);
//       }
//     });
//   });
// };
 





















const redisClient = require('../lib/redis');

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // ─── Dashboard Online Users ───────────────────────────────────────────────
    socket.on('user_online', async (payload) => {
      const { userId, level, name } = payload;
      if (!userId || !redisClient || !redisClient.isOpen) return;
      try {
        const userData = {
          userId,
          socketId: socket.id,
          level: level || 'intermediate',
          name: name || 'User',
          lastSeen: Date.now()
        };
        await redisClient.hSet('online_users', userId, JSON.stringify(userData));
        socket.userId = userId;
      } catch (err) {
        console.error('Error setting user online in Redis:', err);
      }
    });

    socket.on('get_online_count', async (callback) => {
      if (!redisClient || !redisClient.isOpen) {
        if (typeof callback === 'function') {
          callback({ total: 0, byLevel: { beginner: 0, intermediate: 0, advanced: 0 }, users: [] });
        }
        return;
      }
      try {
        const usersObj = await redisClient.hGetAll('online_users');
        let total = 0;
        const byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
        const now = Date.now();
        const activeUsers = [];
        for (const [userId, dataStr] of Object.entries(usersObj)) {
          const data = JSON.parse(dataStr);
          if (now - data.lastSeen > 60000) {
            redisClient.hDel('online_users', userId).catch(() => {});
          } else {
            total++;
            const lvl = data.level.toLowerCase();
            if (byLevel[lvl] !== undefined) byLevel[lvl]++;
            activeUsers.push(data);
          }
        }
        socket.emit('online_count_update', {
          total,
          byLevel,
          users: activeUsers.map(u => ({ name: u.name, level: u.level }))
        });
      } catch (err) {
        console.error('Error fetching online count from Redis:', err);
      }
    });

    socket.on('user_offline', async () => {
      if (socket.userId && redisClient && redisClient.isOpen) {
        try {
          await redisClient.hDel('online_users', socket.userId);
        } catch (err) {
          console.error('Error removing user from online_users:', err);
        }
      }
    });

    // ─── Matchmaking Queue ────────────────────────────────────────────────────
    socket.on('join_queue', async (payload) => {
      const { level, accent, name } = payload;
      const queueKey = `queue:${level}`;

      socket.displayName = name || 'User';
      socket.accent = accent || 'british';

      console.log(`${socket.id} (${socket.displayName}) joining queue: ${queueKey}`);

      if (!redisClient || !redisClient.isOpen) {
        console.log(`Redis offline. Instantly activating AI fallback for ${socket.id}`);
        socket.emit('match_found', {
          roomId: `ai-room:${socket.id}`,
          partnerSocketId: 'ai_partner',
          role: 'ai_mode',
        });
        return;
      }

      try {
        const myEntry = `${socket.id}::${socket.displayName}`;
        const partnerEntry = await redisClient.lPop(queueKey);

        if (partnerEntry) {
          const [partnerId, partnerName] = partnerEntry.split('::');

          if (partnerId && partnerId !== socket.id) {
            console.log(`Human match: ${socket.id} (${socket.displayName}) ↔ ${partnerId} (${partnerName})`);
            const roomId = `room:${socket.id}-${partnerId}`;

            // Store partner link on both sockets
            socket.partnerId = partnerId;
            const partnerSocket = io.sockets.sockets.get(partnerId);
            if (partnerSocket) partnerSocket.partnerId = socket.id;

            socket.emit('match_found', {
              roomId,
              partnerSocketId: partnerId,
              partnerName: partnerName || 'User',
              role: 'offerer'
            });
            socket.to(partnerId).emit('match_found', {
              roomId,
              partnerSocketId: socket.id,
              partnerName: socket.displayName,
              role: 'answerer'
            });
            return;
          }

          // Put back if invalid
          await redisClient.lPush(queueKey, partnerEntry);
        }

        // No partner — wait with AI fallback
        await redisClient.rPush(queueKey, myEntry);
        console.log(`${socket.id} added to queue, starting AI fallback timer.`);

        setTimeout(async () => {
          try {
            if (redisClient && redisClient.isOpen) {
              const wasRemoved = await redisClient.lRem(queueKey, 1, myEntry);
              if (wasRemoved) {
                console.log(`AI mode activated for ${socket.id}`);
                socket.emit('match_found', {
                  roomId: `ai-room:${socket.id}`,
                  partnerSocketId: 'ai_partner',
                  role: 'ai_mode',
                });
              }
            }
          } catch (err) {
            console.error('Error in AI matchmaking timeout:', err);
          }
        }, 10000);

      } catch (err) {
        console.error('Redis error during matchmaking:', err);
        socket.emit('matchmaking_error', { message: 'Could not process your request.' });
      }
    });

    // ─── WebRTC Signal Relay ──────────────────────────────────────────────────
    socket.on('offer', (payload) => {
      const { target, sdp } = payload;
      socket.to(target).emit('offer', { from: socket.id, sdp });
    });

    socket.on('answer', (payload) => {
      const { target, sdp } = payload;
      socket.to(target).emit('answer', { from: socket.id, sdp });
    });

    socket.on('ice-candidate', (payload) => {
      const { target, candidate } = payload;
      socket.to(target).emit('ice-candidate', { from: socket.id, candidate });
    });

    // ─── Peer Hangup (user clicked Disconnect/End Session) ───────────────────
    // This fires BEFORE the socket disconnects, giving us time to notify partner
    socket.on('peer_hangup', () => {
      console.log(`peer_hangup from ${socket.id} (${socket.displayName})`);
      notifyPartner(socket);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      console.log('Socket disconnected:', socket.id, reason);

      // Notify partner if still linked (covers tab close / network drop)
      notifyPartner(socket);

      // Redis cleanup
      if (!redisClient || !redisClient.isOpen) return;
      try {
        if (socket.userId) {
          await redisClient.hDel('online_users', socket.userId);
        }
        const levels = ['beginner', 'intermediate', 'advanced'];
        for (const level of levels) {
          const queueKey = `queue:${level}`;
          await redisClient.lRem(queueKey, 0, socket.id);
          if (socket.displayName) {
            await redisClient.lRem(queueKey, 0, `${socket.id}::${socket.displayName}`);
          }
        }
      } catch (err) {
        console.error('Redis cleanup error on disconnect:', err);
      }
    });

    // ─── Helper: notify partner and clear link ────────────────────────────────
    function notifyPartner(fromSocket) {
      if (!fromSocket.partnerId) return;
      const partnerSocket = io.sockets.sockets.get(fromSocket.partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_disconnected', {
          message: `${fromSocket.displayName || 'Your partner'} has left the call.`
        });
        partnerSocket.partnerId = null;
      }
      fromSocket.partnerId = null;
    }
  });
};