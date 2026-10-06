import fs from "fs";
import path from "path";
import multer from "multer";

const uploadPath = path.join(process.cwd(), "public", "temp");

// Ensure folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Only accept the right kind of file for each field
const fileFilter = (req, file, cb) => {
  const wantsVideo = file.fieldname === "videoFile";
  const ok = wantsVideo ? file.mimetype.startsWith("video/") : file.mimetype.startsWith("image/");
  cb(ok ? null : new Error(`Invalid file type for ${file.fieldname}`), ok);
};

// 500 MB cap, so one request can't fill the disk
export const upload = multer({ storage, fileFilter, limits: { fileSize: 500 * 1024 * 1024 } });