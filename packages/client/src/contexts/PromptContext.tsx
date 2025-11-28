import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Prompt } from 'shared/types';
import {
    getPromptsByFolderId,
    getAllPrompts,
    savePrompt as apiSavePrompt,
    deletePrompt as apiDeletePrompt,
    movePromptToTrash as apiMovePromptToTrash,
    updatePromptFavoriteStatus as apiUpdatePromptFavoriteStatus
} from '../services/api';
import { useFolders } from './FolderContext';

interface PromptContextType {
    prompts: Prompt[];
    editingPrompt: Prompt | null;
    isEditorOpen: boolean;
    setEditingPrompt: (prompt: Prompt | null) => void;
    setIsEditorOpen: (isOpen: boolean) => void;
    refreshPrompts: () => Promise<void>;
    savePrompt: (prompt: Prompt) => Promise<void>;
    deletePrompt: (id: string) => Promise<void>;
    movePromptToTrash: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    movePrompt: (id: string, newFolderId: string) => Promise<void>;
    createNewPrompt: () => void;
    loading: boolean;
    error: string | null;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { selectedFolderId, folders } = useFolders();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshPrompts = useCallback(async () => {
        setLoading(true);
        try {
            let fetchedPrompts;
            if (selectedFolderId) {
                fetchedPrompts = await getPromptsByFolderId(selectedFolderId);
            } else {
                fetchedPrompts = await getAllPrompts();
            }
            setPrompts(fetchedPrompts);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch prompts:", err);
            setError("Failed to load prompts.");
        } finally {
            setLoading(false);
        }
    }, [selectedFolderId]);

    useEffect(() => {
        refreshPrompts();
    }, [refreshPrompts]);

    const savePrompt = async (prompt: Prompt) => {
        try {
            await apiSavePrompt(prompt);
            setIsEditorOpen(false);
            setEditingPrompt(null);
            await refreshPrompts();
        } catch (err) {
            console.error("Failed to save prompt:", err);
            throw err;
        }
    };

    const deletePrompt = async (id: string) => {
        try {
            await apiDeletePrompt(id);
            await refreshPrompts();
        } catch (err) {
            console.error("Failed to delete prompt:", err);
            throw err;
        }
    };

    const movePromptToTrash = async (id: string) => {
        try {
            await apiMovePromptToTrash(id);
            await refreshPrompts();
        } catch (err) {
            console.error("Failed to move prompt to trash:", err);
            throw err;
        }
    };

    const movePrompt = async (id: string, newFolderId: string) => {
        try {
            const prompt = await apiGetPrompt(id);
            if (prompt) {
                await apiSavePrompt({ ...prompt, folder_id: newFolderId });
                await refreshPrompts();
            }
        } catch (err) {
            console.error("Failed to move prompt:", err);
            throw err;
        }
    };

    const toggleFavorite = async (id: string) => {
        try {
            const prompt = prompts.find(p => p.id === id);
            if (prompt) {
                await apiUpdatePromptFavoriteStatus(id, !prompt.is_favorite);
                await refreshPrompts();
            }
        } catch (err) {
            console.error("Failed to toggle favorite:", err);
            throw err;
        }
    };

    const createNewPrompt = () => {
        const defaultFolderId = selectedFolderId || (folders.length > 0 ? folders[0].id : null);
        if (!defaultFolderId) {
            alert("Please create a folder first to create a new prompt in.");
            return;
        }
        const newPrompt: Prompt = {
            id: `new-${Date.now()}`,
            folder_id: defaultFolderId,
            title: '',
            prompt: '',
            tags: [],
            is_favorite: false,
            user_id: 0,
        };
        setEditingPrompt(newPrompt);
        setIsEditorOpen(true);
    };

    return (
        <PromptContext.Provider value={{
            prompts,
            editingPrompt,
            isEditorOpen,
            setEditingPrompt,
            setIsEditorOpen,
            refreshPrompts,
            savePrompt,
            deletePrompt,
            movePromptToTrash,
            movePrompt,
            toggleFavorite,
            createNewPrompt,
            loading,
            error
        }}>
            {children}
        </PromptContext.Provider>
    );
};

export const usePrompts = () => {
    const context = useContext(PromptContext);
    if (context === undefined) {
        throw new Error('usePrompts must be used within a PromptProvider');
    }
    return context;
};
