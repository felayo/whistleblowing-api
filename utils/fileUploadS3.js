// utils/fileUploadS3.js
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: "us-east-1",
});

export const s3Storage = multerS3({
  s3,
  bucket: "winelight-files",
  acl: "public-read",
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName = `${Date.now()}_${file.fieldname}_${file.originalname}`;
    cb(null, fileName);
  },
});
