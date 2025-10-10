/*
Optimized TypeScript module: unified clients for Gemini (Google Generative AI) and DeepSeek (OpenAI-compatible),
with defensive parsing, singleton client instances, optional caching, retries, and improved typings.

Updated: moved max_tokens into prompt instructions instead of a hard API limit to reduce truncation.
*/

import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { GenerativeModel } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

export type SupportedModel = 'gemini' | 'deepseek';

type GeminiClient = GenerativeModel;
type DeepseekClient = OpenAI;

type ClientType = { kind: 'gemini'; client: GeminiClient } | { kind: 'deepseek'; client: DeepseekClient };

interface GenerateOptions {
  response_format?: { type: 'json_object' } | null;
  max_tokens?: number;
  retries?: number;
}

const DEFAULT_RETRIES = 2;
const CACHE_MAX_ENTRIES = 200;
const requestCache = new Map<string, string>();

function cacheSet(key: string, value: string) {
  if (requestCache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = requestCache.keys().next().value;
    if (firstKey) requestCache.delete(firstKey);
  }
  requestCache.set(key, value);
}

function cacheGet(key: string) {
  return requestCache.get(key);
}

function makeCacheKey(systemInstruction: string, prompt: string, model: SupportedModel, options?: GenerateOptions) {
  return JSON.stringify({ systemInstruction, prompt, model, options });
}

function getApiKeys() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not set.');
  if (!deepseekApiKey) throw new Error('DEEPSEEK_API_KEY is not set.');
  return { geminiApiKey, deepseekApiKey };
}

const clientStore = new Map<SupportedModel, ClientType>();

export function getAiClient(model: SupportedModel): ClientType {
  const existing = clientStore.get(model);
  if (existing) return existing;
  const { geminiApiKey, deepseekApiKey } = getApiKeys();

  if (model === 'gemini') {
    const client = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
    const wrapper: ClientType = { kind: 'gemini', client };
    clientStore.set('gemini', wrapper);
    return wrapper;
  }

  if (model === 'deepseek') {
    const client = new OpenAI({ apiKey: deepseekApiKey, baseURL: 'https://api.deepseek.com' });
    const wrapper: ClientType = { kind: 'deepseek', client };
    clientStore.set('deepseek', wrapper);
    return wrapper;
  }

  throw new Error(`Unsupported model: ${model}`);
}

function extractTextFromGemini(result: any): string {
  try {
    if (result?.response?.text && typeof result.response.text === 'function') {
      const t = result.response.text();
      if (t) return String(t);
    }
    const candidate = result?.response?.candidates?.[0];
    if (!candidate) return '';
    const content = candidate.content;
    if (Array.isArray(content) && content.length) {
      const first = content[0];
      if (typeof first === 'string') return first;
      if (Array.isArray(first.parts) && first.parts.length) return String(first.parts.join(''));
      if (typeof first.text === 'string') return first.text;
    }
    if (typeof candidate.text === 'string') return candidate.text;
    return '';
  } catch {
    return '';
  }
}

async function withRetries<T>(fn: () => Promise<T>, retries = DEFAULT_RETRIES): Promise<T> {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((res) => setTimeout(res, 200 * Math.pow(2, attempt)));
      attempt++;
    }
  }
  throw lastErr;
}

export async function generateContent(
  systemInstruction: string,
  prompt: string,
  selectedModel: SupportedModel,
  options: GenerateOptions = {}
): Promise<string> {
  const response_format = options.response_format ?? null;
  const retries = options.retries ?? DEFAULT_RETRIES;

  const cacheKey = makeCacheKey(systemInstruction, prompt, selectedModel, options);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const clientWrapper = getAiClient(selectedModel);

  const callApi = async () => {
    const maxTokenNote = options.max_tokens
      ? `\n(Note: You may produce up to approximately ${options.max_tokens} tokens of output if needed.)`
      : '';

    const fullPrompt = `${systemInstruction}\n\n${prompt}${maxTokenNote}`;

    if (clientWrapper.kind === 'gemini') {
      const gm = clientWrapper.client as GeminiClient;
      const result = await gm.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseMimeType: response_format?.type === 'json_object' ? 'application/json' : 'text/plain',
        },
      } as any);
      const text = extractTextFromGemini(result)?.trim() ?? '';
      if (!text) throw new Error('Empty response from Gemini');
      cacheSet(cacheKey, text);
      return text;
    }

    if (clientWrapper.kind === 'deepseek') {
      const openai = clientWrapper.client as DeepseekClient;
      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt + maxTokenNote },
        ],
        response_format: response_format ?? undefined,
      } as any);
      const choice = completion?.choices?.[0];
      if (!choice) throw new Error('Empty response from Deepseek');
      const text = (choice.message?.content ?? '').trim();
      if (!text) throw new Error('Empty content from Deepseek');
      cacheSet(cacheKey, text);
      return text;
    }

    throw new Error('Unsupported client type');
  };

  return withRetries(callApi, retries);
}

export async function suggestTags(promptContent: string, selectedModel: SupportedModel): Promise<string[]> {
  const systemInstruction = `You are an expert at organizing content. Analyze the user's prompt and suggest relevant tags.\n- Generate 3 to 5 descriptive tags.\n- Detect the language of the user's prompt and respond ONLY with tags in that same language.\n- Respond ONLY with a valid JSON object with a \"suggestedTags\" key containing an array of strings.`;
  const prompt = `Here is the user's prompt content:\n"${promptContent}"\n\nSuggest relevant tags.`;

  const raw = await generateContent(systemInstruction, prompt, selectedModel, { response_format: { type: 'json_object' } });
  let parsed: any;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else throw new Error(`Invalid JSON: ${raw}`);
  }
  if (!Array.isArray(parsed.suggestedTags)) throw new Error('Invalid structure');
  return parsed.suggestedTags.map(String);
}

export async function refinePrompt(
  promptContent: string,
  selectedModel: SupportedModel,
  options: { persona?: boolean; task?: boolean; context?: boolean; format?: boolean; max_tokens?: number } = {}
): Promise<string> {
  const personaEnabled = options.persona !== false;
  const taskEnabled = options.task !== false;
  const contextEnabled = options.context !== false;
  const formatEnabled = options.format !== false;

  let systemInstruction = `You are a world-class prompt engineering expert. Your task is to refine the user-submitted prompt to be more effective for large language models.\n`;

  if (personaEnabled) systemInstruction += `1) Persona: assign an authoritative role.\n`;
  if (taskEnabled) systemInstruction += `2) Task: clarify and decompose tasks.\n`;
  if (contextEnabled) systemInstruction += `3) Context: include background and constraints.\n`;
  if (formatEnabled) systemInstruction += `4) Format: specify output structure.\n`;

  systemInstruction += `\nInstructions:\n- Output ONLY the refined prompt text in the same language.\n- Do NOT include commentary.`;

  const refined = await generateContent(systemInstruction, promptContent, selectedModel, { max_tokens: options.max_tokens });
  return refined.trim();
}

export async function suggestTitle(promptContent: string, selectedModel: SupportedModel): Promise<string> {
  const systemInstruction = `You are an expert at summarizing text into concise, descriptive titles.\n- The title should be no more than 10 words.\n- Detect the language of the given prompt and respond ONLY with the suggested title text.`;
  const title = await generateContent(systemInstruction, promptContent, selectedModel);
  return title.trim();
}

export default { getAiClient, generateContent, suggestTags, refinePrompt, suggestTitle };
