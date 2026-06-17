import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { handleAssistantChat } from "../controllers/ai.controller";

const router = Router()
// router.use(requireAuth);

router.post('/', handleAssistantChat)

export default router;