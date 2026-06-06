// const redisClient = require('../lib/redis');

// module.exports = function (io) {
//   io.on('connection', (socket) => {
//     console.log('Socket connected:', socket.id);

//     // --- Dashboard Online Users ---
//     socket.on('user_online', async (payload) => {
//       const { userId, level, name } = payload;
//       if (!userId || !redisClient.isOpen) return;
      
//       const userData = {
//         userId,
//         socketId: socket.id,
//         level: level || 'intermediate',
//         name: name || 'User',
//         lastSeen: Date.now()
//       };
      
//       await redisClient.hSet('online_users', userId, JSON.stringify(userData));
//       socket.userId = userId; // Store on socket for easy cleanup
//     });

//     socket.on('get_online_count', async (callback) => {
//       if (!redisClient.isOpen) {
//         if (typeof callback === 'function') callback({ total: 0, byLevel: { beginner: 0, intermediate: 0, advanced: 0 }, users: [] });
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
//           // 60 seconds TTL check
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
//             total, 
//             byLevel, 
//             users: activeUsers.map(u => ({ name: u.name, level: u.level })) 
//         });
//       } catch (err) {
//         console.error('Error fetching online count:', err);
//       }
//     });

//     socket.on('user_offline', async () => {
//       if (socket.userId && redisClient.isOpen) {
//         await redisClient.hDel('online_users', socket.userId);
//       }
//     });

//     // Matchmaking: add user to a queue for their level
//     socket.on('join_queue', async (payload) => {
//       const { level } = payload;
//       const queueKey = `queue:${level}`;
      
//       console.log(`${socket.id} joining queue: ${queueKey}`);
      
//       try {
//         // If Redis is not running locally, instantly trigger AI fallback to unblock testing
//         if (!redisClient.isOpen) {
//           console.log(`Redis offline. Instantly activating AI fallback for ${socket.id}`);
//           socket.emit('match_found', {
//             roomId: `ai-room:${socket.id}`,
//             partnerSocketId: 'ai_partner',
//             role: 'ai_mode',
//           });
//           return;
//         }

//         // Try to find a human partner in the queue
//         const partnerId = await redisClient.lPop(queueKey);

//         if (partnerId && partnerId !== socket.id) {
//           // --- Human Partner Found ---
//           console.log(`Human match found: ${socket.id} and ${partnerId}`);
//           const roomId = `room:${socket.id}-${partnerId}`;

//           // Notify both users they have been matched
//           socket.emit('match_found', { roomId, partnerSocketId: partnerId, role: 'offerer' });
//           socket.to(partnerId).emit('match_found', { roomId, partnerSocketId: socket.id, role: 'answerer' });

//         } else {
//           // --- No Human Partner, or matched with self ---
//           if (partnerId) {
//             // If we popped our own ID, put it back at the front of the queue
//             await redisClient.lPush(queueKey, partnerId);
//           }
          
//           // Add the current user to the queue and set AI fallback
//           await redisClient.rPush(queueKey, socket.id);
//           console.log(`${socket.id} added to human queue, setting AI fallback timer.`);

//           // Set a timeout to match with AI if no human is found
//           setTimeout(async () => {
//             try {
//               // Check if the user is still in the queue after the timeout
//               const wasRemoved = await redisClient.lRem(queueKey, 1, socket.id);

//               if (wasRemoved) {
//                 // Still in queue, so switch to AI mode (client-side)
//                 console.log(`AI mode activated for ${socket.id}`);

//                 // Emitting a special match so the client knows to switch modes
//                 socket.emit('match_found', {
//                   roomId: `ai-room:${socket.id}`,
//                   partnerSocketId: 'ai_partner', // Client uses this to trigger local AI mode
//                   role: 'ai_mode', // Distinct role for client side handling
//                 });
//               }
//             } catch (err) {
//               console.error('Error in AI matchmaking timeout:', err);
//             }
//           }, 10000); // 10-second timeout
//         }
//       } catch (err) {
//         console.error('Redis error during matchmaking:', err);
//         socket.emit('matchmaking_error', { message: 'Could not process your request.' });
//       }
//     });

//     // Relay SDP offer/answer (now ONLY for human peers)
//     socket.on('offer', (payload) => {
//       const { target, sdp } = payload;
//       console.log(`Relaying offer from ${socket.id} to ${target}`);
//       socket.to(target).emit('offer', { from: socket.id, sdp });
//     });

//     socket.on('answer', (payload) => {
//       const { target, sdp } = payload;
//       console.log(`Relaying answer from ${socket.id} to ${target}`);
//       socket.to(target).emit('answer', { from: socket.id, sdp });
//     });

//     socket.on('ice-candidate', (payload) => {
//       const { target, candidate } = payload;
//       socket.to(target).emit('ice-candidate', { from: socket.id, candidate });
//     });

//     socket.on('disconnect', async (reason) => {
//       console.log('Socket disconnected:', socket.id, reason);
      
//       if (socket.userId && redisClient.isOpen) {
//         await redisClient.hDel('online_users', socket.userId);
//       }

//       const levels = ['beginner', 'intermediate', 'advanced']; 
//       for (const level of levels) {
//         const queueKey = `queue:${level}`;
//         await redisClient.lRem(queueKey, 0, socket.id);
//       }
//     });
//   });
// };
































































const redisClient = require('../lib/redis');

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // --- Dashboard Online Users ---
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
        socket.userId = userId; // Store on socket for easy cleanup
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
          // 60 seconds TTL check
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

    // Matchmaking Queue
    socket.on('join_queue', async (payload) => {
      const { level } = payload;
      const queueKey = `queue:${level}`;
      
      console.log(`${socket.id} joining queue: ${queueKey}`);
      
      // If Redis is not running locally, instantly trigger AI fallback to unblock testing
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
        // Try to find a human partner in the queue
        const partnerId = await redisClient.lPop(queueKey);

        if (partnerId && partnerId !== socket.id) {
          // --- Human Partner Found ---
          console.log(`Human match found: ${socket.id} and ${partnerId}`);
          const roomId = `room:${socket.id}-${partnerId}`;

          // Notify both users they have been matched
          socket.emit('match_found', { roomId, partnerSocketId: partnerId, role: 'offerer' });
          socket.to(partnerId).emit('match_found', { roomId, partnerSocketId: socket.id, role: 'answerer' });

        } else {
          // --- No Human Partner, or matched with self ---
          if (partnerId) {
            await redisClient.lPush(queueKey, partnerId);
          }
          
          // Add the current user to the queue and set AI fallback
          await redisClient.rPush(queueKey, socket.id);
          console.log(`${socket.id} added to human queue, setting AI fallback timer.`);

          // Set a timeout to match with AI if no human is found
          setTimeout(async () => {
            try {
              if (redisClient && redisClient.isOpen) {
                // Check if the user is still in the queue after the timeout
                const wasRemoved = await redisClient.lRem(queueKey, 1, socket.id);

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
              console.error('Error in AI matchmaking timeout execution:', err);
            }
          }, 10000); // 10-second timeout
        }
      } catch (err) {
        console.error('Redis error during matchmaking logic:', err);
        socket.emit('matchmaking_error', { message: 'Could not process your request.' });
      }
    });

    // Relay WebRTC Signals
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

    // Clean disconnect handling
    socket.on('disconnect', async (reason) => {
      console.log('Socket disconnected:', socket.id, reason);
      
      if (!redisClient || !redisClient.isOpen) return;

      try {
        if (socket.userId) {
          await redisClient.hDel('online_users', socket.userId);
        }

        const levels = ['beginner', 'intermediate', 'advanced']; 
        for (const level of levels) {
          const queueKey = `queue:${level}`;
          await redisClient.lRem(queueKey, 0, socket.id);
        }
      } catch (err) {
        console.error('Failed processing Redis cleanup during socket disconnect:', err);
      }
    });
  });
};