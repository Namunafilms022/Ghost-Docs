import express from 'express';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { extractKnowledge } from '@ghost-docs/intelligence-engine';
import { RepositoryReasoner } from '@ghost-docs/reasoning-engine';
import { logger } from '@ghost-docs/shared';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4000', 10);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/explain', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }
  try {
    const knowledge = await extractKnowledge({ repoUrl });
    res.json({ success: true, data: knowledge });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/reason', async (req, res) => {
  const { repoUrl, question } = req.body;
  if (!repoUrl || !question) {
    return res.status(400).json({ error: 'repoUrl and question are required' });
  }
  try {
    const knowledge = await extractKnowledge({ repoUrl });
    const reasoner = new RepositoryReasoner();
    const answer = reasoner.ask(knowledge, question);
    res.json({ success: true, data: answer });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/analyze', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }
  try {
    const knowledge = await extractKnowledge({ repoUrl });
    res.json({
      success: true,
      data: {
        summary: knowledge.project_summary,
        languages: knowledge.languages,
        modules: knowledge.modules.map((m) => ({ name: m.name, path: m.path, type: m.type })),
        dependencies: knowledge.direct_dependencies,
        entryPoints: knowledge.entry_points.map((e) => ({ path: e.path, type: e.type })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

const staticDir = resolve(import.meta.dirname, '../public');
if (existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

app.get('/', (_req, res) => {
  const html = readFileSync(resolve(staticDir, 'index.html'), 'utf-8');
  res.type('html').send(html);
});

app.listen(PORT, () => {
  logger.success(`Ghost Docs Dashboard running on http://localhost:${PORT}`);
  logger.info(`API: POST /api/explain, /api/reason, /api/analyze`);
});
