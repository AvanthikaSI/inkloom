import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@inkloom/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  let database: { connected: boolean; error?: string } = { connected: false, error: 'Database uninitialized' };
  try {
    database = await checkSupabaseConnection();
  } catch (err: any) {
    database = { connected: false, error: err?.message || 'Database connection error' };
  }

  return NextResponse.json({
    status: database.connected ? 'healthy' : 'degraded',
    service: 'Inkloom AI Backend API',
    version: '1.0.0',
    deployment: 'Vercel App Router Unified Deployment (Option A)',
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
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
    }
  });
}
