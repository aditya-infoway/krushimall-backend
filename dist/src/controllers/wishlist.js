import prisma from "../lib/prisma.js";
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await prisma.wishlist.findMany({
            where: { webUserId: userId },
            include: { variant: { include: { brand: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: items });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
    }
};
export const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { variantId } = req.body;
        if (!variantId) {
            return res.status(400).json({ success: false, message: "variantId is required" });
        }
        const existing = await prisma.wishlist.findUnique({
            where: { webUserId_variantId: { webUserId: userId, variantId: Number(variantId) } },
        });
        if (existing) {
            await prisma.wishlist.delete({ where: { id: existing.id } });
            return res.json({ success: true, wishlisted: false });
        }
        await prisma.wishlist.create({
            data: { webUserId: userId, variantId: Number(variantId) },
        });
        res.json({ success: true, wishlisted: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to update wishlist" });
    }
};
export const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.wishlist.deleteMany({ where: { webUserId: userId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to clear wishlist" });
    }
};
//# sourceMappingURL=wishlist.js.map