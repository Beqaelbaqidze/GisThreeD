export async function initializeViewer() {
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5YzYxNGM1Yy0wZjU0LTRkZWEtYTZhMy04NGRkM2Q3Y2EwM2MiLCJpZCI6MjAxOTE1LCJpYXQiOjE3MTA0MTQxNjJ9.ESJo3qUQ0CIMEgeSHMDIUHeZEGo5yUFnP5XMut8OU2o';

  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    skyBox: false,
    skyAtmosphere: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    infoBox: false,
    selectionIndicator: true,
    fullscreenButton: false,
    sceneMode: Cesium.SceneMode.SCENE3D
  });

  viewer.scene.backgroundColor = Cesium.Color.WHITE;
  viewer.scene.setTerrain(new Cesium.Terrain(viewer.terrainProvider));
  viewer.scene.globe.depthTestAgainstTerrain = false;

  proj4.defs("EPSG:32638", "+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs");

  return viewer;
}
// Add this to your viewer.js or create a new file
// Add this to your viewer.js or create a new file
let selectedEntities = [];

export function setupClickHandler(viewer, onEntityClick, selectByAttributes = ['REG_N', 'FLOOR', 'BULDING_ID']) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  handler.setInputAction(function(click) {
    const pickedObject = viewer.scene.pick(click.position);
    
    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
      const clickedEntity = pickedObject.id;
      
      // Reset previous selection
      resetSelection(viewer);
      
      // Get the properties to match based on selectByAttributes
      const matchCriteria = {};
      selectByAttributes.forEach(attr => {
        if (clickedEntity.properties[attr]) {
          matchCriteria[attr] = clickedEntity.properties[attr].getValue();
          console.log(`Clicked entity ${clickedEntity.id} attribute ${attr}: ${matchCriteria[attr]}`);
        }
      });
      
      
      // Find and highlight all matching entities
      let matchCount = 0;
      viewer.entities.values.forEach(entity => {
        if (entity.properties) {
          // Check if all specified attributes match
          let allMatch = true;
          for (const attr in matchCriteria) {
            const entityValue = entity.properties[attr]?.getValue();
            if (entityValue !== matchCriteria[attr]) {
              allMatch = false;
              break;
            }
          }
          
          if (allMatch) {
            // Store original color if not already stored
            if (!entity.originalMaterial) {
              entity.originalMaterial = entity.polygon.material;
            }
            
            // Highlight with a color (e.g., bright yellow)
            entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.7);
            entity.polygon.outlineColor = Cesium.Color.RED;
            entity.polygon.outlineWidth = 3;
            
            selectedEntities.push(entity);
            matchCount++;
          }
        }
      });
      
      console.log(`Found and highlighted ${matchCount} matching entities`);
      
      if (onEntityClick) {
        onEntityClick(clickedEntity, matchCount, matchCriteria);
      }
    } else {
      // Clicked on empty space, reset selection
      resetSelection(viewer);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  return handler;
}

export function resetSelection(viewer) {
  // Restore original colors for previously selected entities
  selectedEntities.forEach(entity => {
    if (entity.originalMaterial) {
      entity.polygon.material = entity.originalMaterial;
      entity.polygon.outlineColor = Cesium.Color.BLACK;
      entity.polygon.outlineWidth = 1;
    }
  });
  selectedEntities = [];
}