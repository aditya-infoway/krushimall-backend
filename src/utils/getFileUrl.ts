export const getFileUrl = (filename?: string | null): string | null => {
  if (!filename) return null;

  const baseUrl = process.env.BASE_URL;

  return `${baseUrl}/uploads/${filename}`;
};