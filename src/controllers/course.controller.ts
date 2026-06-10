import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";


//Todo: Implement level check,get Courses based off id and level 
export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const currentStudentId = req.user.id;
    const courses = await prisma.course.findMany({
      include: {
        lecturer: {
          select: { name: true, email: true, avatar: true },
        },
        _count: {
          select: { materials: true, enrollments: true },
        },
        enrollments: {
          where: { studentId: currentStudentId },
          select: { id: true }
        }
      },
    });

    const formattedCourses = courses.map(course => {
      const { enrollments, ...courseData } = course;
      return {
        ...courseData,
        enrollmentStatus: enrollments.length > 0 ? "ENROLLED" : "NOT_ENROLLED"
      };
    });

    res.json({ message: "All courses retrieved successfully", data: formattedCourses });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No session found" });
    }

    const courseId = req.params.id as string;
    const { id: userId, role: userRole } = req.user;

    //Fetch the course first along with basic identity verification metadata
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: {
          select: { name: true, email: true, avatar: true }
        },
        materials: {
          select: { id: true, title: true, fileUrl: true, type: true, createdAt: true }
        },
        //Pull only the enrollment matching this specific student if they are one
        enrollments: userRole === "STUDENT" ? {
          where: { studentId: userId },
          select: { id: true }
        } : false
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    //Role Security Check Guardrails
    if (userRole === "STUDENT") {
      // If the array is empty, this student is trying to access an unenrolled course
      if (course.enrollments.length === 0) {
        return res.status(403).json({ error: "Access Denied: You must enroll in this course to view its materials." });
      }
    } else if (userRole === "LECTURER") {
      // Ensure lecturers can only view details/materials of courses they actually manage
      if (course.lecturerId !== userId) {
        return res.status(403).json({ error: "Forbidden: You do not manage this course." });
      }
    }
    const { enrollments, ...courseDetails } = course;

    res.json({ 
      message: "Course details retrieved successfully", 
      data: courseDetails 
    });

  } catch (error) {
    next(error);
  }
};

// Create a new course (Restricted to LECTURER via middleware, maps lecturerId from session)
export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user session found" });
    }

    const { code, title, level, semester, description } = req.body;
    const lecturerId = req.user.id;

    const newCourse = await prisma.course.create({
      data: {
        code,
        title,
        level: parseInt(level),
        semester: semester ? parseInt(semester) : 1,
        description,
        lecturerId,
      },
    });

    res
      .status(201)
      .json({ message: "Course created successfully", data: newCourse });
  } catch (error) {
    next(error);
  }
};

// Update course (Verifies that the lecturer updates their own course)
export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user session found" });
    }

    const id = req.params.id as string;
    const userId = req.user.id;
    const { title, code, level, semester, description } = req.body;

    //Verify existence and ownership
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.lecturerId !== userId) {
      return res
        .status(403)
        .json({
          error: "Forbidden: You do not have permission to modify this course",
        });
    }

    //Perform safe update
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(code && { code }),
        ...(level && { level: parseInt(level) }),
        ...(semester && { semester: parseInt(semester) }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({ message: "Course updated successfully", data: updatedCourse });
  } catch (error) {
    next(error);
  }
};

// Delete course
export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user session found" });
    }

    const id = req.params.id as string;
    const userId = req.user.id;

    //Verify existence and ownership
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.lecturerId !== userId) {
      return res
        .status(403)
        .json({
          error: "Forbidden: You do not have permission to delete this course",
        });
    }

    //Delete the course
    await prisma.course.delete({ where: { id } });

    res.json({
      message: `Course ${course.code} and all its associated materials were successfully deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// Get all courses managed by the logged-in lecturer
export const getLecturerCourses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(403)
        .json({ error: "Forbidden: Only lecturers can view these courses" });
    }

    const lecturerId = req.user.id;

    const courses = await prisma.course.findMany({
      where: { lecturerId },
      include: {
        _count: {
          select: { materials: true, enrollments: true },
        },
      },
    });

    res.json({
      message: "Lecturer courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// Get unique students enrolled across all courses managed by this lecturer
export const getLecturerStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(403)
        .json({
          error: "Forbidden: Only lecturers can view enrolled students",
        });
    }

    const lecturerId = req.user.id;

    // Fetch enrollments where the course belongs to this lecturer
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: { lecturerId },
      },
      select: {
        course: {
          select: { code: true, title: true },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            level: true,
            avatar: true,
          },
        },
        enrolledAt: true,
      },
    });

    res.json({
      message: "Enrolled students retrieved successfully",
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

//Enroll in a Course
export const enrollCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const studentId = req.user.id;
    const { courseCode } = req.body;

    if (!courseCode) {
      return res.status(400).json({ error: "Course code is required to enroll" });
    }

    //Check if the course exists by its code
    const course = await prisma.course.findUnique({
      where: { code: courseCode },
    });

    if (!course) {
      return res.status(404).json({ error: "Invalid course code: Course does not exist" });
    }

    //Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({ error: "You are already enrolled in this course" });
    }

    //Complete enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId: course.id,
      },
    });

    return res.status(201).json({
      message: `Successfully enrolled in ${courseCode}`,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

//Disenroll from a Course (with confirmation code)
export const disenrollCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const studentId = req.user.id;
    const { courseCode } = req.body;

    if (!courseCode) {
      return res.status(400).json({ error: "You must provide the course code to confirm unenrollment" });
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { code: courseCode }
    });

    if (!course) {
      return res.status(404).json({ error: "Invalid course code: Course does not exist" });
    }

    //Verify the student is actually enrolled in this specific course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: "You are not enrolled in this course" });
    }

    //Complete unenrollment using the composite key index
    await prisma.enrollment.delete({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id,
        },
      },
    });

    return res.json({
      message: `Successfully dropped course: ${courseCode}`,
    });
  } catch (error) {
    next(error);
  }
};