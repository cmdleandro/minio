import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());

// Variáveis de ambiente
const {
  MINIO_ENDPOINT = '127.0.0.1',
  MINIO_PORT = '9000',
  MINIO_USE_SSL = 'false', // "true" ou "false"
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET = 'uploads',
  EXPIRES_SECONDS = '86400' // 24h
} = process.env;

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
  console.error('Faltam MINIO_ACCESS_KEY/MINIO_SECRET_KEY no ambiente.');
  process.exit(1);
}

const minio = new Client({
  endPoint: MINIO_ENDPOINT,
  port: Number(MINIO_PORT),
  useSSL: MINIO_USE_SSL === 'true',
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// health check
// health simples (não depende do MinIO)
app.get('/health', (_req, res) => res.json({ ok: true, service: 'presign' }));

// Presigned PUT (upload) => retorna URL para enviar o arquivo
app.get('/presign/put', async (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'key (nome do arquivo) é obrigatório' });

    const url = await minio.presignedPutObject(MINIO_BUCKET, key, Number(EXPIRES_SECONDS));
    res.json({ url, key, bucket: MINIO_BUCKET, expires: Number(EXPIRES_SECONDS) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Presigned GET (download) => retorna URL temporária para leitura
app.get('/presign/get', async (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'key (nome do arquivo) é obrigatório' });

    const url = await minio.presignedGetObject(MINIO_BUCKET, key, Number(EXPIRES_SECONDS));
    res.json({ url, key, bucket: MINIO_BUCKET, expires: Number(EXPIRES_SECONDS) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Presign API on :${PORT}`));
