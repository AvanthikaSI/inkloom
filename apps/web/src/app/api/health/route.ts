import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@inkloom/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  let database: { connected: boolean; error?: string } = {
    connected: false,
    error: 'Database uninitialized'
  };
  try {
    database = await checkSupabaseConnection();
  } catch (err: any) {
    database = { connected: false, error: err?.message || 'Database error' };
  }

  return NextResponse.json({
    status: database.connected ? 'healthy' : 'degraded',
    service: 'Inkloom AI Backend API',
    version: '1.0.0',
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
}
