import express from "express";
import cors from "cors";
import { phonesRouter } from "./routes/phones";
import { ensurePhoneModelsSeeded } from "./storage/database/seed";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (_req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/phones', phonesRouter);

async function start() {
  // 启动自举：目标数据库 phone_models 为空时自动灌入 16 台机型种子数据（幂等）
  await ensurePhoneModelsSeeded();
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
  });
}

start();
