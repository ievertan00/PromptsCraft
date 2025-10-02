import React, { useState, useRef, useEffect } from 'react';
import type { Folder } from '../types';
import { FolderIcon, FolderOpenIcon } from './icons/FolderIcons';
import { KebabMenuIcon } from './icons/KebabMenuIcon';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';

interface FolderTreeProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onRenameFolder: (folderId: string, newName: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveFolder: (folderId: string, newParentId: string | null) => void;
    onMovePrompt: (promptId: string, newFolderId: string) => void;
    newFolderParentId?: string | null;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onCancelNewFolder: () => void;
    onNewFolderRequest: (parentId: string | null) => void;
}

const NewFolderInput: React.FC<{
    parentId: string | null;
    level: number;
    onCreate: (name: string, parentId: string | null) => void;
    onCancel: () => void;
}> = ({ parentId, level, onCreate, onCancel }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (name.trim()) {
                onCreate(name.trim(), parentId);
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        onCancel();
    };

    return (
        <div
            className="flex items-center p-2 rounded-md"
            style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
             <span className="w-6 mr-2"></span>
             <FolderIcon className="w-5 h-5 mr-2 text-gray-400" />
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="bg-gray-700 text-white px-2 py-1 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="New Folder Name"
            />
        </div>
    );
};

const FolderItem: React.FC<{
    folder: Folder;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onRenameFolder: (folderId: string, newName: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onMoveFolder: (folderId: string, newParentId: string | null) => void;
    onMovePrompt: (promptId: string, newFolderId: string) => void;
    level: number;
    newFolderParentId?: string | null;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onCancelNewFolder: () => void;
    onNewFolderRequest: (parentId: string | null) => void;
}> = ({ folder, selectedFolderId, onSelectFolder, onRenameFolder, onDeleteFolder, onMoveFolder, onMovePrompt, level, ...props }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState(folder.name);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isSelected = selectedFolderId === folder.id;

    useEffect(() => {
        if (props.newFolderParentId === folder.id && !isOpen) {
            setIsOpen(true);
        }
    }, [props.newFolderParentId, folder.id, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
     useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };
    
    const handleSelect = () => {
        onSelectFolder(folder.id);
        setIsEditing(false);
    };

    const handleRename = () => {
        if (editingName.trim() && editingName.trim() !== folder.name) {
            onRenameFolder(folder.id, editingName.trim());
        }
        setIsEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') {
            setEditingName(folder.name);
            setIsEditing(false);
        }
    };
    
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/folder-id', folder.id);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        
        const droppedPromptId = e.dataTransfer.getData('application/prompt-id');
        if (droppedPromptId) {
            onMovePrompt(droppedPromptId, folder.id);
            return;
        }

        const droppedFolderId = e.dataTransfer.getData('application/folder-id');
        if (droppedFolderId && droppedFolderId !== folder.id) {
            onMoveFolder(droppedFolderId, folder.id);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };


    return (
        <div>
            <div
                onClick={handleSelect}
                onDoubleClick={() => setIsEditing(true)}
                draggable="true"
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`group flex items-center p-2 rounded-md cursor-pointer transition-colors relative ${
                    isSelected ? 'bg-indigo-600/30 text-white' : 'hover:bg-gray-800 text-theme-secondary'
                } ${isDragOver ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                {folder.children && folder.children.length > 0 ? (
                    <button onClick={handleToggle} className="mr-2 p-1 rounded-full hover:bg-gray-700">
                         {isOpen ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        )}
                    </button>
                ) : <span className="w-6 mr-2"></span>}
                {isOpen ? <FolderOpenIcon className="w-5 h-5 mr-2 text-theme-primary-light shrink-0" /> : <FolderIcon className="w-5 h-5 mr-2 text-theme-secondary shrink-0" />}
                
                {isEditing ? (
                     <input
                        ref={inputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={handleRename}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-700 text-white px-2 py-0.5 rounded-sm text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                ) : (
                    <span className="flex-1 truncate">{folder.name}</span>
                )}
                
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }} 
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-700 ml-2"
                    >
                        <KebabMenuIcon className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div ref={menuRef} className="absolute z-10 right-0 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-md shadow-lg py-1">
                           <a onClick={(e) => { e.stopPropagation(); props.onNewFolderRequest(folder.id); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer"><PlusIcon className="w-4 h-4 flex-shrink-0" /> New Subfolder</a>
                           <a onClick={(e) => { e.stopPropagation(); setIsEditing(true); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer"><EditIcon className="w-4 h-4 flex-shrink-0" /> Rename</a>
                           <a onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this folder and all its contents?')) { onDeleteFolder(folder.id); } setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-gray-600 cursor-pointer"><DeleteIcon className="w-4 h-4 flex-shrink-0" /> Delete</a>
                        </div>
                    )}
                </div>

            </div>
            {isOpen && (
                <div>
                     {folder.children && folder.children.map(child => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onRenameFolder={onRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                            onMoveFolder={onMoveFolder}
                            onMovePrompt={onMovePrompt}
                            level={level + 1}
                            {...props}
                        />
                    ))}
                    {props.newFolderParentId === folder.id && (
                        <NewFolderInput
                            parentId={folder.id}
                            level={level + 1}
                            onCreate={props.onCreateFolder}
                            onCancel={props.onCancelNewFolder}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const FolderTree: React.FC<FolderTreeProps> = ({ folders, ...rest }) => {
    return (
        <div className="space-y-1">
            {folders.map(folder => (
                <FolderItem
                    key={folder.id}
                    folder={folder}
                    level={0}
                    {...rest}
                />
            ))}
            {rest.newFolderParentId === null && (
                <NewFolderInput
                    parentId={null}
                    level={0}
                    onCreate={rest.onCreateFolder}
                    onCancel={rest.onCancelNewFolder}
                />
            )}
        </div>
    );
};

export default FolderTree;