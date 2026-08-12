import { Router } from "express";
import { verifyWebToken } from "../middleware/verifyWebToken.js";
import { getWishlist, toggleWishlist, clearWishlist } from "../controllers/wishlist.js";
const router = Router();
router.use(verifyWebToken); // vendor tokens get rejected here automatically
router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);
router.delete("/", clearWishlist);
export default router;
//# sourceMappingURL=wishlist.js.map