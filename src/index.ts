import 'dotenv/config';
import express, { Request, Response } from 'express';
import emailRoutes from './routes/email';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api', emailRoutes);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
