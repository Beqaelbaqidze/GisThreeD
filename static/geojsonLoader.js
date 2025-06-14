import { reprojectGeoJSON } from './utils.js';
import { buildJsTreeData, initializeJsTree } from './tree.js';

export async function processGeoJSON(data, viewer) {
  const reprojected = reprojectGeoJSON(data);
  const dataSource = await Cesium.GeoJsonDataSource.load(reprojected, { clampToGround: false });

  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.dataSources.add(dataSource);
  viewer.zoomTo(dataSource);

  const entities = dataSource.entities.values;
  const groupedEntities = {};
  const subtypeEntityMap = {};
  const julianNow = Cesium.JulianDate.now();

  // Grouping
  for (let entity of entities) {
    if (!entity.polygon) continue;
    const props = entity.properties;
    const cad = props?.CADCODE?.getValue(julianNow) || "";
    const reg = props?.REG_N?.getValue(julianNow) || "";
    const floor = props?.FLOOR?.getValue(julianNow) ?? "";
    if (!cad || !reg || floor === "") continue;
    const key = `${floor}|${cad}|${reg}`;
    if (!groupedEntities[key]) groupedEntities[key] = [];
    groupedEntities[key].push(entity);
  }

  for (const key in groupedEntities) {
    const group = groupedEntities[key];

    // Base height from "ked"
    let baseHeight = 0;
    for (let entity of group) {
      const sub = entity.properties?.SUB_TYPE?.getValue(julianNow)?.toLowerCase() || "";
      const height = parseFloat(entity.properties?.HEIGHT?.getValue(julianNow) || 0);
      if (sub.includes("ked")) {
        baseHeight = height;
        break;
      }
    }

    // Terrain height
    const hierarchy = group[0].polygon.hierarchy.getValue(julianNow);
    const positions = hierarchy.positions;
    const cartographic = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    const avgLon = cartographic.reduce((sum, c) => sum + c.longitude, 0) / cartographic.length;
    const avgLat = cartographic.reduce((sum, c) => sum + c.latitude, 0) / cartographic.length;
    const terrainSample = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [
      new Cesium.Cartographic(avgLon, avgLat)
    ]);
    const terrainHeight = terrainSample[0].height || 0;

    for (let entity of group) {
      if (!entity.polygon) continue;

      const props = entity.properties;
      const rawSub = props?.SUB_TYPE?.getValue(julianNow) || "";
      const sub = rawSub.trim().toLowerCase() || "unknown";
      const height = parseFloat(props?.HEIGHT?.getValue(julianNow) || 0);
      const floor = parseInt(props?.FLOOR?.getValue(julianNow) || 0);
      const hierarchy = entity.polygon.hierarchy.getValue(julianNow);
      const base = terrainHeight + baseHeight * (floor - 1);
      const sarTuli = parseInt(props?.SARTULI?.getValue(julianNow) || 0);

      props.SUB_TYPE = new Cesium.ConstantProperty(sub);
      if (!subtypeEntityMap[sub]) subtypeEntityMap[sub] = [];

      const poly = entity.polygon;

      // SHENOBA stacking
      // const hasSubType = props?.SUB_TYPE?.getValue(julianNow);
      if (sarTuli) {
        viewer.entities.remove(entity);
        for (let i = 0; i < sarTuli; i++) {
          const stacked = viewer.entities.add({
            name: `Shenoba Floor ${i + 1}`,
            polygon: {
              hierarchy,
              height: base + (baseHeight * i),
              extrudedHeight: base + (baseHeight * (i + 1)),
              outline: true,
              outlineColor: Cesium.Color.BLACK
            },
            properties: new Cesium.PropertyBag({ SARTULI: sarTuli, FLOOR: i + 1 })
          });
          (subtypeEntityMap["shenoba"] ||= []).push(stacked);
        }
        continue;
      }

      switch (true) {
        case sub.includes("ked") || sub.includes("kol"):
          Object.assign(poly, {
            height: base,
            extrudedHeight: base + height,
            material: Cesium.Color.GRAY.withAlpha(0.8),
            outline: true,
            outlineColor: Cesium.Color.YELLOW
          });
          break;

        case sub.includes("kar"):
          Object.assign(poly, {
            height: base,
            extrudedHeight: base + height,
            material: Cesium.Color.BROWN.withAlpha(0.8)
          });
          const newEntity = viewer.entities.add({
            name: entity.name?.getValue(julianNow) || "Object",
            polygon: {
              hierarchy,
              height: base + height,
              extrudedHeight: base + baseHeight,
              material: Cesium.Color.GRAY.withAlpha(0.8),
              outline: true,
              outlineColor: Cesium.Color.YELLOW
            },
            properties: props
          });
          subtypeEntityMap[sub].push(entity, newEntity);
          continue;

        case sub.includes("fan"):
          const midStart = base + ((baseHeight - height) / 2) + 0.3;
          const midEnd = midStart + height;

          Object.assign(poly, {
            height: midStart,
            extrudedHeight: midEnd,
            material: Cesium.Color.AQUA.withAlpha(0.8)
          });

          const parts = [
            { height: midEnd, extrudedHeight: midEnd + ((baseHeight - height) / 2) - 0.3 },
            { height: base, extrudedHeight: midStart }
          ];

          for (const part of parts) {
            const partEntity = viewer.entities.add({
              name: entity.name?.getValue(julianNow) || "Object",
              polygon: {
                hierarchy,
                height: part.height,
                extrudedHeight: part.extrudedHeight,
                material: Cesium.Color.GRAY.withAlpha(0.8),
                outline: true,
                outlineColor: Cesium.Color.YELLOW
              },
              properties: props
            });
            subtypeEntityMap[sub].push(partEntity);
          }
          break;

        case sub.includes("iat") || sub.includes("aiv"):
          Object.assign(poly, {
            height: base,
            extrudedHeight: base + 0.1,
            material: Cesium.Color.BLACK.withAlpha(0.5)
          });
          break;

        case sub.includes("kib"):
          Object.assign(poly, {
            height: base,
            extrudedHeight: base + 0.3,
            material: Cesium.Color.BLUE.withAlpha(0.8)
          });
          viewer.entities.remove(entity);
          continue;

        case sub.includes("lif"):
          Object.assign(poly, {
            height: base,
            extrudedHeight: base + baseHeight,
            material: Cesium.Color.PINK.withAlpha(0.8)
          });
          break;

        default:
          Object.assign(poly, {
            height: base,
            extrudedHeight: base + height,
            material: Cesium.Color.RED.withAlpha(1)
          });
      }

      subtypeEntityMap[sub].push(entity);
    }
  }

  const treeData = buildJsTreeData(reprojected.features);
  initializeJsTree(subtypeEntityMap, treeData);
}
