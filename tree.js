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
          parent: parent,
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
  const $tree = $('#jstree-panel');
  

  $tree.jstree('destroy').empty();
  

  $tree.jstree({
    'core': { 
      'data': treeData,
      'themes': { 
        'stripes': true,
        'dots': true
      },
      'check_callback': true
    },
    'plugins': ["checkbox", "wholerow"]
  });


  $tree.on('changed.jstree', function (e, data) {
    const visibleSubtypes = new Set();
    

    data.selected.forEach(id => {
      if (id.includes("subtype:")) {
        const subtype = id.split("subtype:").pop().toLowerCase();
        visibleSubtypes.add(subtype);
      }
    });

    // Update entity visibility
    for (const subtype in subtypeEntityMap) {
      const visible = visibleSubtypes.size === 0 || visibleSubtypes.has(subtype);
      const entities = subtypeEntityMap[subtype];
      if (entities && Array.isArray(entities)) {
        entities.forEach(ent => {
          if (ent && ent.show !== undefined) {
            ent.show = visible;
          }
        });
      }
    }
  });


  $tree.on('ready.jstree', function() {

    for (const subtype in subtypeEntityMap) {
      const entities = subtypeEntityMap[subtype];
      if (entities && Array.isArray(entities)) {
        entities.forEach(ent => {
          if (ent && ent.show !== undefined) {
            ent.show = true;
          }
        });
      }
    }
    

  });
}