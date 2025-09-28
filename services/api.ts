import { initialFolders, initialPrompts } from '../constants';
import type { Folder, Prompt } from '../types';

const FOLDERS_STORAGE_KEY = 'prompts_craft_folders';
const PROMPTS_STORAGE_KEY = 'prompts_craft_prompts';

// Helper to load data from localStorage or initialize with default data.
const loadFromStorage = <T>(key: string, initialData: T[]): T[] => {
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
        // If parsing fails, remove the corrupted data.
        localStorage.removeItem(key);
    }
    // If nothing in storage or parsing fails, use initial data and save it.
    const data = JSON.parse(JSON.stringify(initialData));
    localStorage.setItem(key, JSON.stringify(data));
    return data;
};

// Make the data stateful to persist changes during the session.
let folders: Folder[] = loadFromStorage<Folder>(FOLDERS_STORAGE_KEY, initialFolders);
let prompts: Prompt[] = loadFromStorage<Prompt>(PROMPTS_STORAGE_KEY, initialPrompts);

const persistFolders = () => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
};

const persistPrompts = () => {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
};


const findDescendantIds = (items: Folder[], parentId: string): string[] => {
    let ids: string[] = [];
    const children = items.filter(item => item.parentId === parentId);
    for (const child of children) {
        ids.push(child.id);
        ids = [...ids, ...findDescendantIds(items, child.id)];
    }
    return ids;
};


// Helper to build the folder tree structure
const buildFolderTree = (items: Folder[], parentId: string | null = null): Folder[] => {
    return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
            ...item,
            children: buildFolderTree(items, item.id),
        }));
};

export const getFolders = async (): Promise<Folder[]> => {
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 50));
    return Promise.resolve(buildFolderTree(folders));
};

export const getPromptsByFolderId = async (folderId: string): Promise<Prompt[]> => {
    const childFolderIds = (items: Folder[], parentId: string): string[] => {
        let ids: string[] = [parentId];
        const children = items.filter(item => item.parentId === parentId);
        for (const child of children) {
            ids = [...ids, ...childFolderIds(items, child.id)];
        }
        return ids;
    };

    const allFolderIds = childFolderIds(folders, folderId);

    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 50));
    return Promise.resolve(
        prompts
            .filter(prompt => allFolderIds.includes(prompt.folderId))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
};

export const getAllPrompts = async (): Promise<Prompt[]> => {
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 50));
    return Promise.resolve(
        [...prompts]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
};

export const savePrompt = async (promptToSave: Prompt): Promise<Prompt> => {
    const index = prompts.findIndex(p => p.id === promptToSave.id);
    if (index > -1) {
        // Update existing prompt
        prompts[index] = promptToSave;
    } else {
        // Add new prompt
        prompts.push(promptToSave);
    }
    persistPrompts();
    
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(promptToSave);
};

export const getPrompt = async (promptId: string): Promise<Prompt | undefined> => {
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 50));
    return Promise.resolve(prompts.find(p => p.id === promptId));
}

export const createFolder = async (name: string, parentId: string | null): Promise<Folder> => {
    const newFolder: Folder = {
        id: `f-${Date.now()}`,
        name,
        parentId,
    };
    folders.push(newFolder);
    persistFolders();
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(newFolder);
};

export const renameFolder = async (folderId: string, newName: string): Promise<Folder> => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
        throw new Error("Folder not found");
    }
    folder.name = newName;
    persistFolders();
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(folder);
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    const descendantIds = findDescendantIds(folders, folderId);
    const allIdsToDelete = [folderId, ...descendantIds];
    
    folders = folders.filter(f => !allIdsToDelete.includes(f.id));
    prompts = prompts.filter(p => !allIdsToDelete.includes(p.folderId));

    persistFolders();
    persistPrompts();

    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve();
};


export const moveFolder = async (folderId: string, newParentId: string | null): Promise<Folder> => {
    const folderToMove = folders.find(f => f.id === folderId);
    if (!folderToMove) {
        throw new Error("Folder not found");
    }
    // Prevent moving a folder into itself or its children
    if (newParentId) {
        const descendantIds = findDescendantIds(folders, folderId);
        if (newParentId === folderId || descendantIds.includes(newParentId)) {
            throw new Error("Cannot move a folder into itself or one of its children.");
        }
    }

    folderToMove.parentId = newParentId;
    persistFolders();
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(folderToMove);
}