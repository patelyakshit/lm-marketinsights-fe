export const reorderLayers = (map: __esri.Map) => {
  if (!map) {
    return;
  }

  const layers = map.allLayers.toArray();

  // Find layers by ID or title
  const resultLayer = layers.find((l) => l.title === "All Parcel Results");
  const filterLayer = layers.find((l) => l.title === "Filtered Results");
  const selectedLayer = layers.find((l) => l.title === "Selected Parcel");
  if (resultLayer) map.remove(resultLayer);
  if (filterLayer) map.remove(filterLayer);
  if (selectedLayer) map.remove(selectedLayer);
  if (resultLayer) map.add(resultLayer);
  if (filterLayer) map.add(filterLayer);
  if (selectedLayer) map.add(selectedLayer);
};
