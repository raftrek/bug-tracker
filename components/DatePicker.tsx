import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from './Calendar';
import { CalendarIcon } from './icons';

const formatDateForDisplay = (dateString?: string): string => {
  if (!dateString) return '';
  // Use replace to handle yyyy-mm-dd and avoid timezone issues
  const date = new Date(dateString.replace(/-/g, '/'));
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface DatePickerProps {
    value?: string; // yyyy-mm-dd
    onChange: (date: string) => void;
    id?: string;
    className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, id, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSelectDate = (date: string) => {
        onChange(date);
        setIsOpen(false);
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <input
                    id={id}
                    type="text"
                    readOnly
                    value={formatDateForDisplay(value)}
                    placeholder="dd/mm/yyyy"
                    className={className || "block w-full text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-neutral-800 p-2 pr-10"}
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-1">
                    <Calendar onSelectDate={handleSelectDate} selectedDate={value} />
                </div>
            )}
        </div>
    );
}
