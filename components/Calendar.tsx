import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarProps {
  onSelectDate: (date: string) => void; // yyyy-mm-dd
  selectedDate?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ onSelectDate, selectedDate }) => {
  const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate.replace(/-/g, '/')) : new Date());

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="w-8 h-8"></div>);
  }

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = dateString === selectedDate;
    const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;

    calendarDays.push(
      <button
        key={day}
        type="button"
        onClick={() => onSelectDate(dateString)}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors 
          ${isSelected ? 'bg-primary-500 text-white font-bold' : ''}
          ${!isSelected && isToday ? 'bg-blue-100 text-primary-600' : ''}
          ${!isSelected && !isToday ? 'hover:bg-gray-200' : ''}
        `}
      >
        {day}
      </button>
    );
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 border w-64">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="font-semibold text-gray-700">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button type="button" onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-gray-500 mb-2">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays}
      </div>
    </div>
  );
};
