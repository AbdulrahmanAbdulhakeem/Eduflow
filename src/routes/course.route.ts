import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import {
  createCourse,
  deleteCourse,
  disenrollCourse,
  enrollCourse,
  getCourseById,
  getCourses,
  getLecturerCourses,
  getLecturerStudents,
  updateCourse,
} from "../controllers/course.controller";

const router = Router();

router.use(requireAuth);

//Lecturer routes
router.route("/create").post(requireRole(["LECTURER"]), createCourse);
router.route("/mycourses").get(requireRole(["LECTURER"]), getLecturerCourses);
router.route("/mystudents").get(requireRole(["LECTURER"]), getLecturerStudents);

//Student routes
router.route("/").get(requireRole(["STUDENT"]), getCourses);
router.route("/:id").get(requireRole(["STUDENT"]), getCourseById);
router.post(
  "/student/enroll",
  requireRole(["STUDENT"]),
  enrollCourse
);

router.post(
  "/student/disenroll", 
  requireRole(["STUDENT"]),
  disenrollCourse
);

//Dynamic lecturer routes
router
  .route("/:id")
  .delete(requireRole(["LECTURER"]), deleteCourse)
  .patch(requireRole(["LECTURER"]), updateCourse);

export default router;
