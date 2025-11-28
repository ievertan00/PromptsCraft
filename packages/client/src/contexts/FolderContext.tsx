import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Folder } from 'shared/types';
import {
    getFolders,
    getTrashFolder,
    createFolder as apiCreateFolder,
    renameFolder as apiRenameFolder,
    deleteFolder as apiDeleteFolder,
    moveFolder as apiMoveFolder,
    moveFolderUp as apiMoveFolderUp,
    moveFolderDown as apiMoveFolderDown
} from '../services/api';

interface FolderContextType {
    folders: Folder[];
    trashFolder: Folder | null;
    selectedFolderId: string | null;
    setSelectedFolderId: (id: string | null) => void;
    refreshFolders: () => Promise<void>;
    createFolder: (name: string, parentId: string | null) => Promise<void>;
    renameFolder: (id: string, name: string) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    moveFolder: (id: string, newParentId: string | null) => Promise<void>;
    moveFolderUp: (id: string) => Promise<void>;
    moveFolderDown: (id: string) => Promise<void>;
    loading: boolean;
    error: string | null;
    selectedFolderName: string;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [trashFolder, setTrashFolder] = useState<Folder | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getFolderName = (folderId: string | null): string => {
        if (!folderId) return 'All Prompts';
        if (trashFolder && folderId === trashFolder.id) return trashFolder.name;

        const findFolder = (items: Folder[], id: string): Folder | undefined => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findFolder(item.children, id);
                    if (found) return found;
                }
            }
            return undefined;
        };
        
        return findFolder(folders, folderId)?.name || 'Prompts';
    };

    const selectedFolderName = getFolderName(selectedFolderId);

    const refreshFolders = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedFolders, fetchedTrash] = await Promise.all([
                getFolders(),
                getTrashFolder()
            ]);
            setFolders(fetchedFolders);
            setTrashFolder(fetchedTrash);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch folders:", err);
            setError("Failed to load folders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshFolders();
    }, [refreshFolders]);

    const createFolder = async (name: string, parentId: string | null) => {
        try {
            await apiCreateFolder(name, parentId);
            await refreshFolders();
        } catch (err) {
            console.error("Failed to create folder:", err);
            throw err;
        }
    };

    const renameFolder = async (id: string, name: string) => {
        try {
            await apiRenameFolder(id, name);
            await refreshFolders();
        } catch (err) {
            console.error("Failed to rename folder:", err);
            throw err;
        }
    };

    const deleteFolder = async (id: string) => {
        try {
            await apiDeleteFolder(id);
            if (selectedFolderId === id) {
                setSelectedFolderId(null); // Or parent?
            }
            await refreshFolders();
        } catch (err) {
            console.error("Failed to delete folder:", err);
            throw err;
        }
    };

    const moveFolder = async (id: string, newParentId: string | null) => {
        try {
            await apiMoveFolder(id, newParentId);
            await refreshFolders();
        } catch (err) {
            console.error("Failed to move folder:", err);
            throw err;
        }
    };

    const moveFolderUp = async (id: string) => {
        try {
            await apiMoveFolderUp(id);
            await refreshFolders();
        } catch (err) {
            console.error("Failed to move folder up:", err);
            throw err;
        }
    };

    const moveFolderDown = async (id: string) => {
        try {
            await apiMoveFolderDown(id);
            await refreshFolders();
        } catch (err) {
            console.error("Failed to move folder down:", err);
            throw err;
        }
    };

    return (
        <FolderContext.Provider value={{
            folders,
            trashFolder,
            selectedFolderId,
            setSelectedFolderId,
            refreshFolders,
            createFolder,
            renameFolder,
            deleteFolder,
            moveFolder,
            moveFolderUp,
            moveFolderDown,
            loading,
            error,
            selectedFolderName
        }}>
            {children}
        </FolderContext.Provider>
    );
};

export const useFolders = () => {
    const context = useContext(FolderContext);
    if (context === undefined) {
        throw new Error('useFolders must be used within a FolderProvider');
    }
    return context;
};
