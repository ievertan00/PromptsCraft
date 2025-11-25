import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import OpenAI from "openai";
import 'dotenv/config';



// Logging utility with environment-based toggle
const isLoggingEnabled = process.env.ENABLE_LLM_LOGS === 'true';

const logLLMRequest = (model: string, systemInstruction: string, prompt: string, options?: any) => {
  if (!isLoggingEnabled) return;
  console.log("==================== LLM REQUEST LOG ====================");
  console.log(`Model: ${model}`);
  console.log("System Instruction:\n", systemInstruction);
  console.log("Prompt:\n", prompt);
  if (options) {
    console.log("Options:", JSON.stringify(options, null, 2));
  }
  console.log("========================================================\n");
};

const getApiKeys = () => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

  if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not set in the .env file on the server.");
  if (!deepseekApiKey) throw new Error("DEEPSEEK_API_KEY is not set in the .env file on the server.");

  return { geminiApiKey, deepseekApiKey };
};

export type SupportedModel = 'gemini' | 'deepseek';

const getAiClient = (model: SupportedModel) => {
  const { geminiApiKey, deepseekApiKey } = getApiKeys();

  if (model === 'gemini') {
    const modelName = 'gemini-2.5-flash';
    return new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: modelName });
  } else if (model === 'deepseek') {
    return new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: deepseekApiKey });
  }
  throw new Error(`Unsupported model: ${model}`);
};

const generateContent = async (
  systemInstruction: string,
  prompt: string,
  selectedModel: SupportedModel,
  options: { response_format?: { type: "json_object" }; max_tokens?: number } = {}
): Promise<string> => {
  const aiClient = getAiClient(selectedModel);
  const { response_format, max_tokens } = options;

  const extendedPrompt = `${prompt}\n\n(Note: Please limit your response to approximately ${max_tokens || 1024} tokens if possible.)`;
  logLLMRequest(selectedModel, systemInstruction, extendedPrompt, options);

  try {
    let text = '';

    if (aiClient instanceof GenerativeModel && selectedModel === 'gemini') {
      try {
        const result = await aiClient.generateContent({
          contents: [{ role: "user", parts: [{ text: systemInstruction + '\n\n' + extendedPrompt }] }],
          generationConfig: {
            responseMimeType: response_format?.type === 'json_object' ? 'application/json' : 'text/plain',
          },
        });
        const candidate = result.response.candidates?.[0];
        if (candidate) text = result.response.text();
      } catch (error) {
        console.error(`Error specifically from Gemini API:`, error);
        throw error; // Re-throw the error to be caught by the outer catch block
      }
    } else if (aiClient instanceof OpenAI && selectedModel === 'deepseek') {
      try {
        const completion = await aiClient.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: extendedPrompt },
          ],
          model: "deepseek-chat",
          response_format: response_format,
        });
        const choice = completion.choices[0];
        if (choice) text = choice.message?.content ?? '';
      } catch (error) {
        console.error(`Error specifically from Deepseek API:`, error);
        throw error; // Re-throw the error to be caught by the outer catch block
      }
    } else {
      throw new Error("Invalid AI client or model configuration.");
    }

    if (!text.trim()) return '[AI returned an empty or invalid response]';

    return text;
  } catch (error) {
    console.error(`Error generating content with ${selectedModel} API:`, error);
    throw new Error(`Failed to generate content with ${selectedModel}.`);
  }
};

export const suggestTags = async (promptContent: string, selectedModel: SupportedModel): Promise<string[]> => {
  const systemInstruction = `You are an expert at organizing content. Analyze the user's prompt and suggest relevant tags.
  - Generate 3 to 5 descriptive tags.
  - Detect the language of the user's prompt and respond ONLY with tags in that same language.
  - Respond ONLY with a valid JSON object with a "suggestedTags" key containing an array of strings.`;

  const prompt = `Here is the user's prompt content:\n"${promptContent}"\n\nSuggest relevant tags.`;

  try {
    const jsonText = await generateContent(systemInstruction, prompt, selectedModel, { response_format: { type: "json_object" } });
    const result = JSON.parse(jsonText.trim());

    if (Array.isArray(result.suggestedTags)) return result.suggestedTags;
    throw new Error("Invalid JSON structure in AI response.");
  } catch (error) {
    console.error(`Error fetching tag suggestions from ${selectedModel} API:`, error);
    throw new Error(`Failed to get AI tag suggestions from ${selectedModel}.`);
  }
};

export const refinePrompt = async (
  promptContent: string,
  selectedModel: SupportedModel,
  options: { persona?: boolean; task?: boolean; context?: boolean; format?: boolean; max_tokens?: number }
): Promise<string> => {
  let systemInstruction = `You are a world-class prompt engineering expert. Your task is to refine the user-submitted prompt to be more effective for large language models.\nFollow these best practices based on the user's selections:\n`;

  if (options.persona ?? true) systemInstruction += `**1. Persona:** Assign a highly relevant and authoritative role or persona.\n`;
  if (options.task ?? true) systemInstruction += `**2. Task:** Clarify and decompose the primary task into specific, actionable steps.\n`;
  if (options.context ?? true) systemInstruction += `**3. Context:** Incorporate background information and constraints.\n`;
  if (options.format ?? true) systemInstruction += `**4. Format:** Specify the desired output structure and style.\n`;

  systemInstruction += `\n**Instructions:**\n- Analyze the user's original prompt and integrate the enabled refinement criteria.\n- Generate ONLY the optimized prompt text.\n- Detect the language of the prompt and respond in that same language.\n- Do NOT include explanations or commentary.`;

  return generateContent(systemInstruction, promptContent, selectedModel, { max_tokens: options.max_tokens });
};

export const suggestTitle = async (promptContent: string, selectedModel: SupportedModel): Promise<string> => {
  const systemInstruction = `You are an expert at summarizing text into concise titles.\n- Generate a short, clear, relevant title (≤10 words).\n- Respond ONLY with the title text in the same language as the input.`;

  return generateContent(systemInstruction, promptContent, selectedModel);
};