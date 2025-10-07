
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
  response_format: { type: "json_object" } | undefined = undefined
): Promise<string> => {
  const aiClient = getAiClient(selectedModel);

  try {
    if (aiClient instanceof GenerativeModel && selectedModel === 'gemini') {
      const result = await aiClient.generateContent({
        contents: [{ role: "user", parts: [{ text: systemInstruction + '\n\n' + prompt }] }],
        generationConfig: { responseMimeType: response_format?.type === 'json_object' ? 'application/json' : 'text/plain' },
      });
      return result.response.text();
    } else if (aiClient instanceof OpenAI && selectedModel === 'deepseek') {
      const completion = await aiClient.chat.completions.create({
        messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
        model: "deepseek-chat",
        response_format: response_format,
      });
      return completion.choices[0].message.content ?? "";
    } else {
      throw new Error("Invalid AI client or model configuration.");
    }
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
    const jsonText = await generateContent(systemInstruction, prompt, selectedModel, { type: "json_object" });
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

export const refinePrompt = async (promptContent: string, selectedModel: SupportedModel): Promise<string> => {
  const systemInstruction = `You are a world-class prompt engineering expert. Your task is to refine the user-submitted prompt to be more effective for large language models.
    Follow these best practices:
    - Add clarity and specificity.
    - Define the desired format for the output.
    - Provide context and constraints.
    - Assign a role or persona to the AI.
    - Use clear and concise language.
    Respond ONLY with the refined prompt text. Do not answer the question directly or add any extra commentary.`;

  return generateContent(systemInstruction, promptContent, selectedModel);
};

export const suggestTitle = async (promptContent: string, selectedModel: SupportedModel): Promise<string> => {
  const systemInstruction = `You are an expert at summarizing text into concise, descriptive titles. Your task is to generate a short, clear, and relevant title for the given prompt content.
    - The title should be no more than 10 words.
    - Detect the language of the given prompt content and respond ONLY with the suggested title text in that same language.
    - Respond ONLY with the suggested title text. Do not add any extra commentary or markdown formatting.`;

  return generateContent(systemInstruction, promptContent, selectedModel);
};
