import { GoogleGenAI, Type } from "@google/genai";
import type { Folder } from '../types';

// Per coding guidelines, API_KEY is assumed to be set in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generateSimpleIdToPathMap = (folders: Folder[], path = ''): Record<string, string> => {
    let map: Record<string, string> = {};
    for (const folder of folders) {
        const currentPath = path ? `${path}/${folder.name}` : `/${folder.name}`;
        map[folder.id] = currentPath;
        if (folder.children && folder.children.length > 0) {
            map = { ...map, ...generateSimpleIdToPathMap(folder.children, currentPath) };
        }
    }
    return map;
};

export const suggestFolderAndTags = async (
    promptContent: string,
    folders: Folder[]
): Promise<{ suggestedFolderId: string; suggestedTags: string[] }> => {
    const folderMap = generateSimpleIdToPathMap(folders);

    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are an expert at organizing content. Analyze the user's prompt and suggest the best folder and some relevant tags.
    - Choose the most relevant folder ID from the provided list.
    - Generate 3 to 5 descriptive tags.
    - Respond ONLY with a valid JSON object.`;

    const prompt = `
    Here is the available folder structure:
    ${JSON.stringify(folderMap, null, 2)}

    Here is the user's prompt content:
    "${promptContent}"

    Suggest the most appropriate folder ID and relevant tags.
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
                        suggestedFolderId: { type: Type.STRING },
                        suggestedTags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                    required: ['suggestedFolderId', 'suggestedTags'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result.suggestedFolderId && Array.isArray(result.suggestedTags)) {
            return result;
        } else {
            throw new Error("Invalid JSON structure in AI response.");
        }
    } catch (error) {
        console.error("Error fetching suggestions from Gemini API:", error);
        throw new Error("Failed to get AI suggestions.");
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
