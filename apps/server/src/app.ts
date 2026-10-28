import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import auditRoutes from './routes/audit.routes.js';
import contentRoutes from './routes/content.routes.js';
import knowledgeRoutes from './routes/knowledge.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { checkSupabaseConnection } from '@inkloom/database';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    const database = await checkSupabaseConnection();

    res.json({
      status: database.connected ? 'healthy' : 'degraded',
      service: 'Inkloom AI Backend API',
      timestamp: new Date().toISOString(),
      database,
      capabilities: [
        'LangGraph Multi-Agent Pipeline',
        'LangGraph Stateful Agentic Orchestrator',
        'Groq AI Adapter (Llama 3.3)',
        'ChromaDB Vector Retrieval',
        'Supabase Storage & PostgreSQL',
        'Lightweight Python Vision & WCAG Checker',
        '3-Tier Risk Gating Engine',
        'Guideline Ambiguity Index',
        'Intent-Preserving Surgical Diff Editor'
      ]
    });
  });

  // Wire API routes
  app.use('/api/audit', auditRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/workflow', workflowRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/chat', chatRoutes);

  return app;
}
