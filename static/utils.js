export function reprojectGeoJSON(geojson) {
  return {
    type: "FeatureCollection",
    features: geojson.features.map(feature => {
      const coords = feature.geometry.coordinates[0].map(pt =>
        proj4("EPSG:32638", "EPSG:4326", pt)
      );
      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties: feature.properties
      };
    })
  };
}
