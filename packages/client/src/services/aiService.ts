import { SupportedModel } from '../types';
import { api } from './api';

const API_BASE_URL = '/ai';

export const suggestTags = async (promptContent: string, selectedModel: SupportedModel): Promise<string[]> => {
    const response = await api.post(`${API_BASE_URL}/suggest-tags`, { promptContent, selectedModel });
    return response.data.suggestedTags;
};

export const refinePrompt = async (promptContent: string, selectedModel: SupportedModel, options: { persona?: boolean; task?: boolean; context?: boolean; format?: boolean; max_tokens?: number }): Promise<string> => {
    const response = await api.post(`${API_BASE_URL}/refine-prompt`, { promptContent, selectedModel, ...options });
    return response.data.refinedPrompt;
};

export const suggestTitle = async (promptContent: string, selectedModel: SupportedModel): Promise<string> => {
    const response = await api.post(`${API_BASE_URL}/suggest-title`, { promptContent, selectedModel });
    return response.data.suggestedTitle;
};