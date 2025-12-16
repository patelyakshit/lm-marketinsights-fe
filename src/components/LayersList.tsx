import React from "react";

interface Layer {
  id: string;
  title: string;
}

interface LayersListProps {
  layers: Layer[];
  onSelect: (layer: Layer) => void;
}

const LayersList: React.FC<LayersListProps> = ({ layers, onSelect }) => {
  return (
    <div style={{ marginTop: "10px" }}>
      <p>Select one:</p>
      {layers.map((layer) => (
        <button
          key={layer.id}
          onClick={() => onSelect(layer)}
          style={{ marginRight: "10px", marginBottom: "10px" }}
        >
          {layer.title}
        </button>
      ))}
    </div>
  );
};

export default LayersList;
