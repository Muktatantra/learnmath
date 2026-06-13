import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CODE_PATTERN, generateCode, readProgress, writeProgress } from './lib/sync-store.js';
import { isValidProgress, mergeProgress } from './public/js/progress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20kb' }));

app.post('/api/sync', (req, res) => {
  const progress = req.body?.progress;
  if (!isValidProgress(progress)) {
    return res.status(400).json({ error: 'Invalid progress data' });
  }
  const code = generateCode();
  writeProgress(code, progress);
  res.json({ code, progress });
});

app.get('/api/sync/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return res.status(400).json({ error: 'Invalid sync code' });
  }
  const progress = readProgress(code);
  if (!progress) {
    return res.status(404).json({ error: 'Sync code not found' });
  }
  res.json({ progress });
});

app.put('/api/sync/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return res.status(400).json({ error: 'Invalid sync code' });
  }
  const progress = req.body?.progress;
  if (!isValidProgress(progress)) {
    return res.status(400).json({ error: 'Invalid progress data' });
  }
  const existing = readProgress(code);
  if (!existing) {
    return res.status(404).json({ error: 'Sync code not found' });
  }
  const merged = mergeProgress(existing, progress);
  writeProgress(code, merged);
  res.json({ progress: merged });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`learnmath server running on port ${PORT}`);
});
