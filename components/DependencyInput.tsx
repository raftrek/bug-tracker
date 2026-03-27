import React, { useState, useMemo } from 'react';
import type { Issue } from '../types';

interface DependencyInputProps {
    allIssues: Issue[];
    selectedDependencyIds: string[];
    onChange: (dependencyIds: string[]) => void;
}

export const DependencyInput: React.FC<DependencyInputProps> = ({ allIssues, selectedDependencyIds, onChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const availableIssues = useMemo(() => {
        return allIssues.filter(i => !selectedDependencyIds.includes(i.id));
    }, [allIssues, selectedDependencyIds]);

    const suggestions = useMemo(() => {
        if (!inputValue) return availableIssues;
        return availableIssues.filter(issue =>
            issue.title.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [inputValue, availableIssues]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleAddDependency = (issueId: string) => {
        if (!selectedDependencyIds.includes(issueId)) {
            onChange([...selectedDependencyIds, issueId]);
        }
        setInputValue('');
    };

    const handleRemoveDependency = (issueIdToRemove: string) => {
        onChange(selectedDependencyIds.filter(id => id !== issueIdToRemove));
    };

    const selectedIssues = useMemo(() => {
        return selectedDependencyIds.map(id => allIssues.find(i => i.id === id)).filter(Boolean) as Issue[];
    }, [selectedDependencyIds, allIssues]);

    return (
        <div className="relative">
            <div className="w-full flex flex-wrap gap-2 p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 transition-colors">
                {selectedIssues.map(issue => (
                    <span key={issue.id} className="flex items-center px-2 py-1 rounded-md text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                        {issue.title}
                        <button
                            type="button"
                            onClick={() => handleRemoveDependency(issue.id)}
                            className="ml-2 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-current hover:bg-black/20 focus:outline-none"
                            title="Remove dependency"
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
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    placeholder={selectedIssues.length === 0 ? "Search to add dependencies..." : "Add another..."}
                    className="flex-grow bg-transparent outline-none text-sm p-1 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 min-w-[150px]"
                />
            </div>
            {isFocused && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map(suggestion => (
                        <div
                            key={suggestion.id}
                            onMouseDown={() => handleAddDependency(suggestion.id)}
                            className="px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-700/50 last:border-0"
                        >
                            <span className="font-medium">{suggestion.title}</span>
                            <span className="ml-2 text-xs text-neutral-500">({suggestion.status})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
