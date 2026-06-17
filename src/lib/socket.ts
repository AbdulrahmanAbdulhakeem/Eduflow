import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

interface ActiveStudent {
  studentId: string;
  name: string;
  email: string;
  courseId: string;
  currentMaterialId: string | null;
  materialTitle: string | null;
  currentAction: string;
  joinedAt: Date;
  lastActive: Date;
}

const activeSessions = new Map<string, ActiveStudent>();

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Connected: ${socket.id}`);

    // Real-Time Enrollment Notifications
    socket.on(
      "presence:enrollincourse",
      (data: {
        studentId: string;
        name: string;
        email: string;
        courseId: string;
      }) => {
        console.log(
          `Student ${data.name} enrolled in course: ${data.courseId}`,
        );

        const notificationPayload = {
          message: `${data.name} has just enrolled in your course!`,
          student: {
            id: data.studentId,
            name: data.name,
            email: data.email,
          },
          enrolledAt: new Date(),
        };

        //Secure Fix: Send directly to the lecturers sub-room
        io.to(`course:${data.courseId}:lecturers`).emit(
          "lecturer:enrollment_notification",
          notificationPayload,
        );
      },
    );

    // Student Enters the Course Page
    socket.on(
      "presence:initialize",
      (data: {
        studentId: string;
        name: string;
        email: string;
        courseId: string;
      }) => {
        socket.join(`course:${data.courseId}`);

        activeSessions.set(socket.id, {
          studentId: data.studentId,
          name: data.name,
          email: data.email,
          courseId: data.courseId,
          currentMaterialId: null,
          materialTitle: null,
          currentAction: "Browsing Course Page",
          joinedAt: new Date(),
          lastActive: new Date(),
        });

        socket.data = { courseId: data.courseId };
        broadcastToLecturersOnly(io, data.courseId);
      },
    );

    // Student Opens or Switches Material
    socket.on(
      "presence:update_material",
      (data: {
        courseId: string;
        materialId: string;
        materialTitle: string;
      }) => {
        const session = activeSessions.get(socket.id);
        if (session) {
          session.courseId = data.courseId; 
          session.currentMaterialId = data.materialId;
          session.materialTitle = data.materialTitle;
          session.currentAction = "Viewing Document";
          session.lastActive = new Date();

          activeSessions.set(socket.id, session);
          broadcastToLecturersOnly(io, data.courseId);
        }
      },
    );

    // Student Updates Active Task Actions
    socket.on(
      "presence:update_action",
      (data: { courseId: string; action: string }) => {
        const session = activeSessions.get(socket.id);
        if (session) {
          session.courseId = data.courseId; 
          session.currentAction = data.action;
          session.lastActive = new Date();

          activeSessions.set(socket.id, session);
          broadcastToLecturersOnly(io, data.courseId);
        }
      },
    );

    // Disconnect Layer Clean-up
    socket.on("disconnecting", () => {
      const session = activeSessions.get(socket.id);
      if (session) {
        socket.rooms.forEach((room) => {
          if (room.startsWith("course:")) {
            const courseId = room.split(":")[1];

            process.nextTick(() => {
              broadcastToLecturersOnly(io, courseId);
            });
          }
        });
      }
    });

    socket.on("disconnect", () => {
      activeSessions.delete(socket.id);
      console.log(`❌ Disconnected: ${socket.id}`);
    });

    // Lecturer Registers Dashboard Screen Listener
    socket.on("lecturer:join", (data: string | { courseId: string }) => {
      const courseId = typeof data === "string" ? data : data.courseId;

      if (!courseId) {
        console.error("lecturer:join triggered without a valid courseId");
        return;
      }
      socket.join(`course:${courseId}:lecturers`);
      console.log(`Lecturer joined monitoring channel for: ${courseId}`);

      broadcastToLecturersOnly(io, courseId);
    });
  });

  return io;
}

function broadcastToLecturersOnly(io: Server, courseId: string) {
  const liveStudents: ActiveStudent[] = [];

  activeSessions.forEach((session) => {
    if (session.courseId === courseId) {
      liveStudents.push(session);
    }
  });

  io.to(`course:${courseId}:lecturers`).emit(
    "presence:live_data",
    liveStudents,
  );
}
