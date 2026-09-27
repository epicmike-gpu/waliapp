import app from "./app";
import { ensurePhoneModelsSeeded } from "./storage/database/seed";

const port = process.env.PORT || 9091;

async function start() {
  // 启动自举：目标数据库 phone_models 为空时自动灌入 16 台机型种子数据（幂等）
  await ensurePhoneModelsSeeded();
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
  });
}

start();
