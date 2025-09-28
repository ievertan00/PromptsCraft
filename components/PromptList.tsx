
import React from 'react';
import type { Prompt } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface PromptListProps {
    prompts: Prompt[];
    selectedPrompt: Prompt | null;
    onSelectPrompt: (prompt: Prompt) => void;
    onNewPrompt: () => void;
}

const PromptList: React.FC<PromptListProps> = ({ prompts, selectedPrompt, onSelectPrompt, onNewPrompt }) => {
    return (
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Prompts</h2>
                <button 
                    onClick={onNewPrompt}
                    className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                    title="New Prompt"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {prompts.length > 0 ? (
                    prompts.map(prompt => (
                        <div
                            key={prompt.id}
                            onClick={() => onSelectPrompt(prompt)}
                            className={`p-4 cursor-pointer border-l-4 ${selectedPrompt?.id === prompt.id ? 'border-indigo-500 bg-gray-800' : 'border-transparent hover:bg-gray-800/50'}`}
                        >
                            <h3 className="font-medium truncate">{prompt.title}</h3>
                            <p className="text-sm text-gray-400 mt-1 truncate">{prompt.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        <p>No prompts in this folder.</p>
                        <button onClick={onNewPrompt} className="mt-2 text-indigo-400 hover:underline">Create one now</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptList;
