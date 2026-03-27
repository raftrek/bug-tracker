import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Tag } from '../types';

interface TagInputProps {
    allTags: Tag[];
    selectedTags: Tag[];
    onChange: (tags: Tag[]) => void;
}

const TAG_COLORS = [
    'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'bg-lime-200 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-teal-200 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    'bg-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'bg-sky-200 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    'bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'bg-violet-200 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    'bg-purple-200 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    'bg-pink-200 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'bg-rose-200 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
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
    const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setColorPickerTag(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleChangeColor = (tagToChange: Tag, newColor: string) => {
        onChange(selectedTags.map(tag => tag.name === tagToChange.name ? { ...tag, color: newColor } : tag));
        setColorPickerTag(null);
    };

    return (
        <div className="relative">
            <div className="w-full flex flex-wrap gap-2 p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 transition-colors">
                {selectedTags.map(tag => (
                    <div key={tag.name} className="relative">
                        <span 
                            className={`flex items-center px-2 py-1 rounded-full text-sm font-medium cursor-pointer ${tag.color}`}
                            onClick={() => setColorPickerTag(colorPickerTag === tag.name ? null : tag.name)}
                        >
                            {tag.name}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                                className="ml-2 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-current hover:bg-black/20 focus:outline-none"
                            >
                                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                </svg>
                            </button>
                        </span>
                        {colorPickerTag === tag.name && (
                            <div 
                                ref={colorPickerRef}
                                className="absolute z-20 mt-1 p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xl grid grid-cols-6 gap-1 w-max"
                            >
                                {TAG_COLORS.map((colorClass, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => handleChangeColor(tag, colorClass)}
                                        className={`w-6 h-6 rounded-full cursor-pointer border border-neutral-200 dark:border-neutral-700 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`}
                                        title={colorClass}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay to allow click on suggestions
                    placeholder="Add a tag..."
                    className="flex-grow bg-transparent outline-none text-sm p-1 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                />
            </div>
            {isFocused && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map(suggestion => (
                        <div
                            key={suggestion.name}
                            onMouseDown={() => handleAddTag(suggestion)}
                            className="px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                        >
                            {suggestion.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};