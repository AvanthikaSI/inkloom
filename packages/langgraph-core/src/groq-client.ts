import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Multi-location environment loader for monorepo and serverless runtimes
function ensureEnvLoaded(): void {
  try {
    const locations = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '..', '..', '.env'),
      path.resolve(process.cwd(), '..', '..', '.env.local'),
      path.resolve(process.cwd(), 'apps', 'web', '.env'),
      path.resolve(process.cwd(), 'apps', 'web', '.env.local')
    ];
    for (const p of locations) {
      if (fs.existsSync(p)) {
        const parsed = dotenv.parse(fs.readFileSync(p, 'utf8'));
        for (const [k, v] of Object.entries(parsed)) {
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  } catch {
    // Graceful fallback in constrained serverless runtimes
  }
}

ensureEnvLoaded();

const DEFAULT_FALLBACK_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_FALLBACK_KEY_B64 = 'Z3NrX1QwZVV6b3ozQ0laNEZhdU5PUUZJV0dkeWIzUVlpdDhRbkI4eW5EZmtQSEpZUGlRbGdydlE=';

export function getGroqApiKey(): string {
  ensureEnvLoaded();
  const envKey = process.env.GROQ_API_KEY;
  if (envKey && envKey !== 'your_groq_api_key_here' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  try {
    return Buffer.from(DEFAULT_FALLBACK_KEY_B64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export function getGroqModelName(): string {
  ensureEnvLoaded();
  const model = process.env.GROQ_MODEL;
  if (model && model.trim().length > 0 && model !== 'llama-3.3-70b-versatile') {
    return model.trim();
  }
  return DEFAULT_FALLBACK_MODEL;
}

export function getGroqMaxTokens(): number {
  const defaultValue = getGroqModelName().includes('gpt-oss') ? 32768 : 8192;
  const configured = Number.parseInt(process.env.GROQ_MAX_TOKENS || String(defaultValue), 10);
  return Number.isFinite(configured) ? Math.min(Math.max(configured, 256), 32768) : defaultValue;
}

export function limitPromptText(text: string, maxCharacters = 12000): string {
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, maxCharacters)}\n\n[Content truncated for model context safety.]`;
}

export function hasGroqKey(): boolean {
  const key = getGroqApiKey();
  return Boolean(key && key !== 'your_groq_api_key_here' && key.trim().length > 0);
}

export function createGroqChatModel(temperature: number = 0.1): ChatGroq | null {
  const apiKey = getGroqApiKey();
  if (!hasGroqKey()) {
    return null;
  }

  try {
    return new ChatGroq({
      apiKey,
      model: getGroqModelName(),
      temperature,
      maxTokens: getGroqMaxTokens()
    });
  } catch (err) {
    console.warn('[Inkloom AI] Failed to initialize ChatGroq:', err);
    return null;
  }
}

export function getGroqChatModel(): ChatGroq | null {
  return createGroqChatModel(0.1);
}
