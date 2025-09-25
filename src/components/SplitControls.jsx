import React from 'react';
export default function SplitControls({ isSplitMode, splitPosition, onSplitPositionChange }) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm">Split Position:</label>
      <input
        type="range"
        min={0}
        max={100}
        value={splitPosition}
        onChange={(e) => onSplitPositionChange(parseFloat(e.target.value))}
        className="w-32"
      />
    </div>
  );
}