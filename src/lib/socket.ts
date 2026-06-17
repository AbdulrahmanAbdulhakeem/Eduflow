import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface ActiveStudent {
  studentId: string;
  name: string;
  email: string;
  currentMaterialId: string | null;
  lastActive: Date;
}

// In-memory state tracking store (Map key is the unique Socket ID)
const activeSessions = new Map<string, ActiveStudent>();

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected to WebSocket: ${socket.id}`);

    // Event 1: Student enters a course room
    socket.on('presence:initialize', (data: { studentId: string; name: string; email: string; courseId: string }) => {
      const roomName = `course:${data.courseId}`;
      socket.join(roomName);

      activeSessions.set(socket.id, {
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        currentMaterialId: null,
        lastActive: new Date()
      });

      // Instantly tell listening lecturers who is in this room
      broadcastCoursePresence(io, data.courseId);
    });

    // Event 2: Student switches materials or opens a PDF
    socket.on('presence:update_material', (data: { courseId: string; materialId: string }) => {
      const session = activeSessions.get(socket.id);
      if (session) {
        session.currentMaterialId = data.materialId;
        session.lastActive = new Date();
        activeSessions.set(socket.id, session);

        broadcastCoursePresence(io, data.courseId);
      }
    });

    // Event 3: Clean up when a user closes a tab or disconnects
    socket.on('disconnecting', () => {
      const session = activeSessions.get(socket.id);
      if (session) {
        socket.rooms.forEach((room) => {
          if (room.startsWith('course:')) {
            const courseId = room.split(':')[1];
            
            // Broadcast the updated, smaller list right after their removal processes finishes
            process.nextTick(() => {
              broadcastCoursePresence(io, courseId);
            });
          }
        });
      }
    });

    socket.on('disconnect', () => {
      activeSessions.delete(socket.id);
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper utility to compile and broadcast active sessions belonging to a specific course
function broadcastCoursePresence(io: Server, courseId: string) {
  const roomName = `course:${courseId}`;
  const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
  const liveStudents: ActiveStudent[] = [];

  if (clientsInRoom) {
    clientsInRoom.forEach((socketId) => {
      const session = activeSessions.get(socketId);
      if (session) {
        liveStudents.push(session);
      }
    });
  }

  // Push the snapshot directly to the course channel
  io.to(roomName).emit('presence:live_data', liveStudents);
}

