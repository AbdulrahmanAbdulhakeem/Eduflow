import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary";

// Get all materials for a course
export const getCourseMaterials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId  = req.params.courseId as string;

    const materials = await prisma.material.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      message: "Materials retrieved successfully",
      data: materials,
    });
  } catch (error) {
    next(error);
  }
};

// Get single material
export const getMaterialById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materialId = req.params.materialId as string;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { course: true },
    });

    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    res.json({
      message: "Material retrieved successfully",
      data: material,
    });
  } catch (error) {
    next(error);
  }
};

// Upload new material
export const uploadMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId  = req.params.courseId as string;
    const { title } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json({ error: "Material title is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file);

    const material = await prisma.material.create({
      data: {
        title,
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        type: "pdf",
        courseId,
      },
    });

    res.status(201).json({
      message: "Material uploaded successfully",
      data: material,
    });
  } catch (error) {
    next(error);
  }
};

// Update material (title, etc.)
export const updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materialId  = req.params.materialId as string;
    const { title, type } = req.body;

    const updated = await prisma.material.update({
      where: { id: materialId },
      data: {
        ...(title && { title }),
        ...(type && { type }),
      },
    });

    res.json({
      message: "Material updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete material
export const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materialId = req.params.materialId as string;
    const courseId = req.params.courseId as string;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

   if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    if (material.courseId !== courseId) {
      return res.status(400).json({ error: "Material does not belong to this course route" });
    }

    // Break the file out of Cloudinary storage so you don't build up cloud garbage
    if (material.publicId) {
      await deleteFromCloudinary(material.publicId);
    }

    await prisma.material.delete({ where: { id: materialId } });

    res.json({ message: "Material deleted successfully from database and cloud storage" });
  } catch (error) {
    next(error);
  }
};