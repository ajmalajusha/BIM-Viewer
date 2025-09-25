import React from 'react';

export default function Toolbar({
  onZoomIn,
  onZoomOut,
  onFitToView,
  onViewModeChange,
  onToggleWireframe,
  onToggleGrid,
  onClear,
  onToggleSplitMode,
  currentViewMode,
  wireframeEnabled,
  gridEnabled,
  isSplitMode
}) {
  const viewModes = [
    { id: 'isometric', label: 'Isometric', icon: '↗️' },
    { id: 'top', label: 'Top', icon: '⬆️' },
    { id: 'front', label: 'Front', icon: '⬅️' },
    { id: 'right', label: 'Right', icon: '➡️' },
    { id: 'perspective', label: 'Perspective', icon: '📐' }
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300 mr-3">View:</span>
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onViewModeChange(mode.id)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentViewMode === mode.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={mode.label}
            >
              {mode.icon}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300 mr-3">Zoom:</span>
          <button
            onClick={onZoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={onZoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6m0 0v6m0-6V4" />
            </svg>
          </button>
          <button
            onClick={onFitToView}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm rounded-md transition-colors"
            title="Fit to View"
          >
            Fit
          </button>
        </div>

        {/* Display Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300 mr-3">Display:</span>
          <button
            onClick={onToggleWireframe}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              wireframeEnabled
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Toggle Wireframe"
          >
            Wireframe
          </button>
          <button
            onClick={onToggleGrid}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              gridEnabled
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Toggle Grid"
          >
            Grid
          </button>
          <button
            onClick={onToggleSplitMode}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isSplitMode
                ? 'bg-purple-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Toggle Split View"
          >
            Split
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
            title="Clear IFC File"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
