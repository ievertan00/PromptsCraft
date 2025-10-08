import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Prompt, Folder } from '../types';
import { suggestTags, refinePrompt, suggestTitle, SupportedModel } from '../services/aiService';
import { SparklesIcon } from './icons/SparklesIcon';
import TagInput from './TagInput';
import { XIcon } from './icons/XIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface PromptEditorProps {
    prompt: Prompt;
    folders: Folder[];
    onSave: (prompt: Prompt) => void;
    onClose: () => void;
    selectedModel: SupportedModel;
}

const AiSuggestion: React.FC<{ title: string; children: React.ReactNode; onAccept: () => void; onDismiss: () => void; }> = ({ title, children, onAccept, onDismiss }) => (
    <div className="bg-theme-tertiary border border-theme-primary/30 rounded-lg p-3 my-4 text-sm text-theme-default">
        <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5 text-theme-primary" />
            <h4 className="font-semibold">{title}</h4>
        </div>
        <div className="pl-7">{children}</div>
        <div className="flex gap-2 mt-3 pl-7">
            <button onClick={onAccept} className="px-3 py-1 bg-theme-primary hover:bg-theme-primary-hover text-white rounded text-xs font-semibold">Accept</button>
            <button onClick={onDismiss} className="px-3 py-1 bg-theme-tertiary hover:bg-theme-default rounded text-xs">Dismiss</button>
        </div>
    </div>
);


const PromptEditor: React.FC<PromptEditorProps> = ({ prompt: initialPrompt, folders, onSave, onClose, selectedModel }) => {
    const [prompt, setPrompt] = useState<Prompt>(initialPrompt);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestedTags, setAiSuggestedTags] = useState<string[] | null>(null);
    const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
    const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
    const initialFetchDone = useRef(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.prompt).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    useEffect(() => {
        setPrompt(initialPrompt);
        // Reset states when a new prompt is loaded into the editor
        setAiSuggestedTags(null);
        setSuggestedTitle(null);
        setRefinedPrompt(null);
        initialFetchDone.current = false;
    }, [initialPrompt]);

    // Handle Escape key press to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt({ ...prompt, prompt: e.target.value });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrompt({ ...prompt, title: e.target.value });
    };

    const handleTagsChange = (newTags: string[]) => {
        setPrompt({ ...prompt, tags: newTags });
    };


    const getAiSuggestions = useCallback(async () => {
        if (!prompt.prompt || prompt.prompt.length < 50) return;
        setIsAiLoading(true);
        try {
            const tags = await suggestTags(prompt.prompt, selectedModel);
            setAiSuggestedTags(tags);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoading(false);
        }
    }, [prompt.prompt, selectedModel]);

    const getAiTitleSuggestion = useCallback(async () => {
        if (!prompt.prompt || prompt.prompt.length < 50 || prompt.title) return; // Only suggest if title is empty
        setIsAiLoading(true);
        try {
            const titleSuggestion = await suggestTitle(prompt.prompt, selectedModel);
            setSuggestedTitle(titleSuggestion);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoading(false);
        }
    }, [prompt.prompt, prompt.title, selectedModel]);
    
    useEffect(() => {
        if (typeof prompt.id === 'string' && prompt.id.startsWith('new-') && prompt.prompt.length > 50 && !initialFetchDone.current) {
            initialFetchDone.current = true; // Set flag immediately to prevent re-triggering
            const timer = setTimeout(() => {
                getAiSuggestions();
                getAiTitleSuggestion();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [prompt.id, prompt.prompt, getAiSuggestions, getAiTitleSuggestion]);


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

    const handleRefinePrompt = async () => {
        if (!prompt.prompt) return;
        setIsAiLoading(true);
        try {
            const result = await refinePrompt(prompt.prompt, selectedModel, {
                persona: prompt.persona ?? true,
                task: prompt.task ?? true,
                context: prompt.context ?? true,
                format: prompt.format ?? true,
                max_tokens: prompt.max_tokens ?? 5000,
            });
            setRefinedPrompt(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col relative border border-theme-default"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-theme-default">
                     <input
                        type="text"
                        value={prompt.title}
                        onChange={handleTitleChange}
                        className="text-2xl font-bold bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-theme-primary-light text-theme-default"
                        placeholder="Prompt Title"
                    />
                    <div className="flex items-center gap-4 ml-4">

                        <button 
                            onClick={() => onSave(prompt)}
                            className="px-4 py-2 bg-transparent border-2 border-theme-primary text-theme-primary rounded-md font-semibold transition-colors hover:bg-theme-primary hover:text-white disabled:border-theme-default disabled:text-theme-secondary disabled:cursor-not-allowed text-sm"
                            disabled={!prompt.title || !prompt.prompt}
                        >
                            Save Prompt
                        </button>
                        <button onClick={onClose} className="p-2 text-theme-secondary rounded-full hover:bg-theme-tertiary hover:text-theme-default">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    {suggestedTitle && (
                        <AiSuggestion
                            title="AI Title Suggestion"
                            onAccept={() => {
                                setPrompt(p => ({ ...p, title: suggestedTitle }));
                                setSuggestedTitle(null);
                            }}
                            onDismiss={() => setSuggestedTitle(null)}
                        >
                            <p>Suggested Title: <strong className="font-semibold">{suggestedTitle}</strong></p>
                        </AiSuggestion>
                    )}

                    {aiSuggestedTags && aiSuggestedTags.length > 0 && (
                        <AiSuggestion
                            title="AI Tag Suggestions"
                            onAccept={() => {
                                setPrompt(p => ({ ...p, tags: [...new Set([...p.tags, ...aiSuggestedTags])] }));
                                setAiSuggestedTags(null);
                            }}
                            onDismiss={() => setAiSuggestedTags(null)}
                        >
                            <p>Add tags: {aiSuggestedTags.map(t => <span key={t} className="bg-theme-tertiary text-theme-default px-2 py-0.5 rounded-full text-xs mr-1">{t}</span>)}</p>
                        </AiSuggestion>
                    )}

                    <div className="mb-4">
                        <label className="text-sm font-medium text-theme-secondary">Tags</label>
                        <TagInput tags={prompt.tags} onTagsChange={handleTagsChange} />
                    </div>


                    <div className="flex-1 flex flex-col relative">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="prompt-prompt" className="text-sm font-medium text-theme-secondary">Prompt Content</label>
                                <button 
                                    onClick={handleCopy} 
                                    disabled={!prompt.prompt}
                                    className="text-theme-secondary hover:text-theme-default disabled:opacity-50"
                                    title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                                >
                                    {isCopied ? <span className="text-xs text-theme-primary">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            <button onClick={handleRefinePrompt} disabled={isAiLoading || !prompt.prompt} className="flex items-center gap-2 px-3 py-1.5 bg-theme-tertiary hover:bg-theme-default text-theme-default rounded-md text-sm font-semibold transition-colors disabled:opacity-50">
                                <SparklesIcon className="w-4 h-4" />
                                {isAiLoading ? 'Refining...' : 'Refine with AI'}
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-2 text-sm text-theme-secondary">
                            <h4 className="font-medium">Refinement Settings:</h4>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={prompt.persona ?? true} onChange={e => setPrompt({...prompt, persona: e.target.checked})} className="form-checkbox h-4 w-4 text-theme-primary bg-theme-default border-theme-primary-light rounded focus:ring-theme-primary" />
                                Persona
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={prompt.task ?? true} onChange={e => setPrompt({...prompt, task: e.target.checked})} className="form-checkbox h-4 w-4 text-theme-primary bg-theme-default border-theme-primary-light rounded focus:ring-theme-primary" />
                                Task
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={prompt.context ?? true} onChange={e => setPrompt({...prompt, context: e.target.checked})} className="form-checkbox h-4 w-4 text-theme-primary bg-theme-default border-theme-primary-light rounded focus:ring-theme-primary" />
                                Context
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={prompt.format ?? true} onChange={e => setPrompt({...prompt, format: e.target.checked})} className="form-checkbox h-4 w-4 text-theme-primary bg-theme-default border-theme-primary-light rounded focus:ring-theme-primary" />
                                Format
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                Max Tokens:
                                <input type="number" value={prompt.max_tokens ?? 5000} onChange={e => setPrompt({...prompt, max_tokens: parseInt(e.target.value, 10)})} className="w-20 bg-theme-default border border-theme-primary-light rounded px-2 py-0.5 focus:ring-theme-primary focus:outline-none" />
                            </label>
                        </div>

                        {refinedPrompt !== null ? (
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-theme-secondary mb-2">Original</h3>
                                    <textarea
                                        id="prompt-prompt"
                                        value={prompt.prompt}
                                        onChange={handlePromptChange}
                                        className="w-full h-full p-4 bg-theme-default rounded-md border border-theme-default focus:outline-none focus:ring-2 focus:ring-theme-primary-light resize-none"
                                        placeholder="Enter your prompt here..."
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold uppercase text-theme-secondary mb-2">AI-Refined</h3>
                                    <div className="w-full h-full p-4 bg-theme-default rounded-md border border-theme-primary-light/50 relative overflow-y-auto">
                                        <p className="whitespace-pre-wrap text-sm">{refinedPrompt}</p>
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button onClick={() => { setPrompt(p => ({...p, prompt: refinedPrompt})); setRefinedPrompt(null); }} className="px-3 py-1 bg-theme-primary hover:bg-theme-primary-hover text-white rounded text-xs font-semibold">Use this version</button>
                                            <button onClick={() => setRefinedPrompt(null)} className="px-3 py-1 bg-theme-tertiary hover:bg-theme-default rounded text-xs">Dismiss</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                id="prompt-prompt"
                                value={prompt.prompt}
                                onChange={handlePromptChange}
                                className="w-full flex-1 p-4 bg-theme-default rounded-md border border-theme-default focus:outline-none focus:ring-2 focus:ring-theme-primary-light resize-none"
                                placeholder="Enter your prompt here..."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptEditor;