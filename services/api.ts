import { initialFolders, initialPrompts } from '../constants';
import type { Folder, Prompt } from '../types';

// Make the data stateful to persist changes during the session.
let folders: Folder[] = JSON.parse(JSON.stringify(initialFolders));
let prompts: Prompt[] = JSON.parse(JSON.stringify(initialPrompts));

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
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(folder);
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    const descendantIds = findDescendantIds(folders, folderId);
    const allIdsToDelete = [folderId, ...descendantIds];
    
    folders = folders.filter(f => !allIdsToDelete.includes(f.id));
    prompts = prompts.filter(p => !allIdsToDelete.includes(p.folderId));

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
    // Simulate async call
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve(folderToMove);
}