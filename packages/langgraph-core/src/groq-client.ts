import { ChatGroq } from '@langchain/groq';

export function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || '';
}

export function getGroqModelName(): string {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
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
