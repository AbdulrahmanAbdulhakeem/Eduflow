import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage(); 

//The critical file validation filter
const pdfFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {

  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF files are allowed for course materials!") as any, false);
  }
};

export const uploadPdf = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
}).single("materialFile");