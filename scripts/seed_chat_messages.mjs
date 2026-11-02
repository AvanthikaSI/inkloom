import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(url, key);

async function seed() {
  const msgs = [
    {
      id: 'msg_wcag_u',
      session_id: 'session_1793597859467',
      role: 'user',
      content: 'Check WCAG contrast between Midnight Navy (#0F172A) and Canvas (#FFFFFF).'
    },
    {
      id: 'msg_wcag_a',
      session_id: 'session_1793597859467',
      role: 'assistant',
      content: 'The contrast ratio between **Midnight Navy (#0F172A)** and **Canvas (#FFFFFF)** is **15.8:1**, which exceeds the **WCAG 2.1 AA** minimum requirement of 4.5:1.'
    },
    {
      id: 'msg_audit_u',
      session_id: 'session_1793597842088',
      role: 'user',
      content: 'Audit this copy: "We are thrilled to announce InkLoom, the cheap tool with zero latency."'
    },
    {
      id: 'msg_audit_a',
      session_id: 'session_1793597842088',
      role: 'assistant',
      content: 'Analysis detected 2 policy violations:\n1. Banned term: "cheap" (Rule: Cost-effective)\n2. Unsupported superlative: "zero latency" (Rule: Substantiate marketing claims)'
    }
  ];

  const res = await sb.from('chat_messages').upsert(msgs, { onConflict: 'id' });
  console.log('Seeded chat_messages:', res.error);
}

seed();
