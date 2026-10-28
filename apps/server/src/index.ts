import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { GuidelineRepository, FactRepository } from '@inkloom/database';
import { GuidelineIndexer, FactIndexer } from '@inkloom/vector-store';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  // 1. Pre-warm vector indices with existing guidelines & facts
  try {
    const guidelines = await GuidelineRepository.getAll();
    await GuidelineIndexer.indexGuidelines(guidelines);
    const facts = await FactRepository.getAll();
    await FactIndexer.indexFacts(facts);
    console.log(`[Inkloom AI] Pre-indexed ${guidelines.length} guidelines and ${facts.length} facts in Vector Store.`);
  } catch (e) {
    console.warn('[Inkloom AI] Vector indexing notice:', e);
  }

  // 2. Start Express Server
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[Inkloom AI API] Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
