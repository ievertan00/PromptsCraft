
import React, { useState } from 'react';

interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue) {
            onTagsChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-theme-default rounded-md border border-theme-default focus-within:ring-2 focus-within:ring-theme-primary mt-1">
            {tags.map((tag) => (
                <div key={tag} className="flex items-center bg-theme-primary/20 text-theme-primary-light rounded-full px-3 py-1 text-sm">
                    <span>{tag}</span>
                    <button onClick={() => removeTag(tag)} className="ml-2 text-theme-primary-light hover:text-theme-default">
                        &times;
                    </button>
                </div>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent focus:outline-none flex-1 min-w-[120px] text-theme-default"
                placeholder="Add tags..."
            />
        </div>
    );
};

export default TagInput;
