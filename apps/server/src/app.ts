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

  // Permissive CORS configuration for standalone frontend/backend deployments
  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Central Health / Root Status Handler
  const healthHandler = async (_req: Request, res: Response) => {
    let database: { connected: boolean; error?: string } = { connected: false, error: 'Database uninitialized' };
    try {
      database = await checkSupabaseConnection();
    } catch (err: any) {
      database = { connected: false, error: err?.message || 'Database connection error' };
    }

    res.json({
      status: database.connected ? 'healthy' : 'degraded',
      service: 'Inkloom AI Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database,
      endpoints: [
        '/api/health',
        '/api/audit/analyze',
        '/api/audit/:contentId',
        '/api/content/:contentId',
        '/api/content/:contentId/apply-patch',
        '/api/content/:contentId/override',
        '/api/knowledge/guidelines',
        '/api/knowledge/facts',
        '/api/knowledge/terminology',
        '/api/knowledge/brand-kit',
        '/api/workflow/:contentId/comments',
        '/api/workflow/:contentId/status',
        '/api/workflow/:contentId/audit-logs',
        '/api/analytics/overview',
        '/api/analytics/ambiguity-metrics',
        '/api/chat/message',
        '/api/chat/history/:sessionId',
        '/api/chat/reset/:sessionId'
      ],
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
  };

  // Mount health check on both /api/health and /health, plus root status
  app.get('/', healthHandler);
  app.get('/health', healthHandler);
  app.get('/api', healthHandler);
  app.get('/api/health', healthHandler);

  // Wire API routes (mounted with AND without /api prefix for flexible routing across proxies)
  app.use('/api/audit', auditRoutes);
  app.use('/audit', auditRoutes);

  app.use('/api/content', contentRoutes);
  app.use('/content', contentRoutes);

  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/knowledge', knowledgeRoutes);

  app.use('/api/workflow', workflowRoutes);
  app.use('/workflow', workflowRoutes);

  app.use('/api/analytics', analyticsRoutes);
  app.use('/analytics', analyticsRoutes);

  app.use('/api/chat', chatRoutes);
  app.use('/chat', chatRoutes);

  // Catch-all 404 handler that ALWAYS returns structured JSON (never HTML!)
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`
    });
  });

  // Global error handler that ALWAYS returns structured JSON (never HTML!)
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('[Inkloom API Server Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error occurred.'
    });
  });

  return app;
}
