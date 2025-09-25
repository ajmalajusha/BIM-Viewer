import React, { useState } from 'react';
import IFCViewer from './components/IFCViewer';
import ComponentPanel from './components/ComponentPanel';

function App() {
  const [components, setComponents] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [explodeAmount, setExplodeAmount] = useState(0);

  const handleComponentToggle = (componentId) => {
    setComponents(prevComponents =>
      prevComponents.map(comp =>
        comp.id === componentId
          ? { ...comp, visible: !comp.visible }
          : comp
      )
    );
  };

  const handleComponentHighlight = (componentId) => {
    setComponents(prevComponents =>
      prevComponents.map(comp =>
        comp.id === componentId
          ? { ...comp, highlighted: !comp.highlighted }
          : { ...comp, highlighted: false } 
      )
    );
  };

  const handleComponentUpdate = (newComponents) => {
    setComponents(newComponents);
  };

  const clearComponents = () => {
    setComponents([]);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleToggleExplode = () => {
    setExplodeAmount(prev => prev > 0 ? 0 : 2);
  };

  return (
    <div className="h-screen w-full flex bg-gray-100 text-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <IFCViewer
            components={components}
            onComponentUpdate={handleComponentUpdate}
            onClearComponents={clearComponents}
            explodeAmount={explodeAmount}
            setExplodeAmount={setExplodeAmount}
          />
        </div>

        {/* Component Panel - Collapsible */}
        {isPanelOpen && (
          <div className="w-80 bg-gray-200 border-l border-gray-300 flex flex-col">
            <ComponentPanel
              components={components}
              onComponentToggle={handleComponentToggle}
              onComponentHighlight={handleComponentHighlight}
            />
          </div>
        )}

        {/* Toggle Panel Button */}
        {/* <button
          onClick={togglePanel}
          className="absolute top-4 right-4 z-50 bg-gray-300 hover:bg-gray-400 text-gray-900 p-2 rounded-md transition-colors shadow-lg"
          title={isPanelOpen ? 'Hide Panel' : 'Show Panel'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPanelOpen ? "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" : "M13 5a2 2 0 012 2h2a2 2 0 012-2M13 5a2 2 0 00-2 2h-2a2 2 0 00-2-2M13 5a2 2 0 00-2-2h-2a2 2 0 00-2 2"} />
          </svg>
        </button> */}
      </div>
    </div>
  );
}

export default App;
