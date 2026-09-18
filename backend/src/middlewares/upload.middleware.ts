import fs from "fs";
import path from "path";
import multer from "multer";

const PASTA_UPLOADS = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(PASTA_UPLOADS)) {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });
}

// RNF-04 — tipos permitidos: PDF, imagem, vídeo (ou link externo, tratado à parte).
const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const armazenamento = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PASTA_UPLOADS),
  filename: (_req, file, cb) => {
    const sufixo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extensao = path.extname(file.originalname);
    cb(null, `${sufixo}${extensao}`);
  },
});

export const uploadEntrega = multer({
  storage: armazenamento,
  limits: { fileSize: 50 * 1024 * 1024 }, // RNF-04 — até 50 MB por arquivo
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      cb(new Error("Tipo de arquivo não permitido. Envie PDF, imagem ou vídeo."));
      return;
    }
    cb(null, true);
  },
});

export function tipoLegivel(mimetype: string): string {
  if (mimetype === "application/pdf") return "PDF";
  if (mimetype.startsWith("image/")) return "Imagem";
  if (mimetype.startsWith("video/")) return "Vídeo";
  return "Arquivo";
}

export const NOME_PASTA_UPLOADS = PASTA_UPLOADS;
