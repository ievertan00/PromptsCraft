
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

// Function to get API keys from environment variables
const getApiKeys = () => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set in the .env file on the server.");
  }
  if (!deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set in the .env file on the server.");
  }

  return { geminiApiKey, deepseekApiKey };
};

// Type definition for the supported AI models
export type SupportedModel = 'gemini' | 'deepseek';

// Function to initialize and get the correct AI client
const getAiClient = (model: SupportedModel) => {
  const { geminiApiKey, deepseekApiKey } = getApiKeys();

  if (model === 'gemini') {
    const modelName = 'gemini-2.5-flash';
    return new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: modelName });
  } else if (model === 'deepseek') {
    return new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: deepseekApiKey,
    });
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
};

// Generic function to generate content from the selected AI model
const generateContent = async (
  systemInstruction: string,
  prompt: string,
  selectedModel: SupportedModel,
  options: { response_format?: { type: "json_object" }; max_tokens?: number } = {}
): Promise<string> => {
  const aiClient = getAiClient(selectedModel);
  const { response_format, max_tokens } = options;

        try {

          let text: string = '';

      

          if (aiClient instanceof GenerativeModel && selectedModel === 'gemini') {

            const result = await aiClient.generateContent({

              contents: [{ role: "user", parts: [{ text: systemInstruction + '\n\n' + prompt }] }],

              generationConfig: { 

                  responseMimeType: response_format?.type === 'json_object' ? 'application/json' : 'text/plain',

                  maxOutputTokens: max_tokens,

              },

            });

                        const candidate = result.response.candidates?.[0];

                        if (candidate) {

                          text = result.response.text();

                          if (candidate.finishReason === 'MAX_TOKENS') {

                            text += '\n[...output truncated due to token limit]';

                          }

                        }

                      } else if (aiClient instanceof OpenAI && selectedModel === 'deepseek') {

                        const completion = await aiClient.chat.completions.create({

                          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],

                          model: "deepseek-chat",

                          response_format: response_format,

                          max_tokens: max_tokens,

                        });

                        const choice = completion.choices[0];

                        if (choice) {

                          text = choice.message?.content ?? '';

                          if (choice.finish_reason === 'length') {

                            text += '\n[...output truncated due to token limit]';

                          }

                        }

          } else {

            throw new Error("Invalid AI client or model configuration.");

          }

      

          if (!text.trim()) {

              return '[AI returned an empty or invalid response]';

          }

      

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

  const prompt = `
    Here is the user's prompt content:
    "${promptContent}"

    Suggest relevant tags.
    `;

  try {
    const jsonText = await generateContent(systemInstruction, prompt, selectedModel, { response_format: { type: "json_object" } });
    const result = JSON.parse(jsonText.trim());

    if (Array.isArray(result.suggestedTags)) {
      return result.suggestedTags;
    } else {
      throw new Error("Invalid JSON structure in AI response.");
    }
  } catch (error) {
    console.error(`Error fetching tag suggestions from ${selectedModel} API:`, error);
    throw new Error(`Failed to get AI tag suggestions from ${selectedModel}.`);
  }
};

export const refinePrompt = async (promptContent: string, selectedModel: SupportedModel, options: { persona?: boolean; task?: boolean; context?: boolean; format?: boolean; max_tokens?: number }): Promise<string> => {
  let systemInstruction = `You are a world-class prompt engineering expert. Your task is to refine the user-submitted prompt to be more effective for large language models. The refined prompt MUST be highly specific, clear, and ready for immediate use.\n\n`;

  if (options.persona ?? true) {
    systemInstruction += `**1. Persona:** Assign a highly relevant and authoritative role or persona to the LLM (e.g., 'Act as a senior software engineer specialized in design patterns').\n`;
  }
  if (options.task ?? true) {
    systemInstruction += `**2. Task:** Clarify and decompose the primary task into specific, actionable steps or sub-objectives. Use strong, imperative verbs.\n`;;
  }
  if (options.context ?? true) {
    systemInstruction += `**3. Context:** Explicitly incorporate relevant background information, key constraints, and necessary domain-specific knowledge to reduce ambiguity.\n`;
  }
  if (options.format ?? true) {
    systemInstruction += `**4. Format:** Strictly specify the desired output format, structure, and style (e.g., "Respond in a JSON object," "Use a 5-point bulleted list in a professional tone").\n`;
  }

  systemInstruction += `\n**Instructions:**
  - Analyze the user's original prompt and integrate the enabled refinement criteria above.
  - Generate ONLY the complete, optimized prompt text.
  - Do NOT include any commentary, explanations, or dialogue before or after the refined prompt.`;

  return generateContent(systemInstruction, promptContent, selectedModel, { max_tokens: options.max_tokens });
};

export const suggestTitle = async (promptContent: string, selectedModel: SupportedModel): Promise<string> => {
  const systemInstruction = `You are an expert at summarizing text into concise, descriptive titles. Your task is to generate a short, clear, and relevant title for the given prompt content.
    - The title should be no more than 10 words.
    - The tone MUST be descriptive, neutral, and suitable for a UI element.
    - Detect the language of the given prompt content and respond ONLY with the suggested title text in that same language.
    - Respond ONLY with the suggested title text. Do not add any extra commentary or markdown formatting.`;

  return generateContent(systemInstruction, promptContent, selectedModel);
};
