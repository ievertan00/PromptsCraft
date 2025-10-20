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

export const getTrashFolder = async (): Promise<Folder> => {
    const response = await fetch(`${API_URL}/trash-folder`);
    return await response.json();
};

export const getPromptsByFolderId = async (folderId: string): Promise<Prompt[]> => {
    const response = await fetch(`${API_URL}/folders/${folderId}/prompts`);
    const prompts = await response.json();
    return prompts.map((prompt: any) => ({
        ...prompt,
        tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
        isFavorite: !!prompt.is_favorite,
    }));
};

export const getAllPrompts = async (): Promise<Prompt[]> => {
    const response = await fetch(`${API_URL}/prompts`);
    const prompts = await response.json();
    return prompts.map((prompt: any) => ({
        ...prompt,
        tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
        isFavorite: !!prompt.is_favorite,
    }));
};

export const getTopTags = async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/tags/top`);
    if (!response.ok) {
        throw new Error('Failed to fetch top tags');
    }
    return await response.json();
};

export const savePrompt = async (promptToSave: Prompt): Promise<Prompt> => {
    const isNew = typeof promptToSave.id === 'string' && promptToSave.id.startsWith('new-');
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
            isFavorite: !!prompt.is_favorite,
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

export const deletePrompt = async (promptId: string): Promise<void> => {
    await fetch(`${API_URL}/prompts/${promptId}`, {
        method: 'DELETE',
    });
};

export const movePromptToTrash = async (promptId: string): Promise<void> => {
    await fetch(`${API_URL}/prompts/${promptId}/move-to-trash`, {
        method: 'PUT',
    });
};

export const updatePromptFavoriteStatus = async (promptId: string, isFavorite: boolean): Promise<void> => {
    await fetch(`${API_URL}/prompts/${promptId}/favorite`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_favorite: isFavorite }),
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
};

export const moveFolderUp = async (folderId: string): Promise<void> => {
    await fetch(`${API_URL}/folders/${folderId}/reorder`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: 'up' }),
    });
};

export const moveFolderDown = async (folderId: string): Promise<void> => {
    await fetch(`${API_URL}/folders/${folderId}/reorder`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: 'down' }),
    });
};