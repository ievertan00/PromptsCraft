import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PromptList from './components/PromptList';
import PromptEditor from './components/PromptEditor';
import { 
    getFolders, 
    getTrashFolder,
    getPromptsByFolderId, 
    savePrompt, 
    createFolder,
    renameFolder,
    deleteFolder,
    deletePrompt,
    movePromptToTrash,
    moveFolder,
    getPrompt,
    getAllPrompts,
    updatePromptFavoriteStatus,
    moveFolderUp,
    moveFolderDown
} from './services/api';
import type { Folder, Prompt } from './types';
import { SupportedModel } from './services/aiService';

import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [trashFolder, setTrashFolder] = useState<Folder | null>(null);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined);
    const [selectedModel, setSelectedModel] = useState<SupportedModel>('gemini');

    const [isDragging, setIsDragging] = useState(false);

    const fetchAndSetFolders = async () => {
        const fetchedFolders = await getFolders();
        setFolders(fetchedFolders);
        return fetchedFolders;
    };
    
    const fetchAndSetPrompts = async (folderId: string) => {
        const fetchedPrompts = await getPromptsByFolderId(folderId);
        setPrompts(fetchedPrompts);
    };

    // Fetch folders once on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchAndSetFolders();
            const fetchTrash = async () => {
                const trash = await getTrashFolder();
                setTrashFolder(trash);
            };
            fetchTrash();
        }
    }, [isAuthenticated]);

    // Fetch prompts whenever the selected folder changes
    useEffect(() => {
        if (isAuthenticated && selectedFolderId) {
            fetchAndSetPrompts(selectedFolderId);
        } else if (isAuthenticated && selectedFolderId === null) {
            const fetchAll = async () => {
                const allPrompts = await getAllPrompts();
                setPrompts(allPrompts);
            };
            fetchAll();
        }
    }, [selectedFolderId, isAuthenticated]);

    const handleSelectFolder = (folderId: string | null) => {
        setSelectedFolderId(folderId);
        setNewFolderParentId(undefined);
    };

    const handleEditPrompt = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setIsEditorOpen(true);
    };

    const handleNewPrompt = () => {
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
            createdAt: new Date().toISOString(),
        };
        setEditingPrompt(newPrompt);
        setIsEditorOpen(true);
    };

    const handleSavePrompt = async (promptToSave: Prompt) => {
        try {
            const savedPrompt = await savePrompt(promptToSave);
            setIsEditorOpen(false);
            setEditingPrompt(null);
            
            const promptIsInCurrentView = selectedFolderId === savedPrompt.folder_id;

            if (promptIsInCurrentView) {
                await fetchAndSetPrompts(selectedFolderId!);
            } else if (selectedFolderId === null) {
                const allPrompts = await getAllPrompts();
                setPrompts(allPrompts);
            } else {
                setSelectedFolderId(savedPrompt.folder_id);
            }
        } catch (error) {
            console.error("Failed to save prompt:", error);
            alert("Failed to save prompt. See console for details.");
        }
    };

    const handleDeletePrompt = async (promptId: string) => {
        console.log(`Attempting to delete prompt with ID: ${promptId}`);
        try {
            await deletePrompt(promptId);
            if (selectedFolderId) {
                fetchAndSetPrompts(selectedFolderId);
            } else {
                const allPrompts = await getAllPrompts();
                setPrompts(allPrompts);
            }
        } catch (error) {
            console.error("Failed to delete prompt:", error);
            alert("Failed to delete prompt. See console for details.");
        }
    };

    const handleMoveToTrash = async (promptId: string) => {
        try {
            await movePromptToTrash(promptId);
            if (selectedFolderId) {
                fetchAndSetPrompts(selectedFolderId);
            } else {
                const allPrompts = await getAllPrompts();
                setPrompts(allPrompts);
            }
        } catch (error) {
            console.error("Failed to move prompt to trash:", error);
            alert("Failed to move prompt to trash. See console for details.");
        }
    };

    const handleDeletePermanently = async (promptId: string) => {
        try {
            await deletePrompt(promptId);
            if (selectedFolderId) {
                fetchAndSetPrompts(selectedFolderId);
            } else {
                const allPrompts = await getAllPrompts();
                setPrompts(allPrompts);
            }
        } catch (error) {
            console.error("Failed to delete prompt permanently:", error);
            alert("Failed to delete prompt permanently. See console for details.");
        }
    };

    const handleToggleFavorite = async (promptId: string) => {
        const originalPrompts = [...prompts];
        try {
            const prompt = prompts.find(p => p.id === promptId);
            if (prompt) {
                const updatedPrompts = prompts.map(p => 
                    p.id === promptId ? { ...p, isFavorite: !p.isFavorite } : p
                );
                setPrompts(updatedPrompts);
                await updatePromptFavoriteStatus(promptId, !prompt.isFavorite);
            }
        } catch (error) {
            console.error("Failed to toggle favorite status:", error);
            alert("Failed to toggle favorite status. See console for details.");
            setPrompts(originalPrompts);
        }
    };
    
    const handleCreateFolder = async (name: string, parentId: string | null) => {
        try {
            await createFolder(name, parentId);
            setNewFolderParentId(undefined);
            await fetchAndSetFolders();
        } catch (error) {
            console.error("Failed to create folder:", error);
            alert("Failed to create folder. See console for details.");
        }
    };
    
    const handleRenameFolder = async (folderId: string, newName: string) => {
        try {
            await renameFolder(folderId, newName);
            await fetchAndSetFolders();
        } catch (error) {
            console.error("Failed to rename folder:", error);
            alert("Failed to rename folder. See console for details.");
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (isDragging) {
            console.warn("Folder deletion was blocked during a drag operation.");
            return;
        }
        try {
            const folderToDelete = folders.find(f => f.id === folderId);
            await deleteFolder(folderId);
            if (selectedFolderId === folderId) {
                setSelectedFolderId(folderToDelete?.parent_id || null);
            }
            await fetchAndSetFolders();
        } catch (error) {
            console.error("Failed to delete folder:", error);
            alert("Failed to delete folder. See console for details.");
        }
    };
    
    const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
        try {
            await moveFolder(folderId, newParentId);
            await fetchAndSetFolders();
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        }
    };

    const handleMoveUp = async (folderId: string) => {
        try {
            await moveFolderUp(folderId);
            await fetchAndSetFolders();
        } catch (error) {
            console.error("Failed to move folder up:", error);
            alert("Failed to move folder up. See console for details.");
        }
    };

    const handleMoveDown = async (folderId: string) => {
        try {
            await moveFolderDown(folderId);
            await fetchAndSetFolders();
        } catch (error) {
            console.error("Failed to move folder down:", error);
            alert("Failed to move folder down. See console for details.");
        }
    };

    const handleMovePrompt = async (promptId: string, newFolderId: string) => {
        try {
            const promptToMove = await getPrompt(promptId);
            if (promptToMove && promptToMove.folder_id !== newFolderId) {
                const updatedPrompt = { ...promptToMove, folder_id: newFolderId };
                await savePrompt(updatedPrompt);
                // Remove from current list visually for immediate feedback
                setPrompts(prev => prev.filter(p => p.id !== promptId));
            }
        } catch (error) {
            console.error("Failed to move prompt:", error);
            alert("Failed to move prompt. See console for details.");
        }
    };

    const getFolderName = (folderId: string | null): string => {
        if (!folderId) return 'All Prompts';

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

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <ThemeProvider>
            <div className="flex flex-col h-screen font-sans bg-theme-default text-theme-default">
                <header className="flex justify-end items-center p-4 bg-theme-secondary border-b border-theme-default">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-md font-medium transition-colors"
                    >
                        <span>Logout</span>
                    </button>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-96 flex-shrink-0">
                        <Sidebar
                            folders={folders}
                            trashFolder={trashFolder}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={handleSelectFolder}
                            onCreateFolder={handleCreateFolder}
                            onRenameFolder={handleRenameFolder}
                            onDeleteFolder={handleDeleteFolder}
                            onMoveFolder={handleMoveFolder}
                            onMovePrompt={handleMovePrompt}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            newFolderParentId={newFolderParentId}
                            onNewFolderRequest={(parentId) => setNewFolderParentId(parentId)}
                            onCancelNewFolder={() => setNewFolderParentId(undefined)}
                            onNewPrompt={handleNewPrompt}
                            selectedModel={selectedModel}
                            onSelectedModelChange={setSelectedModel}
                            isDragging={isDragging}
                            setIsDragging={setIsDragging}
                        />
                    </div>
                    <main className="flex-1 overflow-y-auto">
                        <ErrorBoundary>
                            <PromptList
                                prompts={prompts}
                                onEditPrompt={handleEditPrompt}
                                onMoveToTrash={handleMoveToTrash}
                                onDeletePermanently={handleDeletePermanently}
                                onToggleFavorite={handleToggleFavorite}
                                selectedFolderName={getFolderName(selectedFolderId)}
                                folders={folders}
                                onMovePrompt={handleMovePrompt}
                                isDragging={isDragging}
                                setIsDragging={setIsDragging}
                            />
                        </ErrorBoundary>
                    </main>
                    
                    {isEditorOpen && editingPrompt && (
                        <ErrorBoundary>
                            <PromptEditor
                                prompt={editingPrompt}
                                folders={folders} 
                                onSave={handleSavePrompt}
                                onClose={() => setIsEditorOpen(false)}
                                selectedModel={selectedModel}
                            />
                        </ErrorBoundary>
                    )}
                </div>
            </div>
        </ThemeProvider>
    );
};

export default App;