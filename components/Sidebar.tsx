import React from 'react';
import type { Folder } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import FolderTree from './FolderTree';
import ApiKeyManager from './ApiKeyManager';
import { PlusIcon } from './icons/PlusIcon';

interface SidebarProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string) => void;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onRenameFolder: (folderId: string, newName: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveFolder: (folderId: string, newParentId: string | null) => void;
    newFolderParentId: string | null | undefined;
    onNewFolderRequest: (parentId: string | null) => void;
    onCancelNewFolder: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    folders, 
    selectedFolderId, 
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onMoveFolder,
    newFolderParentId,
    onNewFolderRequest,
    onCancelNewFolder
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
            className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col"
            onDrop={handleDropOnRoot}
            onDragOver={handleDragOver}
        >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LogoIcon className="w-8 h-8 text-indigo-500" />
                    <h1 className="text-xl font-bold">PromptBase</h1>
                </div>
                 <button 
                    onClick={() => onNewFolderRequest(selectedFolderId ?? null)}
                    className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                    title="New Folder"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                <FolderTree
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onRenameFolder={onRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                    onMoveFolder={onMoveFolder}
                    newFolderParentId={newFolderParentId}
                    onCreateFolder={onCreateFolder}
                    onCancelNewFolder={onCancelNewFolder}
                />
            </div>
            <div className="p-4 border-t border-gray-800">
                <ApiKeyManager />
            </div>
        </div>
    );
};

export default Sidebar;