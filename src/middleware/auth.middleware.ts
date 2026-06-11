import {Request,Response,NextFunction} from 'express'
import { auth } from '../lib/auth'
import { Role } from '../generated/prisma/client';


export async function requireAuth(req:Request,res:Response,next:NextFunction) {
    const session = await auth.api.getSession({
        headers: new Headers(req.headers as Record<string, string>),
    })

    if (!session) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  (req as any).user = session.user;
  (req as any).session = session.session;

  next();
}

export function isLecturer(req:Request,res:Response,next:NextFunction) {
    const user = (req as any).user

    if(!user || user.role !== "LECTURER") {
        return res.status(403).json({ error: "Forbidden: This action requires a Lecturer role." });
    }

    next()
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: This action requires an Admin role." });
  }

  next();
}

export function isLecturerOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || (user.role !== "LECTURER" && user.role !== "ADMIN")) {
    return res.status(403).json({ error: "Forbidden: Access restricted to Lecturers and Admins." });
  }

  next();
}

export function isStudent(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== "STUDENT") {
    return res.status(403).json({ error: "Forbidden: Access restricted to Students." });
  }

  next();
}

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};