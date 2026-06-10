import { Router } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

const router = Router()

// router.all('/auth/*', async (req, res) => {
//   try {
//     const authRequest = fromNodeHeaders(req.headers);
//     const result = await auth.handler(authRequest);

//     // Forward the response from Better Auth
//     res.status(result.status).json(result.body);
//   } catch (error) {
//     console.error('Auth error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

export default router