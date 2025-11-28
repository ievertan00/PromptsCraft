import React, { useState } from 'react';
import Sidebar from './Sidebar';
import PromptList from './PromptList';
import PromptEditor from './PromptEditor';
import { usePrompts } from '../contexts/PromptContext';
import { useFolders } from '../contexts/FolderContext';
import { SupportedModel } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { logout } = useAuth();
    const { isEditorOpen, createNewPrompt, movePrompt } = usePrompts();
    // We don't need createFolder here, it's used in Sidebar via context?
    // No, Sidebar uses FolderTree which uses useFolders.
    // Sidebar passes onNewFolderRequest to FolderTree.
    // FolderTree uses createFolder from context.
    // So Dashboard doesn't need createFolder.
    
    // UI State that is local to Dashboard
    const [selectedModel, setSelectedModel] = useState<SupportedModel>('gemini');
    const [isDragging, setIsDragging] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined);

    const handleNewFolderRequest = (parentId: string | null) => {
        setNewFolderParentId(parentId);
    };

    const handleCancelNewFolder = () => {
        setNewFolderParentId(undefined);
    };

    return (
        <div className="flex h-screen bg-theme-default text-theme-default overflow-hidden">
            <div className="w-64 flex-shrink-0 h-full">
                <Sidebar
                    onMovePrompt={movePrompt}
                    newFolderParentId={newFolderParentId}
                    onNewFolderRequest={handleNewFolderRequest}
                    onCancelNewFolder={handleCancelNewFolder}
                    onNewPrompt={createNewPrompt}
                    selectedModel={selectedModel}
                    onSelectedModelChange={setSelectedModel}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    onLogout={logout}
                />
            </div>
            <div className="flex-1 h-full overflow-y-auto">
                <PromptList
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                />
            </div>
            {isEditorOpen && (
                <PromptEditor
                    selectedModel={selectedModel}
                />
            )}
        </div>
    );
};

export default Dashboard;
