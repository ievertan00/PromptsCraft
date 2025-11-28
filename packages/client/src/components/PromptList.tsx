import React, { useState, useMemo, useEffect } from 'react';
import type { Prompt, Folder } from 'shared/types';
import { getTopTags } from '../services/api';
import { KebabMenuIcon } from './icons/KebabMenuIcon';
import { getTagColorClasses } from '../constants/colors';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { StarIcon } from './icons/StarIcon';
import { StarFilledIcon } from './icons/StarFilledIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import FolderSelectModal from './FolderSelectModal';
import DeletePromptConfirmModal from './DeletePromptConfirmModal';
import { usePrompts } from '../contexts/PromptContext';
import { useFolders } from '../contexts/FolderContext';

interface PromptListProps {
    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;
}

const PromptCard: React.FC<{
    prompt: Prompt;
    onDoubleClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onMoveToTrash: () => void;
    onDeletePermanently: () => void;
    onToggleFavorite: () => void;
    onMove: (promptId: string, newFolderId: string) => void;
    folders: Folder[];
}> = ({ prompt, onDoubleClick, onDragStart, onDragEnd, onMoveToTrash, onDeletePermanently, onToggleFavorite, onMove, folders }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleMoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setIsMoveModalOpen(true);
    };

    const handleFolderSelect = (newFolderId: string) => {
        onMove(prompt.id, newFolderId);
        setIsMoveModalOpen(false);
    };

    return (
        <div
            onDoubleClick={onDoubleClick}
            draggable="true"
            onDragStart={(e) => {
                onDragStart(e);
                (e.target as HTMLElement).closest('.prompt-card-container')?.classList.add('dragging');
            }}
            onDragEnd={() => {
                onDragEnd();
                document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
            }}
            className="group bg-theme-secondary border border-theme-default rounded-lg p-4 flex flex-col gap-3 cursor-pointer hover:border-theme-primary-light transition-colors h-[165px] relative prompt-card-container"
        >
            <div className="absolute top-2 right-2 flex items-center" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="p-1 rounded-full bg-theme-secondary opacity-0 group-hover:opacity-100 hover:bg-theme-hover focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-theme-primary-light transition-opacity">
                    {prompt.is_favorite ? <StarFilledIcon className="w-5 h-5 text-yellow-400" /> : <StarIcon className="w-5 h-5 text-theme-secondary" />}
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-1 rounded-full bg-theme-secondary opacity-0 group-hover:opacity-100 hover:bg-theme-hover focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-theme-primary-light transition-opacity"
                    aria-label="Prompt options"
                >
                    <KebabMenuIcon className="w-5 h-5 text-theme-secondary" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-8 w-48 bg-theme-secondary rounded-md shadow-lg z-10">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDoubleClick();
                                setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-theme-default hover:bg-theme-hover flex items-center"
                        >
                            <EditIcon className="w-4 h-4 mr-2" />
                            Edit
                        </button>
                        <button 
                            onClick={handleMoveClick}
                            className="w-full text-left px-4 py-2 text-sm text-theme-default hover:bg-theme-hover flex items-center"
                        >
                            <BriefcaseIcon className="w-4 h-4 mr-2" />
                            Move
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsConfirmOpen(true);
                                setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-theme-hover flex items-center"
                        >
                            <DeleteIcon className="w-4 h-4 mr-2" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
            <h3 className="font-semibold text-theme-default truncate">{prompt.title}</h3>
            <p className="text-sm text-theme-secondary line-clamp-3 overflow-hidden text-ellipsis break-words whitespace-pre-wrap">{prompt.prompt}</p>
            <div className="flex gap-2 overflow-x-hidden whitespace-nowrap">
                {prompt.tags.slice(0, 3).map(tag => (
                    <span key={tag} className={`text-xs font-medium px-2 py-0.5 rounded-md ${getTagColorClasses(tag)}`}>{tag}</span>
                ))}
            </div>
            {isMoveModalOpen && (
                <FolderSelectModal
                    folders={folders}
                    onSelect={handleFolderSelect}
                    onClose={() => setIsMoveModalOpen(false)}
                    currentFolderId={prompt.folder_id}
                />
            )}
            <DeletePromptConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onMoveToTrash={() => {
                    onMoveToTrash();
                    setIsConfirmOpen(false);
                }}
                onDeleteAnyway={() => {
                    onDeletePermanently();
                    setIsConfirmOpen(false);
                }}
                title="Delete Prompt"
                message={`Are you sure you want to delete the prompt "${prompt.title}"?`}
            />
        </div>
    );
};

const PromptList: React.FC<PromptListProps> = ({ isDragging, setIsDragging }) => {
    const { prompts, setEditingPrompt, setIsEditorOpen, movePromptToTrash, deletePrompt, toggleFavorite, movePrompt } = usePrompts();
    const { selectedFolderName, folders } = useFolders();
    const [searchTerm, setSearchTerm] = useState('');
    const [topTags, setTopTags] = useState<string[]>([]);

    useEffect(() => {
        const fetchTopTags = async () => {
            try {
                const tags = await getTopTags();
                setTopTags(tags);
            } catch (error) {
                console.error("Failed to fetch top tags:", error);
            }
        };
        fetchTopTags();
    }, []);

    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => 
            !searchTerm ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase().startsWith('#') ? searchTerm.toLowerCase().substring(1) : searchTerm.toLowerCase()))
        );
    }, [prompts, searchTerm]);

    const favoritePrompts = useMemo(() => prompts.filter(p => p.is_favorite), [prompts]);

    const handleTagClick = (tag: string) => {
        setSearchTerm(`#${tag}`);
    };

    const handleEditPrompt = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setIsEditorOpen(true);
    };

    return (
        <div className="p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-theme-default mb-2">{selectedFolderName}</h1>
                <p className="text-theme-secondary">Search, browse, and manage your prompts.</p>
            </header>
            
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-theme-secondary" />
                </div>
                <input
                    type="search"
                    placeholder="Search by title, content, or #tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-theme-secondary border border-theme-default rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
                />
            </div>
            
            {searchTerm.length === 0 && (
                <>
                    {(topTags.length > 0 || favoritePrompts.length > 0) && (
                         <section>
                            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
                            {topTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {topTags.map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${getTagColorClasses(tag)} hover:brightness-125`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {favoritePrompts.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {favoritePrompts.map(prompt => (
                                        <PromptCard 
                                            key={prompt.id} 
                                            prompt={prompt} 
                                            onDoubleClick={() => handleEditPrompt(prompt)}
                                            onDragStart={(e) => {
                                                setIsDragging(true);
                                                e.dataTransfer.setData('application/prompt-id', prompt.id);
                                            }}
                                            onDragEnd={() => setIsDragging(false)}
                                            onMoveToTrash={() => movePromptToTrash(prompt.id)}
                                            onDeletePermanently={() => deletePrompt(prompt.id)}
                                            onToggleFavorite={() => toggleFavorite(prompt.id)}
                                            onMove={movePrompt}
                                            folders={folders}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            <section>
                <h2 className="text-lg font-semibold mb-4">{searchTerm ? 'Search Results' : 'All Prompts'}</h2>
                 {filteredPrompts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPrompts.map(prompt => (
                           <PromptCard 
                                key={prompt.id} 
                                prompt={prompt} 
                                onDoubleClick={() => handleEditPrompt(prompt)}
                                onDragStart={(e) => e.dataTransfer.setData('application/prompt-id', prompt.id)}
                                onMoveToTrash={() => movePromptToTrash(prompt.id)}
                                onDeletePermanently={() => deletePrompt(prompt.id)}
                                onToggleFavorite={() => toggleFavorite(prompt.id)}
                                onMove={movePrompt}
                                folders={folders}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-theme-secondary rounded-lg border-2 border-dashed border-theme-default">
                        <p className="text-theme-secondary">No prompts found.</p>
                        {searchTerm && <p className="text-theme-secondary text-sm mt-1">Try a different search term.</p>}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PromptList;
