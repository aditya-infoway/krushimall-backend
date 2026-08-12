// export const getFileUrl = (filename?: string | null): string | null => {
//   if (!filename) return null;
//   const baseUrl =
//     process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
//   return `${baseUrl}/uploads/${filename}`;
// };
export const getFileUrl = (filename) => {
    if (!filename)
        return null;
    const baseUrl = process.env.BASE_URL;
    return `${baseUrl}/uploads/${filename}`;
};
//# sourceMappingURL=getFileUrl.js.map