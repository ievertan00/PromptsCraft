import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PromptList from './components/PromptList';
import PromptEditor from './components/PromptEditor';
import { 
    getFolders, 
    getPromptsByFolderId, 
    savePrompt, 
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    getPrompt,
    getAllPrompts
} from './services/api';
import type { Folder, Prompt } from './types';

const App: React.FC = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined);

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
        fetchAndSetFolders();
    }, []);

    // Fetch prompts whenever the selected folder changes
    useEffect(() => {
        if (selectedFolderId) {
            fetchAndSetPrompts(selectedFolderId);
        } else {
            const fetchAll = async () => {
                const allPrompts = await getAllPrompts();
                setPrompts(allPrompts);
            };
            fetchAll();
        }
    }, [selectedFolderId]);

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
            folderId: defaultFolderId,
            title: '',
            content: '',
            tags: [],
            createdAt: new Date().toISOString(),
        };
        setEditingPrompt(newPrompt);
        setIsEditorOpen(true);
    };

    const handleSavePrompt = async (promptToSave: Prompt) => {
        let promptWithId = { ...promptToSave };
        const isNew = promptWithId.id.startsWith('new-');
        if (isNew) {
            promptWithId.id = `p-${Date.now()}`;
        }
        
        await savePrompt(promptWithId);
        setIsEditorOpen(false);
        setEditingPrompt(null);
        
        // Simplified and corrected refresh logic.
        // After a save, we always need to refresh the data.
        // Check if the prompt's folder is the one we are currently viewing.
        const promptIsInCurrentView = selectedFolderId === promptWithId.folderId;

        if (promptIsInCurrentView) {
            // If we are viewing the folder the prompt was saved to, just refresh the prompts for that folder.
            await fetchAndSetPrompts(selectedFolderId!);
        } else if (selectedFolderId === null) {
            // If we are in "All Prompts" view, a save of any prompt requires a refresh of all prompts.
            const allPrompts = await getAllPrompts();
            setPrompts(allPrompts);
        } else {
            // If the prompt was saved to a different folder, navigate to that folder.
            // The useEffect hook for selectedFolderId will then trigger a fetch of the prompts.
            setSelectedFolderId(promptWithId.folderId);
        }
    };
    
    const handleCreateFolder = async (name: string, parentId: string | null) => {
        await createFolder(name, parentId);
        setNewFolderParentId(undefined);
        await fetchAndSetFolders();
    };
    
    const handleRenameFolder = async (folderId: string, newName: string) => {
        await renameFolder(folderId, newName);
        await fetchAndSetFolders();
    };

    const handleDeleteFolder = async (folderId: string) => {
        const folderToDelete = folders.find(f => f.id === folderId);
        await deleteFolder(folderId);
        if (selectedFolderId === folderId) {
            setSelectedFolderId(folderToDelete?.parentId || null);
        }
        await fetchAndSetFolders();
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

    const handleMovePrompt = async (promptId: string, newFolderId: string) => {
        const promptToMove = await getPrompt(promptId);
        if (promptToMove && promptToMove.folderId !== newFolderId) {
            const updatedPrompt = { ...promptToMove, folderId: newFolderId };
            await savePrompt(updatedPrompt);
            // Remove from current list visually for immediate feedback
            setPrompts(prev => prev.filter(p => p.id !== promptId));
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

    return (
        <div className="flex h-screen bg-gray-950 text-white font-sans">
            <div className="w-96 flex-shrink-0">
                <Sidebar
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={handleSelectFolder}
                    onCreateFolder={handleCreateFolder}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onMoveFolder={handleMoveFolder}
                    onMovePrompt={handleMovePrompt}
                    newFolderParentId={newFolderParentId}
                    onNewFolderRequest={(parentId) => setNewFolderParentId(parentId)}
                    onCancelNewFolder={() => setNewFolderParentId(undefined)}
                    onNewPrompt={handleNewPrompt}
                />
            </div>
            <main className="flex-1 overflow-y-auto">
                 <PromptList
                    prompts={prompts}
                    onEditPrompt={handleEditPrompt}
                    selectedFolderName={getFolderName(selectedFolderId)}
                />
            </main>
            
            {isEditorOpen && editingPrompt && (
                <PromptEditor
                    prompt={editingPrompt}
                    folders={folders} 
                    onSave={handleSavePrompt}
                    onClose={() => setIsEditorOpen(false)}
                />
            )}
        </div>
    );
};

export default App;