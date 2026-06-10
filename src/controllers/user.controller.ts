import { Request, Response,NextFunction } from "express";
import prisma from "../config/db";
import { auth } from "../lib/auth";


//Get my own profile
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user session found" });
    }

    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

//Update my profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user session found" });
    }

    // 1. Extract the ID safely from the session/auth middleware, NOT the URL
    const userId = req.user.id; 
    const { name, avatar } = req.body;

    // 2. Perform the update safely
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // Guaranteed to be the logged-in user
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
    });

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

//Admin create user controller:It makes sense that the admin is the user to add lecturers and students
export const adminCreateUser = async(req: Request, res: Response,next:NextFunction) => {
  const { email, password, name, role, level } = req.body;

  try {
    // 1. Use better-auth to safely create the user and hash the password
    const userSession = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        // better-auth accepts custom fields if mapped in your configuration
        role, 
        ...(level && { level: parseInt(level) })
      }
    });

    res.status(201).json({
      message: `${role} account created successfully by Admin.`,
      user: userSession.user
    });
  } catch (error: any) {
    // Catch duplicate emails or validation errors from better-auth
    res.status(400).json({ error: error.message || "Failed to create user" });
  }
};

//Get all users in the database
export const getAllUsers = async (req: Request, res: Response,next:NextFunction) => {
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        level: true,
        avatar: true,
        createdAt: true,
      }
    });

    res.json({ message: "All users retrieved successfully", data: users });
  } catch (error) {
    next(error)
  }
};


//Get a single user
export const getUser = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const id = req.params.id as string; 
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        level: true,
        avatar: true,
      }
    });

    // Handle case where user ID doesn't exist in the database
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User selected successfully", data: user });
  } catch (error) {
    next(error)
  }

};


//Delete a user
export const deleteUser = async (req: Request, res: Response,next:NextFunction) => {
  const id = req.params.id as string;

  try {
    const deleted = await prisma.user.delete({
      where:{id}
    })
    res.json({ message: `User with ID ${id} and all active sessions deleted.` });
  } catch (error) {
    next(error)
  }

};


//Update user details
export const updateUser = async (req: Request, res: Response,next:NextFunction) => {
  const id = req.params.id as string;
  const {role,level,name} = req.body

  try {
    const updated = await prisma.user.update({
      where:{id},
      data:{
        ...(role && {role}),
        ...(level !== undefined && {level:parseInt(level)}),
        ...(name && {name})
      }
    })

    res.json({ message: "User updated by admin successfully", user: updated });
  } catch (error) {
    next(error)
  }
};
