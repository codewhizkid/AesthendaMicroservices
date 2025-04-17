import React from 'react';

interface CalendarToolbarProps {
  date: Date;
  onNavigate: (action: string) => void;
  onView: (view: string) => void;
  view: string;
  views: string[];
  onViewChange?: (view: string) => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  date,
  onNavigate,
  onView,
  view,
  views,
  onViewChange
}) => {
  const goToToday = () => {
    onNavigate('TODAY');
  };

  const goToPrev = () => {
    onNavigate('PREV');
  };

  const goToNext = () => {
    onNavigate('NEXT');
  };

  const viewNames = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda'
  };

  const handleViewChange = (newView: string) => {
    onView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  const getTitle = () => {
    const date_obj = new Date(date);
    const month = date_obj.toLocaleString('default', { month: 'long' });
    const year = date_obj.getFullYear();
    
    if (view === 'month') {
      return `${month} ${year}`;
    } else if (view === 'week') {
      const start = new Date(date_obj);
      start.setDate(date_obj.getDate() - date_obj.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startMonth = start.toLocaleString('default', { month: 'short' });
      const endMonth = end.toLocaleString('default', { month: 'short' });
      
      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
      } else {
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
      }
    } else if (view === 'day') {
      const day = date_obj.getDate();
      return `${month} ${day}, ${year}`;
    }
    
    return `${month} ${year}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between mb-4 p-2 bg-white border-b">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={goToPrev}
          className="p-2 text-gray-500 rounded hover:bg-gray-100"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Today
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="p-2 text-gray-500 rounded hover:bg-gray-100"
        >
          &gt;
        </button>
        <h2 className="ml-2 text-xl font-semibold">{getTitle()}</h2>
      </div>
      
      <div className="flex space-x-1">
        {views.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleViewChange(name)}
            className={`px-3 py-1 rounded ${
              view === name
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {viewNames[name as keyof typeof viewNames] || name}
          </button>
        ))}
      </div>
    </div>
  );
}; 