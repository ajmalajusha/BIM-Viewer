import React from 'react';

export default function ViewIndicator({ currentViewMode }) {
  const getViewLabel = (mode) => {
    switch (mode) {
      case 'top': return 'TOP';
      case 'front': return 'FRONT';
      case 'right': return 'RIGHT';
      case 'isometric': return 'ISO';
      case 'perspective': return '3D';
      default: return 'ISO';
    }
  };

  const getViewColor = (mode) => {
    switch (mode) {
      case 'top': return 'bg-blue-600';
      case 'front': return 'bg-green-600';
      case 'right': return 'bg-purple-600';
      case 'isometric': return 'bg-orange-600';
      case 'perspective': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className={`${getViewColor(currentViewMode)} text-white px-3 py-2 rounded-md shadow-lg font-bold text-sm`}>
        {getViewLabel(currentViewMode)}
      </div>
    </div>
  );
}
