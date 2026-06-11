import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { uploadPdf } from "../config/multer";
import {
  deleteMaterial,
  getCourseMaterials,
  getMaterialById,
  updateMaterial,
  uploadMaterial,
} from "../controllers/material.controller";

const router = Router({ mergeParams: true });

// Require auth is not needed here due to the merge params
// course router validates materials requests before passing it to the router
// all verified are allowed to view materials
// only lecturers are allowed to upload,delete,update materials for there courses
router
  .route("/")
  .get(getCourseMaterials)
  .post(
    requireRole(["LECTURER"]),
    (req, res, next) => {
      // Execute the upload wrapper
      uploadPdf(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    uploadMaterial,
  );

router
  .route("/:materialId")
  .get(getMaterialById)
  .patch(requireRole(["LECTURER"]),updateMaterial)
  .delete(requireRole(["LECTURER"]), deleteMaterial);

export default router;
