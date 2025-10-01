import React from 'react';
import type { Folder } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import FolderTree from './FolderTree';
import { PlusIcon } from './icons/PlusIcon';
import Settings from './Settings';
import ThemeSelector from './ThemeSelector';

interface SidebarProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onRenameFolder: (folderId: string, newName: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveFolder: (folderId: string, newParentId: string | null) => void;
    onMovePrompt: (promptId: string, newFolderId: string) => void;
    newFolderParentId: string | null | undefined;
    onNewFolderRequest: (parentId: string | null) => void;
    onCancelNewFolder: () => void;
    onNewPrompt: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    folders, 
    selectedFolderId, 
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onMoveFolder,
    onMovePrompt,
    newFolderParentId,
    onNewFolderRequest,
    onCancelNewFolder,
    onNewPrompt
}) => {

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

    return (
        <div 
            className="w-full h-full bg-theme-secondary border-r border-theme-default flex flex-col"
            onDrop={handleDropOnRoot}
            onDragOver={handleDragOver}
        >
            <div className="p-4 border-b border-theme-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LogoIcon className="w-8 h-8 text-theme-primary-light" />
                    <h1 className="text-xl font-bold text-theme-default">PromptsCraft</h1>
                </div>
            </div>
            <div className="p-4 border-b border-theme-default">
                <button
                    onClick={onNewPrompt}
                    className="w-full px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-md font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                                <PlusIcon className="w-4 h-4" />
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
                            newFolderParentId={newFolderParentId}
                            onCreateFolder={onCreateFolder}
                            onCancelNewFolder={onCancelNewFolder}
                            onNewFolderRequest={onNewFolderRequest}
                        />
                    </div>
                </div>
            </div>
            <Settings />
            <ThemeSelector />
        </div>
    );
};

export default Sidebar;