import React, { useState, useMemo } from 'react';
import type { Tag } from '../types';

interface TagInputProps {
    allTags: Tag[];
    selectedTags: Tag[];
    onChange: (tags: Tag[]) => void;
}

const TAG_COLORS = [
    'bg-red-200 text-red-800',
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-yellow-200 text-yellow-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-indigo-200 text-indigo-800',
    'bg-gray-200 text-gray-800',
    'bg-teal-200 text-teal-800',
];

const getColorForTag = (tagName: string): string => {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
        hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const index = Math.abs(hash % TAG_COLORS.length);
    return TAG_COLORS[index];
};


export const TagInput: React.FC<TagInputProps> = ({ allTags, selectedTags, onChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const suggestions = useMemo(() => {
        if (!inputValue) return [];
        return allTags.filter(tag => 
            tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
            !selectedTags.some(selected => selected.name.toLowerCase() === tag.name.toLowerCase())
        );
    }, [inputValue, allTags, selectedTags]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleAddTag = (tag: Tag) => {
        if (!selectedTags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
            onChange([...selectedTags, tag]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const trimmedValue = inputValue.trim();
            const existingTag = allTags.find(t => t.name.toLowerCase() === trimmedValue.toLowerCase());
            
            if (existingTag) {
                handleAddTag(existingTag);
            } else {
                const capitalizedName = trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
                const newTag: Tag = {
                    name: capitalizedName,
                    color: getColorForTag(capitalizedName),
                };
                handleAddTag(newTag);
            }
        }
    };

    const handleRemoveTag = (tagToRemove: Tag) => {
        onChange(selectedTags.filter(tag => tag.name !== tagToRemove.name));
    };

    return (
        <div className="relative">
            <div className="w-full flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white">
                {selectedTags.map(tag => (
                    <span key={tag.name} className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${tag.color}`}>
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-current hover:bg-black/20 focus:outline-none"
                        >
                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                            </svg>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay to allow click on suggestions
                    placeholder="Add a tag..."
                    className="flex-grow bg-transparent outline-none text-sm p-1"
                />
            </div>
            {isFocused && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map(suggestion => (
                        <div
                            key={suggestion.name}
                            onMouseDown={() => handleAddTag(suggestion)}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                            {suggestion.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};