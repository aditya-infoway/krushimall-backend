import { Router } from "express";
import { sendTestNotification } from "../controllers/notification.js";
const router = Router();
router.post("/test", sendTestNotification);
export default router;
//# sourceMappingURL=notification.js.map