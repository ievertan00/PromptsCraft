import { SupportedModel } from '../types';

const API_BASE_URL = 'http://localhost:3001/api/ai';

export const suggestTags = async (promptContent: string, selectedModel: SupportedModel): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/suggest-tags`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptContent, selectedModel }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI tag suggestions.');
    }

    const data = await response.json();
    return data.suggestedTags;
};

export const refinePrompt = async (promptContent: string, selectedModel: SupportedModel, options: { persona?: boolean; task?: boolean; context?: boolean; format?: boolean; max_tokens?: number }): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/refine-prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptContent, selectedModel, ...options }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine prompt.');
    }

    const data = await response.json();
    return data.refinedPrompt;
};

export const suggestTitle = async (promptContent: string, selectedModel: SupportedModel): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/suggest-title`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptContent, selectedModel }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to suggest title.');
    }

    const data = await response.json();
    return data.suggestedTitle;
};