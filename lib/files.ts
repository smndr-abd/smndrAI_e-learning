export const BUCKET = "course-files";
export const MAX_FILE_MB = 50;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [
  "pdf", "epub", "zip", "pptx", "ppt", "docx", "doc", "xlsx", "csv",
  "txt", "md", "ipynb", "py", "png", "jpg", "jpeg",
];

export function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

// Storage keys must be plain: letters, numbers, dot, dash, underscore.
export function safeName(name: string) {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-120) || "file";
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
