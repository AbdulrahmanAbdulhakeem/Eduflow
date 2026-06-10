import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { getAllUsers, getUser, updateUser, deleteUser, updateProfile, getMyProfile, adminCreateUser } from "../controllers/user.controller";

const router = Router()


router.use(requireAuth)

// Any authenticated user (Student, Lecturer, Admin) can update their own profile
router.route("/profile").patch(updateProfile);
router.route("/me").patch(getMyProfile);

//Admin Routes
router.route("/admin/users")
  .get(requireRole(['ADMIN']), getAllUsers);
router.route("/admin/users/create").post(requireRole(['ADMIN']), adminCreateUser);

router.route("/admin/users/:id")
  .get(requireRole(['ADMIN']), getUser)
  .patch(requireRole(['ADMIN']), updateUser)
  .delete(requireRole(['ADMIN']), deleteUser);



// router.route("/lecturer/students")
//   .get(requireRole(['LECTURER']), getLecturerStudents);


// // ==========================================
// // 4. STUDENT ONLY SPECIFICATIONS
// // ==========================================
// router.route("/student/courses")
//   .get(requireRole(['STUDENT']), getStudentEnrollments);

export default router
