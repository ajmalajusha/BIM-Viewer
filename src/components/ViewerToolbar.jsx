import React from 'react';

export default function ViewerToolbar({
  onZoomIn,
  onZoomOut,
  onFitToView,
  onViewModeChange,
  onToggleWireframe,
  onToggleGrid,
  onClear,
  onToggleSplitMode,
  onToggleExplode,
  currentViewMode,
  wireframeEnabled,
  gridEnabled,
  isSplitMode,
  explodeAmount
}) {
  const viewModes = [
    { id: 'isometric', label: 'Isometric', icon: '↗️' },
    { id: 'top', label: 'Top', icon: '⬆️' },
    { id: 'front', label: 'Front', icon: '⬅️' },
    { id: 'right', label: 'Right', icon: '➡️' },
    { id: 'perspective', label: 'Perspective', icon: '📐' }
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* View Controls */}
        <div className="flex items-center space-x-1">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onViewModeChange(mode.id)}
              className={`p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors ${
                currentViewMode === mode.id ? 'bg-blue-600 text-white' : ''
              }`}
              title={mode.label}
            >
              {mode.icon}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onZoomIn}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6m0 0v6m0-6V4" />
            </svg>
          </button>
          <button
            onClick={onZoomOut}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={onFitToView}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Fit to View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l4 4m8 0v4m0-4h-4m4 0l-4 4M4 16v4m0 0h4m-4 0l4-4m8 0v-4m0 4h-4m4 0l-4-4" />
            </svg>
          </button>
        </div>

        {/* Display Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleWireframe}
            className={`p-2 rounded transition-colors ${
              wireframeEnabled ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title="Toggle Wireframe"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1zM3 17v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1zM13 7V3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1zM13 17v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1h-4a1 1 0 00-1 1z" />
            </svg>
          </button>
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded transition-colors ${
              gridEnabled ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title="Toggle Grid"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={onToggleSplitMode}
            className={`p-2 rounded transition-colors ${
              isSplitMode ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title="Toggle Split View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={onToggleExplode}
            className={`p-2 rounded transition-colors ${
              explodeAmount > 0 ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title="Toggle Exploded View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onClear}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
          title="Clear Model"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
