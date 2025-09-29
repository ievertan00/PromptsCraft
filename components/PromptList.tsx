import React, { useState, useMemo } from 'react';
import type { Prompt } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface PromptListProps {
    prompts: Prompt[];
    selectedFolderName: string;
    onEditPrompt: (prompt: Prompt) => void;
}

const PromptCard: React.FC<{ prompt: Prompt; onDoubleClick: () => void; onDragStart: (e: React.DragEvent) => void; }> = ({ prompt, onDoubleClick, onDragStart }) => {
    return (
        <div
            onDoubleClick={onDoubleClick}
            draggable="true"
            onDragStart={onDragStart}
            className="bg-theme-secondary border border-theme-default rounded-lg p-4 flex flex-col gap-3 cursor-pointer hover:border-theme-primary-light transition-colors h-full"
        >
            <h3 className="font-semibold text-theme-default truncate">{prompt.title}</h3>
            <p className="text-sm text-theme-secondary line-clamp-3 flex-1">{prompt.prompt}</p>
            <div className="flex flex-wrap gap-2">
                {prompt.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-theme-tag-bg text-theme-primary-light text-xs font-medium px-2 py-1 rounded-full">{tag}</span>
                ))}
            </div>
        </div>
    );
};

const PromptList: React.FC<PromptListProps> = ({ prompts, selectedFolderName, onEditPrompt }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPrompts = useMemo(() => {
        if (!searchTerm) return prompts;
        return prompts.filter(p => 
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [prompts, searchTerm]);

    // Mock data for quick access
    const recentlyUsed = useMemo(() => prompts.slice(0, 3), [prompts]);
    const mostUsed = useMemo(() => prompts.slice(3, 6), [prompts]);

    return (
        <div className="p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-theme-default mb-2">{selectedFolderName}</h1>
                <p className="text-theme-secondary">Search, browse, and manage your prompts.</p>
            </header>
            
            <div>
                <input
                    type="search"
                    placeholder="Search by title, content, or #tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg px-4 py-2 bg-theme-secondary border border-theme-default rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary-light"
                />
            </div>
            
            {searchTerm.length === 0 && (
                <>
                    {recentlyUsed.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentlyUsed.map(prompt => (
                                    <PromptCard 
                                        key={prompt.id} 
                                        prompt={prompt} 
                                        onDoubleClick={() => onEditPrompt(prompt)}
                                        onDragStart={(e) => e.dataTransfer.setData('application/prompt-id', prompt.id)}
                                    />
                                ))}
                            </div>
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
                                onDoubleClick={() => onEditPrompt(prompt)}
                                onDragStart={(e) => e.dataTransfer.setData('application/prompt-id', prompt.id)}
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
