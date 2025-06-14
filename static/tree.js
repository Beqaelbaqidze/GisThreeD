export function buildJsTreeData(features) {
  const treeData = [];
  const idSet = new Set();

  // Add SHENOBA root node
  const shenobaRootId = "subtype:shenoba";
  treeData.push({
    id: shenobaRootId,
    parent: "#",
    text: "SHENOBA",
    state: { opened: true }
  });
  idSet.add(shenobaRootId);

  for (const f of features) {
    const p = f.properties;
    const sub = (p.SUB_TYPE || "").toLowerCase();
    const floor = p.FLOOR != null ? String(p.FLOOR) : null;

    if (sub === "shenoba" && floor) {
      const floorId = `${shenobaRootId}/floor:${floor}`;
      if (!idSet.has(floorId)) {
        idSet.add(floorId);
        treeData.push({
          id: floorId,
          parent: shenobaRootId,
          text: `Floor ${floor}`,
          state: { opened: true }
        });
      }
    } else {
      const subtypeId = `subtype:${sub}`;
      if (!idSet.has(subtypeId)) {
        idSet.add(subtypeId);
        treeData.push({
          id: subtypeId,
          parent: "#",
          text: sub.toUpperCase(),
          state: { opened: true }
        });
      }
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
      const isShenoba = subtype.toLowerCase() === "shenoba";
      const subtypeKey = `subtype:${subtype.toLowerCase()}`;

      for (const ent of subtypeEntityMap[subtype]) {
        if (isShenoba) {
          // SHENOBA visibility only controlled by root or its child floors
          const floor = ent.properties?.FLOOR?.getValue?.() ?? null;
          const floorId = `subtype:shenoba/floor:${floor}`;
          ent.show = selectedIds.has("subtype:shenoba") || selectedIds.has(floorId);
        } else {
          // Regular subtype visibility
          ent.show = selectedIds.has(subtypeKey);
        }
      }
    }
  });

  // Show all by default
  for (const subtype in subtypeEntityMap) {
    subtypeEntityMap[subtype].forEach(ent => ent.show = true);
  }
}
