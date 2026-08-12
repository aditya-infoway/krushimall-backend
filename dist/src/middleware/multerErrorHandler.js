import multer from "multer";
export const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).json({ success: false, message: err.message });
        return;
    }
    if (err) {
        res.status(400).json({ success: false, message: err.message || "File upload failed." });
        return;
    }
    next();
};
//# sourceMappingURL=multerErrorHandler.js.map