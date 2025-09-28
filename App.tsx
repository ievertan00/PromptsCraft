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
    moveFolder
} from './services/api';
import type { Folder, Prompt } from './types';

const App: React.FC = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined);

    const fetchAndSetFolders = async () => {
        const fetchedFolders = await getFolders();
        setFolders(fetchedFolders);
        return fetchedFolders;
    };

    // Fetch folders once on mount
    useEffect(() => {
        fetchAndSetFolders().then(fetchedFolders => {
            if (fetchedFolders.length > 0 && !selectedFolderId) {
                // Select the first folder by default only on initial load
                setSelectedFolderId(fetchedFolders[0].id);
            }
        });
    }, []);

    // Fetch prompts whenever the selected folder changes
    useEffect(() => {
        const fetchAndSetPrompts = async () => {
            if (selectedFolderId) {
                const fetchedPrompts = await getPromptsByFolderId(selectedFolderId);
                setPrompts(fetchedPrompts);
                setSelectedPrompt(fetchedPrompts[0] || null); // Select the first prompt
            } else {
                setPrompts([]);
                setSelectedPrompt(null);
            }
        };
        fetchAndSetPrompts();
    }, [selectedFolderId]);

    const handleSelectFolder = (folderId: string) => {
        setSelectedFolderId(folderId);
        setNewFolderParentId(undefined); // Cancel folder creation on selection change
    };

    const handleSelectPrompt = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
    };

    const handleNewPrompt = () => {
        if (!selectedFolderId) {
            alert("Please select a folder first.");
            return;
        }
        const newPrompt: Prompt = {
            id: `new-${Date.now()}`,
            folderId: selectedFolderId,
            title: 'New Prompt',
            content: '',
            tags: [],
            createdAt: new Date().toISOString(),
        };
        // Add to list and select it
        setPrompts(prev => [newPrompt, ...prev]);
        setSelectedPrompt(newPrompt);
    };

    const handleSavePrompt = async (promptToSave: Prompt) => {
        let promptWithId = { ...promptToSave };
        const isNew = promptWithId.id.startsWith('new-');
        if (isNew) {
            promptWithId.id = `p-${Date.now()}`;
        }
        
        const savedPrompt = await savePrompt(promptWithId);

        if (savedPrompt.folderId !== selectedFolderId) {
            setSelectedFolderId(savedPrompt.folderId);
        } else {
            const updatedPrompts = await getPromptsByFolderId(selectedFolderId!);
            setPrompts(updatedPrompts);
            setSelectedPrompt(updatedPrompts.find(p => p.id === savedPrompt.id) || null);
        }
    };
    
    const handleCreateFolder = async (name: string, parentId: string | null) => {
        await createFolder(name, parentId);
        setNewFolderParentId(undefined); // Hide input field
        await fetchAndSetFolders(); // Refresh folder list
    };
    
    const handleRenameFolder = async (folderId: string, newName: string) => {
        await renameFolder(folderId, newName);
        await fetchAndSetFolders();
    };

    const handleDeleteFolder = async (folderId: string) => {
        await deleteFolder(folderId);
        // If the deleted folder was selected, select its parent or null
        if (selectedFolderId === folderId) {
            const flatFolders = await getFolders(); // get the updated raw list
            const deletedFolder = flatFolders.find(f => f.id === folderId);
            setSelectedFolderId(deletedFolder?.parentId || null);
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


    return (
        <div className="flex h-screen bg-gray-950 text-white font-sans">
            <Sidebar
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={handleSelectFolder}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveFolder={handleMoveFolder}
                newFolderParentId={newFolderParentId}
                onNewFolderRequest={(parentId) => setNewFolderParentId(parentId)}
                onCancelNewFolder={() => setNewFolderParentId(undefined)}
            />
            <PromptList
                prompts={prompts}
                selectedPrompt={selectedPrompt}
                onSelectPrompt={handleSelectPrompt}
                onNewPrompt={handleNewPrompt}
            />
            <PromptEditor
                prompt={selectedPrompt}
                folders={folders} 
                onSave={handleSavePrompt}
            />
        </div>
    );
};

export default App;