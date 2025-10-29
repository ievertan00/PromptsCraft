import React from 'react';
import type { Folder } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import FolderTree from './FolderTree';
import { PlusIcon } from './icons/PlusIcon';
import { BrainIcon } from './icons/BrainIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import ThemeSelector from './ThemeSelector';
import { useAuth } from '../contexts/AuthContext';
import type { SupportedModel } from '../services/aiService';

interface SidebarProps {
    folders: Folder[];
    trashFolder: Folder | null;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onRenameFolder: (folderId: string, newName: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveFolder: (folderId: string, newParentId: string | null) => void;
    onMovePrompt: (promptId: string, newFolderId: string) => void;
    onMoveUp: (folderId: string) => void;
    onMoveDown: (folderId: string) => void;
    newFolderParentId: string | null | undefined;
    onNewFolderRequest: (parentId: string | null) => void;
    onCancelNewFolder: () => void;
    onNewPrompt: () => void;
    selectedModel: SupportedModel;
    onSelectedModelChange: (model: SupportedModel) => void;
    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    folders, 
    trashFolder,
    selectedFolderId, 
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onMoveFolder,
    onMovePrompt,
    onMoveUp,
    onMoveDown,
    newFolderParentId,
    onNewFolderRequest,
    onCancelNewFolder,
    onNewPrompt,
    selectedModel,
    onSelectedModelChange,
    isDragging,
    setIsDragging
}) => {
    const { logout } = useAuth();

    const handleDropOnRoot = (e: React.DragEvent) => {
        e.preventDefault();
        const folderId = e.dataTransfer.getData('application/folder-id');
        if (folderId) {
            onMoveFolder(folderId, null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div 
            className="w-full h-full bg-theme-secondary border-r border-theme-default flex flex-col"
            onDrop={handleDropOnRoot}
            onDragOver={handleDragOver}
        >
            <div className="p-4 border-b border-theme-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LogoIcon className="w-8 h-8 text-theme-primary-light flex-shrink-0" />
                    <h1 className="text-xl font-bold text-theme-default">PromptsCraft</h1>
                </div>
            </div>
            <div className="p-4 border-b border-theme-default">
                <button
                    onClick={onNewPrompt}
                    className="w-full px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    New Prompt
                </button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                 <div className="px-2 space-y-4">
                    <button
                        onClick={() => onSelectFolder(null)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left text-sm font-medium transition-colors ${
                            selectedFolderId === null 
                            ? 'bg-theme-primary/30 text-theme-default' 
                            : 'text-theme-secondary hover:bg-theme-tertiary'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="truncate">All Prompts</span>
                    </button>
                    
                    <div>
                        <div className="pb-2 flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">Folders</h2>
                            <button 
                                onClick={() => onNewFolderRequest(null)}
                                className="p-1 rounded-md hover:bg-theme-tertiary transition-colors"
                                title="New Folder"
                            >
                                <PlusIcon className="w-4 h-4 flex-shrink-0" />
                            </button>
                        </div>
                        <FolderTree
                            folders={folders}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onRenameFolder={onRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                            onMoveFolder={onMoveFolder}
                            onMovePrompt={onMovePrompt}
                            onMoveUp={onMoveUp}
                            onMoveDown={onMoveDown}
                            newFolderParentId={newFolderParentId}
                            onCreateFolder={onCreateFolder}
                            onCancelNewFolder={onCancelNewFolder}
                            onNewFolderRequest={onNewFolderRequest}
                            isDragging={isDragging}
                            setIsDragging={setIsDragging}
                        />
                    </div>
                </div>
            </div>
            <div className="p-4 border-b border-theme-default">
                {trashFolder && (
                    <button
                        onClick={() => onSelectFolder(trashFolder.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left text-sm font-medium transition-colors ${
                            selectedFolderId === trashFolder.id
                                ? 'bg-theme-primary/30 text-theme-default'
                                : 'text-theme-secondary hover:bg-theme-tertiary'
                        }`}
                    >
                        <DeleteIcon className="w-5 h-5 shrink-0" />
                        <span className="truncate">{trashFolder.name}</span>
                    </button>
                )}
            </div>
            <div className="p-4 border-t border-theme-default">
                <div className="flex items-center gap-2 mb-2">
                    <BrainIcon className="w-5 h-5 text-theme-secondary flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-theme-secondary">AI Model Selection</h4>
                </div>
                <select
                    id="ai-model-select"
                    value={selectedModel}
                    onChange={(e) => onSelectedModelChange(e.target.value as SupportedModel)}
                    className="bg-theme-tertiary text-theme-default rounded-md px-2 py-1 text-sm w-full"
                >
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">Deepseek</option>
                </select>
            </div>
            <div className="p-4 border-t border-theme-default mb-4">
                <ThemeSelector />
            </div>
        </div>
    );
};

export default Sidebar;