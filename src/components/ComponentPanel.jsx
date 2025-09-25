import React, { useState, useMemo } from 'react';

export default function ComponentPanel({ components, onComponentToggle, onComponentHighlight }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showOnlyVisible, setShowOnlyVisible] = useState(false);

 
  const componentTypes = useMemo(() => {
    if (!components || components.length === 0) return [];
    const types = [...new Set(components.map(comp => comp.type))];
    return types.sort();
  }, [components]);

 
  const filteredComponents = useMemo(() => {
    if (!components || components.length === 0) return [];
    return components.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || component.type === selectedType;
      const matchesVisibility = !showOnlyVisible || component.visible;

      return matchesSearch && matchesType && matchesVisibility;
    });
  }, [components, searchTerm, selectedType, showOnlyVisible]);


  const stats = useMemo(() => {
    if (!components || components.length === 0) {
      return { total: 0, visible: 0, hidden: 0, highlighted: 0 };
    }
    const total = components.length;
    const visible = components.filter(c => c.visible).length;
    const hidden = total - visible;
    const highlighted = components.filter(c => c.highlighted).length;

    return { total, visible, hidden, highlighted };
  }, [components]);

  if (!components || components.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 border-l border-gray-300 flex flex-col">
        <div className="p-4 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900">Model Components</h3>
          <p className="text-sm text-gray-600 mt-1">No components loaded. Please load an IFC file first.</p>
        </div>
      </div>
    );
  }

  const handleToggle = (componentId) => {
    onComponentToggle(componentId);
  };

  const handleHighlight = (componentId) => {
    onComponentHighlight(componentId);
  };

  const handleToggleAll = (visible) => {
   
    filteredComponents.forEach(component => {
      if (component.visible !== visible) {
        onComponentToggle(component.id);
      }
    });
  };

  return (
    <div className="w-full h-full bg-gray-200 border-l border-gray-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300">
        <h3 className="text-lg font-semibold text-gray-900">Model Components</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-100/50 p-2 rounded border border-blue-300">
            <span className="font-medium text-blue-700">Total:</span> {stats.total}
          </div>
          <div className="bg-green-100/50 p-2 rounded border border-green-300">
            <span className="font-medium text-green-700">Visible:</span> {stats.visible}
          </div>
          <div className="bg-gray-300 p-2 rounded border border-gray-400">
            <span className="font-medium text-gray-700">Hidden:</span> {stats.hidden}
          </div>
          <div className="bg-red-100/50 p-2 rounded border border-red-300">
            <span className="font-medium text-red-700">Highlighted:</span> {stats.highlighted}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {componentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Visibility Filter */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showOnlyVisible"
            checked={showOnlyVisible}
            onChange={(e) => setShowOnlyVisible(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="showOnlyVisible" className="text-sm text-gray-700">
            Show only visible
          </label>
        </div>

        {/* Bulk Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleToggleAll(true)}
            className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => handleToggleAll(false)}
            className="flex-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            Hide All
          </button>
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {filteredComponents.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">
              No components match the current filters.
            </p>
          ) : (
            filteredComponents.map((component) => (
              <div
                key={component.id}
                className={`p-3 rounded-lg border transition-all ${
                  component.visible
                    ? 'bg-gray-300 border-gray-400 shadow-sm'
                    : 'bg-gray-100 border-gray-400 opacity-60'
                } ${component.highlighted ? 'ring-2 ring-red-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={component.visible}
                      onChange={() => handleToggle(component.id)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {component.name}
                    </span>
                    {component.highlighted && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100/50 text-red-700 border border-red-300">
                        Highlighted
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 mb-2">
                  <button
                    onClick={() => handleHighlight(component.id)}
                    className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                      component.highlighted
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-400 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {component.highlighted ? 'Stop Highlight' : 'Highlight'}
                  </button>
                </div>

                <div className="text-xs text-gray-600">
                  <span className="font-medium">Type:</span> {component.type}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
