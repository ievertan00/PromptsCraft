
import React, { useState, useEffect, useCallback } from 'react';
import type { Prompt, Folder } from '../types';
import { suggestFolderAndTags, refinePrompt } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import TagInput from './TagInput';

interface PromptEditorProps {
    prompt: Prompt | null;
    folders: Folder[];
    onSave: (prompt: Prompt) => void;
}

const AiSuggestion: React.FC<{ title: string; children: React.ReactNode; onAccept: () => void; onDismiss: () => void; }> = ({ title, children, onAccept, onDismiss }) => (
    <div className="bg-gray-800 border border-indigo-500/30 rounded-lg p-3 my-4 text-sm">
        <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold">{title}</h4>
        </div>
        <div className="pl-7">{children}</div>
        <div className="flex gap-2 mt-3 pl-7">
            <button onClick={onAccept} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold">Accept</button>
            <button onClick={onDismiss} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">Dismiss</button>
        </div>
    </div>
);


const PromptEditor: React.FC<PromptEditorProps> = ({ prompt: initialPrompt, folders, onSave }) => {
    const [prompt, setPrompt] = useState<Prompt | null>(initialPrompt);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<{ folderId: string; tags: string[] } | null>(null);
    const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);

    useEffect(() => {
        setPrompt(initialPrompt);
        setAiSuggestions(null);
        setRefinedPrompt(null);
    }, [initialPrompt]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!prompt) return;
        setPrompt({ ...prompt, content: e.target.value });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!prompt) return;
        setPrompt({ ...prompt, title: e.target.value });
    };

    const handleTagsChange = (newTags: string[]) => {
        if (!prompt) return;
        setPrompt({ ...prompt, tags: newTags });
    };

    const getAiSuggestions = useCallback(async () => {
        if (!prompt || !prompt.content || prompt.content.length < 50) return;
        setIsAiLoading(true);
        try {
            const suggestions = await suggestFolderAndTags(prompt.content, folders);
            setAiSuggestions({ folderId: suggestions.suggestedFolderId, tags: suggestions.suggestedTags });
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoading(false);
        }
    }, [prompt, folders]);
    
    useEffect(() => {
        if (prompt?.id.startsWith('new-') && prompt.content.length > 50) {
            const timer = setTimeout(() => {
                getAiSuggestions();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [prompt?.id, prompt?.content, getAiSuggestions]);


    const handleRefinePrompt = async () => {
        if (!prompt || !prompt.content) return;
        setIsAiLoading(true);
        try {
            const result = await refinePrompt(prompt.content);
            setRefinedPrompt(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoading(false);
        }
    };
    
    if (!prompt) {
        return <div className="flex-1 p-8 flex items-center justify-center text-gray-500">Select a prompt to view or create a new one.</div>;
    }

    const getFolderPath = (folderId: string): string => {
        const findPath = (items: Folder[], id: string, currentPath: string = ''): string | null => {
            for (const item of items) {
                const path = currentPath ? `${currentPath} / ${item.name}` : item.name;
                if (item.id === id) return path;
                if (item.children) {
                    const found = findPath(item.children, id, path);
                    if (found) return found;
                }
            }
            return null;
        }
        return findPath(folders, folderId) || "Unknown Folder";
    };

    return (
        <div className="flex-1 flex flex-col p-8 bg-gray-900/50 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <input
                    type="text"
                    value={prompt.title}
                    onChange={handleTitleChange}
                    className="text-2xl font-bold bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-indigo-500"
                    placeholder="Prompt Title"
                />
                <button 
                    onClick={() => onSave(prompt)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    disabled={!prompt.title || !prompt.content}
                >
                    Save
                </button>
            </div>

            {aiSuggestions && (
                <AiSuggestion
                    title="AI Suggestions"
                    onAccept={() => {
                        setPrompt(p => p ? { ...p, folderId: aiSuggestions.folderId, tags: [...new Set([...p.tags, ...aiSuggestions.tags])] } : null);
                        setAiSuggestions(null);
                    }}
                    onDismiss={() => setAiSuggestions(null)}
                >
                    <p>Move to: <strong className="font-semibold">{getFolderPath(aiSuggestions.folderId)}</strong></p>
                    <p>Add tags: {aiSuggestions.tags.map(t => <span key={t} className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full text-xs mr-1">{t}</span>)}</p>
                </AiSuggestion>
            )}

            <div className="mb-4">
                <label className="text-sm font-medium text-gray-400">Tags</label>
                <TagInput tags={prompt.tags} onTagsChange={handleTagsChange} />
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="prompt-content" className="text-sm font-medium text-gray-400">Prompt Content</label>
                    <button onClick={handleRefinePrompt} disabled={isAiLoading || !prompt.content} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50">
                        <SparklesIcon className="w-4 h-4" />
                        {isAiLoading ? 'Refining...' : 'Refine with AI'}
                    </button>
                </div>

                {refinedPrompt ? (
                     <div className="grid grid-cols-2 gap-4 flex-1">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Original</h3>
                            <textarea
                                id="prompt-content"
                                value={prompt.content}
                                onChange={handleContentChange}
                                className="w-full h-full p-4 bg-gray-950 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Enter your prompt here..."
                            />
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">AI-Refined</h3>
                            <div className="w-full h-full p-4 bg-gray-950 rounded-md border border-indigo-500/50 relative">
                                <p className="whitespace-pre-wrap">{refinedPrompt}</p>
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                     <button onClick={() => { setPrompt(p => p ? {...p, content: refinedPrompt} : null); setRefinedPrompt(null); }} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold">Use this version</button>
                                     <button onClick={() => setRefinedPrompt(null)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">Dismiss</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <textarea
                        id="prompt-content"
                        value={prompt.content}
                        onChange={handleContentChange}
                        className="w-full flex-1 p-4 bg-gray-950 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="Enter your prompt here..."
                    />
                )}
            </div>
        </div>
    );
};

export default PromptEditor;
