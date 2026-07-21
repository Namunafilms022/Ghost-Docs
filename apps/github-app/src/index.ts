import express, { type Express } from 'express';
import { createClient } from '@ghost-docs/github';
import { logger } from '@ghost-docs/shared';

const app: Express = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);
const WEBHOOK_SECRET = process.env.GHOST_DOCS_WEBHOOK_SECRET || '';

app.post('/webhooks/github', async (req, res) => {
  const event = req.headers['x-github-event'] as string;
  const delivery = req.headers['x-github-delivery'] as string;

  if (!event) {
    return res.status(400).json({ error: 'Missing X-GitHub-Event header' });
  }

  logger.info(`Received webhook: ${event} (delivery: ${delivery})`);

  res.status(202).json({ received: true });

  try {
    await handleEvent(event, req.body);
  } catch (error) {
    logger.error(`Error handling ${event} event`, error as Error);
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function handleEvent(event: string, payload: any) {
  switch (event) {
    case 'push': {
      const { repository, ref } = payload;
      const branch = ref?.replace('refs/heads/', '');
      logger.info(`Push to ${repository?.full_name}:${branch}`);
      break;
    }
    case 'pull_request': {
      const { action, pull_request, repository } = payload;
      logger.info(`PR ${action}: ${repository?.full_name}#${pull_request?.number}`);
      break;
    }
    case 'issues': {
      const { action, issue, repository } = payload;
      logger.info(`Issue ${action}: ${repository?.full_name}#${issue?.number}`);
      break;
    }
    default:
      logger.debug(`Unhandled event type: ${event}`);
  }
}

app.listen(PORT, () => {
  logger.success(`Ghost Docs GitHub App running on port ${PORT}`);
  logger.info(`Webhook endpoint: POST /webhooks/github`);
});

export { app };
