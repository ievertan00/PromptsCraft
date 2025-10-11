import React, { useState } from 'react';
import type { Folder } from '../types';
import { FolderIcon, FolderOpenIcon } from './icons/FolderIcons';
import { XIcon } from './icons/XIcon';

interface FolderSelectModalProps {
    folders: Folder[];
    onSelect: (folderId: string) => void;
    onClose: () => void;
    currentFolderId: string | null;
}

interface FolderSelectTreeItemProps {
    folder: Folder;
    onSelect: (folderId: string) => void;
    level: number;
    currentFolderId: string | null;
}

const FolderSelectTreeItem: React.FC<FolderSelectTreeItemProps> = ({ folder, onSelect, level, currentFolderId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isCurrentFolder = folder.id === currentFolderId;

    return (
        <div>
            <div
                className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-theme-hover transition-colors ${
                    isCurrentFolder ? 'bg-theme-primary/30 text-theme-default' : 'text-theme-secondary'
                }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(folder.id)}
            >
                {folder.children && folder.children.length > 0 ? (
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="mr-2 p-1 rounded-full hover:bg-theme-tertiary">
                        {isOpen ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        )}
                    </button>
                ) : <span className="w-6 mr-2"></span>}
                {isOpen ? <FolderOpenIcon className="w-5 h-5 mr-2 text-theme-primary-light" /> : <FolderIcon className="w-5 h-5 mr-2 text-theme-secondary" />}
                <span className="flex-1 truncate">{folder.name}</span>
            </div>
            {isOpen && folder.children && (
                <div className="pl-4">
                    {folder.children.map(child => (
                        <FolderSelectTreeItem
                            key={child.id}
                            folder={child}
                            onSelect={onSelect}
                            level={level + 1}
                            currentFolderId={currentFolderId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FolderSelectModal: React.FC<FolderSelectModalProps> = ({ folders, onSelect, onClose, currentFolderId }) => {
    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-md h-[60vh] flex flex-col relative border border-theme-default"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-theme-default">
                    <h3 className="text-lg font-semibold text-theme-default">Move Prompt To Folder</h3>
                    <button onClick={onClose} className="p-2 text-theme-secondary rounded-full hover:bg-theme-tertiary hover:text-theme-default">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-1">
                        <div
                            className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-theme-hover transition-colors ${
                                currentFolderId === null ? 'bg-theme-primary/30 text-theme-default' : 'text-theme-secondary'
                            }`}
                            onClick={() => onSelect(null)} // Option to move to root
                        >
                            <FolderIcon className="w-5 h-5 mr-2 text-theme-secondary" />
                            <span className="flex-1 truncate">Root Folder</span>
                        </div>
                        {folders.map(folder => (
                            <FolderSelectTreeItem
                                key={folder.id}
                                folder={folder}
                                onSelect={onSelect}
                                level={0}
                                currentFolderId={currentFolderId}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FolderSelectModal;
