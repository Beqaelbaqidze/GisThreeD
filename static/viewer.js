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
    infoBox: true,
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
