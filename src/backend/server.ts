import express from 'express';
import cors from 'cors';
import { assistRouter } from './routes/assist';
import { logRouter } from './routes/log';
import { autosaveRouter } from './routes/autosave';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/assist', assistRouter);
app.use('/log', logRouter);
app.use('/autosave', autosaveRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
