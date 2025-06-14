export function buildJsTreeData(features) {
  const treeData = [];
  const idSet = new Set();

  for (const f of features) {
    const p = f.properties;
    const levels = [];
    const floor = p.FLOOR != null ? String(p.FLOOR) : null;
    const cad = p.CADCODE || null;
    const reg = p.REG_N || null;
    const type = p.TYPE || null;
    const sub = p.SUB_TYPE || null;

    if (floor) levels.push({ key: `floor:${floor}`, label: `Floor ${floor}` });
    if (cad) levels.push({ key: `cad:${cad}`, label: cad });
    if (reg) levels.push({ key: `reg:${reg}`, label: reg });
    if (type) levels.push({ key: `type:${type}`, label: type });
    if (sub) levels.push({ key: `subtype:${sub}`, label: sub });

    let path = "";
    let parent = "#";

    for (const level of levels) {
      path = path ? `${path}/${level.key}` : level.key;
      if (!idSet.has(path)) {
        idSet.add(path);
        treeData.push({
          id: path,
          parent,
          text: level.label,
          state: { opened: true }
        });
      }
      parent = path;
    }
  }

  return treeData;
}

export function initializeJsTree(subtypeEntityMap, treeData) {
  $('#jstree-panel').jstree('destroy');
  $('#jstree-panel').jstree({
    'core': { 'data': treeData, 'themes': { 'stripes': true } },
    'plugins': ["checkbox"]
  });

  $('#jstree-panel').on('changed.jstree', function (e, data) {
  const selectedIds = new Set(data.selected);

  for (const subtype in subtypeEntityMap) {
    for (const ent of subtypeEntityMap[subtype]) {
      const floor = ent.properties?.FLOOR?.getValue?.() ?? null;
      const type = ent.properties?.SUB_TYPE?.getValue?.().toLowerCase?.() ?? "";

      // Handle SHENOBA subtype
      if (type === "shenoba") {
        const floorId = `shenoba-root/floor:${floor}`;
        ent.show = selectedIds.has("shenoba-root") || selectedIds.has(floorId);
      }
      // Handle all others via "subtype:"
      else {
        const subtypeId = `subtype:${type}`;
        ent.show = selectedIds.has(subtypeId) || selectedIds.size === 0;
      }
    }
  }
});


  // Show all by default
  for (const subtype in subtypeEntityMap) {
    subtypeEntityMap[subtype].forEach(ent => ent.show = true);
  }
}
