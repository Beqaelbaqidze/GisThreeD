export function buildJsTreeData(features) {
  const treeData = [];
  const idSet = new Set();

  for (const f of features) {
    const p = f.properties || {};

    const floor = p.FLOOR != null ? String(p.FLOOR) : "Unknown";
    const cad = p.CADCODE || "UnknownCAD";
    const reg = p.REG_N || "UnknownREG";
    const type = (p.TYPE || "UnknownType").toLowerCase();
    const sub = (p.SUB_TYPE || "UnknownSubtype").toLowerCase();

    const levels = [
      { key: `floor:${floor}`, label: `Floor ${floor}` },
      { key: `cad:${cad}`, label: cad },
      { key: `reg:${reg}`, label: reg },
      { key: `type:${type}`, label: type },
      { key: `subtype:${sub}`, label: sub },
    ];

    let path = "";
    let parent = "#";

    for (const level of levels) {
      path = path ? `${path}/${level.key}` : level.key;

      if (!idSet.has(path)) {
        idSet.add(path);
        treeData.push({
          id: path,
          parent: parent,
          text: level.label,
          state: { opened: true },
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
    core: {
      data: treeData,
      themes: { stripes: true }
    },
    plugins: ["checkbox"]
  });

  $('#jstree-panel').on('changed.jstree', function (e, data) {
    const selectedSubtypes = new Set();

    data.selected.forEach(id => {
      if (id.includes("subtype:")) {
        const subtype = id.split("subtype:")[1].toLowerCase();
        selectedSubtypes.add(subtype);
      }
    });

    for (const subtype in subtypeEntityMap) {
      const visible = selectedSubtypes.size === 0 || selectedSubtypes.has(subtype);
      subtypeEntityMap[subtype].forEach(ent => ent.show = visible);
    }
  });

  // Show all by default
  for (const subtype in subtypeEntityMap) {
    subtypeEntityMap[subtype].forEach(ent => ent.show = true);
  }
}
