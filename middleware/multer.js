import multer from "multer";
import { s3Storage } from "../utils/fileUploadS3.js";

const sanitizeFile = (file, cb) => {
  const allowedTypes = [
    // Images
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/quicktime", // for .mov
    "video/x-msvideo", // for .avi
    "video/x-matroska", // for .mkv
  ];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb("Error: File type not allowed!");
};

export const upload = multer({
  storage: s3Storage,
  fileFilter: (req, file, callback) => sanitizeFile(file, callback),
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
});
