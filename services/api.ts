import type { Folder, Prompt } from '../types';

const API_URL = 'http://localhost:3001/api';

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
    const response = await fetch(`${API_URL}/folders`);
    const folders: Folder[] = await response.json();
    return buildFolderTree(folders);
};

export const getPromptsByFolderId = async (folderId: string): Promise<Prompt[]> => {
    const response = await fetch(`${API_URL}/prompts?folderId=${folderId}`);
    const prompts = await response.json();
    return prompts.map((prompt: any) => ({
        ...prompt,
        tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
    }));
};

export const getAllPrompts = async (): Promise<Prompt[]> => {
    const response = await fetch(`${API_URL}/prompts`);
    const prompts = await response.json();
    return prompts.map((prompt: any) => ({
        ...prompt,
        tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
    }));
};

export const savePrompt = async (promptToSave: Prompt): Promise<Prompt> => {
    const isNew = promptToSave.id.startsWith('new-');
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_URL}/prompts` : `${API_URL}/prompts/${promptToSave.id}`;

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptToSave),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save prompt');
    }
    return await response.json();
};

export const getPrompt = async (promptId: string): Promise<Prompt | undefined> => {
    const response = await fetch(`${API_URL}/prompts/${promptId}`);
    const prompt = await response.json();
    if (prompt) {
        return {
            ...prompt,
            tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
        };
    }
    return undefined;
}

export const createFolder = async (name: string, parentId: string | null): Promise<Folder> => {
    const response = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, parent_id: parentId }),
    });
    return await response.json();
};

export const renameFolder = async (folderId: string, newName: string): Promise<Folder> => {
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
    });
    return await response.json();
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'DELETE',
    });
};


export const moveFolder = async (folderId: string, newParentId: string | null): Promise<Folder> => {
    const response = await fetch(`${API_URL}/folders/${folderId}/move`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent_id: newParentId }),
    });
    return await response.json();
}