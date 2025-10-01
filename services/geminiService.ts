import { GoogleGenAI, Type } from "@google/genai";


const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not set. Please create a .env file in the root of the project and add VITE_GEMINI_API_KEY=<your-api-key>.");
}

const ai = new GoogleGenAI({ apiKey });

export const suggestTags = async (promptContent: string): Promise<string[]> => {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at organizing content. Analyze the user's prompt and suggest relevant tags.
    - Generate 3 to 5 descriptive tags.
    - Respond ONLY with a valid JSON object with a "suggestedTags" key containing an array of strings.`;

    const prompt = `
    Here is the user's prompt content:
    "${promptContent}"

    Suggest relevant tags.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedTags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                    required: ['suggestedTags'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (Array.isArray(result.suggestedTags)) {
            return result.suggestedTags;
        } else {
            throw new Error("Invalid JSON structure in AI response.");
        }
    } catch (error) {
        console.error("Error fetching tag suggestions from Gemini API:", error);
        throw new Error("Failed to get AI tag suggestions.");
    }
};


export const refinePrompt = async (promptContent: string): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a world-class prompt engineering expert. Your task is to refine the user-submitted prompt to be more effective for large language models.
    Follow these best practices:
    - Add clarity and specificity.
    - Define the desired format for the output.
    - Provide context and constraints.
    - Assign a role or persona to the AI.
    - Use clear and concise language.
    Respond ONLY with the refined prompt text. Do not add any extra commentary or markdown formatting.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: promptContent,
            config: {
                systemInstruction
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error refining prompt with Gemini API:", error);
        throw new Error("Failed to refine prompt.");
    }
};

export const suggestTitle = async (promptContent: string): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert at summarizing text into concise, descriptive titles. Your task is to generate a short, clear, and relevant title for the given prompt content.
    - The title should be no more than 10 words.
    - Respond ONLY with the suggested title text. Do not add any extra commentary or markdown formatting.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: promptContent,
            config: {
                systemInstruction
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting title with Gemini API:", error);
        throw new Error("Failed to get AI title suggestion.");
    }
};
