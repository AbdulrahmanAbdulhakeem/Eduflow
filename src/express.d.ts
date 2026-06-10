import { Role } from '../src/generated/prisma'; // Adjust to your Prisma client path

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}