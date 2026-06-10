import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["STUDENT", "LECTURER"]),
  level: z.number().int().min(100).max(400).optional(),
});

export const createCourseSchema = z.object({
  code: z.string().min(3).max(10).toUpperCase(),   // e.g. CSC101
  title: z.string().min(5, "Title must be at least 5 characters"),
  level: z.number().int().min(100).max(400),
  semester: z.number().int().min(1).max(3).default(1),
  description: z.string().max(500).optional(),
  lecturerId: z.string().optional(), // only for admin
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const enrollSchema = z.object({
  courseId: z.string().min(1),
});
