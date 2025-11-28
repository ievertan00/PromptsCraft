import axios from 'axios';
import type { Folder, Prompt } from 'shared/types';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper to build the folder tree structure from a flat list
const buildFolderTree = (items: Folder[], parentId: string | null = null): Folder[] => {
    return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
            ...item,
            children: buildFolderTree(items, item.id),
        }));
};

export const getFolders = async (): Promise<Folder[]> => {
    const response = await api.get('/folders');
    return buildFolderTree(response.data);
};

export const getTrashFolder = async (): Promise<Folder> => {
    const response = await api.get('/folders/trash');
    return response.data;
};

export const getPromptsByFolderId = async (folderId: string): Promise<Prompt[]> => {
    const response = await api.get(`/folders/${folderId}/prompts`);
    return response.data.map((prompt: any) => ({
        ...prompt,
        tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
        isFavorite: !!prompt.is_favorite,
    }));
};

export const getAllPrompts = async (): Promise<Prompt[]> => {
    const response = await api.get('/prompts');
    return response.data.map((prompt: any) => ({
        ...prompt,
        tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
        isFavorite: !!prompt.is_favorite,
    }));
};

export const getTopTags = async (): Promise<string[]> => {
    const response = await api.get('/tags/top');
    return response.data;
};

export const savePrompt = async (promptToSave: Prompt): Promise<Prompt> => {
    const isNew = typeof promptToSave.id === 'string' && promptToSave.id.startsWith('new-');
    const method = isNew ? 'post' : 'put';
    const url = isNew ? '/prompts' : `/prompts/${promptToSave.id}`;
    
    const response = await api[method](url, promptToSave);
    return response.data;
};

export const getPrompt = async (promptId: string): Promise<Prompt | undefined> => {
    const response = await api.get(`/prompts/${promptId}`);
    if (response.data) {
        return {
            ...response.data,
            tags: typeof response.data.tags === 'string' ? JSON.parse(response.data.tags) : response.data.tags,
            isFavorite: !!response.data.is_favorite,
        };
    }
    return undefined;
}

export const createFolder = async (name: string, parentId: string | null): Promise<Folder> => {
    const response = await api.post('/folders', { name, parent_id: parentId });
    return response.data;
};

export const renameFolder = async (folderId: string, newName: string): Promise<Folder> => {
    const response = await api.put(`/folders/${folderId}`, { name: newName });
    return response.data;
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    await api.delete(`/folders/${folderId}`);
};

export const deletePrompt = async (promptId: string): Promise<void> => {
    await api.delete(`/prompts/${promptId}`);
};

export const movePromptToTrash = async (promptId: string): Promise<void> => {
    await api.put(`/prompts/${promptId}/move-to-trash`);
};

export const updatePromptFavoriteStatus = async (promptId: string, isFavorite: boolean): Promise<void> => {
    await api.put(`/prompts/${promptId}/favorite`, { is_favorite: isFavorite });
};

export const moveFolder = async (folderId: string, newParentId: string | null): Promise<Folder> => {
    const response = await api.put(`/folders/${folderId}/move`, { parent_id: newParentId });
    return response.data;
};

export const moveFolderUp = async (folderId: string): Promise<void> => {
    await api.put(`/folders/${folderId}/reorder`, { direction: 'up' });
};

export const moveFolderDown = async (folderId: string): Promise<void> => {
    await api.put(`/folders/${folderId}/reorder`, { direction: 'down' });
};

export { api };