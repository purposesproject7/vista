// src/shared/utils/dataAdapter.js
// Generic adapter - modify when backend structure changes
export const adaptBackendData = (data, mapping) => {
  if (Array.isArray(data)) {
    return data.map(item => adaptBackendData(item, mapping));
  }
  
  const adapted = {};
  Object.keys(mapping).forEach(key => {
    const backendKey = mapping[key];
    adapted[key] = data[backendKey] !== undefined ? data[backendKey] : null;
  });
  
  return adapted;
};
