import express from "express";
import cors from "cors";
import { phonesRouter } from "./routes/phones";
import { reportsRouter } from "./routes/reports";
import { appRouter } from "./routes/app";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (_req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/app', appRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/phones', phonesRouter);

export default app;
