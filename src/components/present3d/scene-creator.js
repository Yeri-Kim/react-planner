import * as Three from 'three';
import createGrid from './grid-creator';
import {disposeObject} from './three-memory-cleaner';

export function parseData(sceneData, actions, catalog) {

  let planData = {};

  planData.sceneGraph = {
    unit: sceneData.unit,
    layers: {},
    width: sceneData.width,
    height: sceneData.height
  };

  planData.plan = new Three.Object3D();

  // Add a grid to the plan
  planData.grid = createGrid(sceneData);
  planData.boundingBox = new Three.Box3().setFromObject(planData.grid);
  let promises = [];

  sceneData.layers.forEach(layer => {

    if (layer.id === sceneData.selectedLayer || layer.visible) {
      promises = promises.concat(createLayerObjects(layer, planData, sceneData, actions, catalog));
    }
  });

  Promise.all(promises).then(value => {
    updateBoundingBox(planData);
  });

  return planData;
}

function createLayerObjects(layer, planData, sceneData, actions, catalog) {

  let promises = [];

  planData.sceneGraph.layers[layer.id] = {
    lines: {},
    holes: {},
    areas: {},
    items: {},
    visible: layer.visible,
    altitude: layer.altitude
  };

  // Import lines
  layer.lines.forEach(line => {
    promises.push(addLine(sceneData, planData, layer, line.id, catalog, actions.linesActions));
    line.holes.forEach(holeID => {
      promises.push(addHole(sceneData, planData, layer, holeID, catalog, actions.holesActions));
    })
  });

  // Import areas
  layer.areas.forEach(area => {
    promises.push(addArea(sceneData, planData, layer, area.id, catalog, actions.areaActions));
  });

  // Import items
  layer.items.forEach(item => {
    promises.push(addItem(sceneData, planData, layer, item.id, catalog, actions.itemsActions));
  });

  return promises;
}

export function updateScene(planData, sceneData, oldSceneData, diffArray, actions, catalog) {

  minimizeChangePropertiesDiffs(diffArray).forEach(diff => {

    /* First of all I need to find the object I need to update */
    let modifiedPath = diff.path.split("/");

    if (modifiedPath[1] === "layers") {

      let layer = sceneData[modifiedPath[1]].get(modifiedPath[2]);

      if (modifiedPath.length == 3) {
        switch (diff.op) {
          case 'remove':
            removeLayer( modifiedPath[2], planData );
            break;
        }
      }
      else if (modifiedPath.length > 3) {

        switch (diff.op) {
          case 'replace':
            replaceObject(modifiedPath, layer, planData, actions, sceneData, oldSceneData, catalog);
            break;
          case 'add':
            addObject(modifiedPath, layer, planData, actions, sceneData, oldSceneData, catalog);
            break;
          case 'remove':
            removeObject(modifiedPath, layer, planData, actions, sceneData, oldSceneData, catalog);
            break;
        }
      }
    } else if (modifiedPath[1] === 'selectedLayer') {
      let layerSelectedID = diff.value;
      // First of all I check if the new selected layer is not visible
      if (!sceneData.layers.get(layerSelectedID).visible) {
        // I need to create the objects for this layer
        let promises = createLayerObjects(sceneData.layers.get(layerSelectedID), planData, sceneData, actions, catalog);
        Promise.all(promises).then(values => {
          updateBoundingBox(planData);
        })
      }

      let layerGraph = sceneData.layers.get( oldSceneData.selectedLayer );

      if( layerGraph )
      {
        if (!layerGraph.visible) {
          // I need to remove the objects for this layer
          for (let lineID in layerGraph.lines) removeLine(planData, layerId, lineID);
          for (let areaID in layerGraph.areas) removeArea(planData, layerId, areaID);
          for (let itemID in layerGraph.items) removeItem(planData, layerId, itemID);
          for (let holeID in layerGraph.holes) removeHole(planData, layerId, holeID);
        }
      }
    }
  });
  return planData;
}

function replaceObject(modifiedPath, layer, planData, actions, sceneData, oldSceneData, catalog) {

  let promises = [];

  switch (modifiedPath[3]) {
    case "vertices":
      break;
    case "holes":
      let newHoleData = layer.holes.get(modifiedPath[4]);
      let lineID = newHoleData.line;
      if (modifiedPath[5] === 'selected') {
        // I remove only the hole without removing the wall
        removeHole(planData, layer.id, newHoleData.id);
        promises.push(addHole(sceneData, planData, layer, newHoleData.id, catalog, actions.holesActions));
      } else {
        layer.lines.get(lineID).holes.forEach(holeID => {
          removeHole(planData, layer.id, holeID);
        });
        removeLine(planData, layer.id, lineID);
        promises.push(addLine(sceneData, planData, layer, lineID, catalog, actions.linesActions));
        layer.lines.get(lineID).holes.forEach(holeID => {
          promises.push(addHole(sceneData, planData, layer, holeID, catalog, actions.holesActions));
        });
      }
      break;
    case "lines":
      removeLine(planData, layer.id, modifiedPath[4]);
      promises.push(addLine(sceneData, planData, layer, modifiedPath[4], catalog, actions.linesActions));
      break;
    case "areas":
      removeArea(planData, layer.id, modifiedPath[4]);
      promises.push(addArea(sceneData, planData, layer, modifiedPath[4], catalog, actions.areaActions));
      break;
    case "items":
      removeItem(planData, layer.id, modifiedPath[4]);
      promises.push(addItem(sceneData, planData, layer, modifiedPath[4], catalog, actions.itemsActions));
      break;

    case "visible":
      if (!layer.visible) {
        let layerGraph = planData.sceneGraph.layers[layer.id];

        for (let lineID in layerGraph.lines) removeLine(planData, layerId, lineID);
        for (let areaID in layerGraph.areas) removeArea(planData, layerId, areaID);
        for (let itemID in layerGraph.items) removeItem(planData, layerId, itemID);
        for (let holeID in layerGraph.holes) removeHole(planData, layerId, holeID);

      } else {
        promises = promises.concat(createLayerObjects(layer, planData, sceneData, actions, catalog))
      }

      break;
  }
  Promise.all(promises).then(values => {
    updateBoundingBox(planData);
  })
}

function removeObject(modifiedPath, layer, planData, actions, sceneData, oldSceneData, catalog) {

  let promises = [];
  switch (modifiedPath[3]) {
    case "lines":
      // Here I remove the line with all its holes
      let lineID = modifiedPath[4];
      let oldLayer = oldSceneData.layers.get(layer.id);
      oldLayer.lines.get(lineID).holes.forEach(holeID => {
        removeHole(planData, layer.id, holeID);
      });
      removeLine(planData, layer.id, lineID);
      if (modifiedPath.length > 5) {
        // I removed an hole, so I should add the new line
        promises.push(addLine(sceneData, planData, layer, lineID, catalog, actions.linesActions));
        layer.lines.get(lineID).holes.forEach(holeID => {
          promises.push(addHole(sceneData, planData, layer, holeID, catalog, actions.holesActions));
        });
      }
      break;
    case "areas":
      if (modifiedPath.length === 5) {
        // I am removing an entire area
        removeArea(planData, layer.id, modifiedPath[4]);
      }
      break;
    case "items":
      if (modifiedPath.length === 5) {
        // I am removing an item
        removeItem(planData, layer.id, modifiedPath[4]);
      }
      break;
  }

  Promise.all(promises).then(values => {
    updateBoundingBox(planData);
  })
}

function removeLayer( layerId, planData )
{
  let layerGraph = planData.sceneGraph.layers[ layerId ];

  for (let lineID in layerGraph.lines) removeLine(planData, layerId, lineID);
  for (let areaID in layerGraph.areas) removeArea(planData, layerId, areaID);
  for (let itemID in layerGraph.items) removeItem(planData, layerId, itemID);
  for (let holeID in layerGraph.holes) removeHole(planData, layerId, holeID);

  delete planData.sceneGraph.layers[ layerId ];
}

function removeHole(planData, layerId, holeToRemoveID) {
  let holeToRemove = planData.sceneGraph.layers[layerId].holes[holeToRemoveID];
  planData.plan.remove(holeToRemove);
  disposeObject(holeToRemove);
  delete planData.sceneGraph.layers[layerId].holes[holeToRemoveID];
  holeToRemove = null;
  updateBoundingBox(planData);
}

function removeLine(planData, layerId, lineID) {
  let line3D = planData.sceneGraph.layers[layerId].lines[lineID];
  planData.plan.remove(line3D);
  disposeObject(line3D);
  delete planData.sceneGraph.layers[layerId].lines[lineID];
  line3D = null;
  updateBoundingBox(planData);
}

function removeArea(planData, layerId, areaID) {
  let area3D = planData.sceneGraph.layers[layerId].areas[areaID];
  planData.plan.remove(area3D);
  disposeObject(area3D);
  delete planData.sceneGraph.layers[layerId].areas[areaID];
  area3D = null;
  updateBoundingBox(planData);
}

function removeItem(planData, layerId, itemID) {
  let item3D = planData.sceneGraph.layers[layerId].items[itemID];
  planData.plan.remove(item3D);
  disposeObject(item3D);
  delete planData.sceneGraph.layers[layerId].items[itemID];
  item3D = null;
  updateBoundingBox(planData);
}

function addObject(modifiedPath, layer, planData, actions, sceneData, oldSceneData, catalog) {

  let promises = [];
  switch (modifiedPath[3]) {
    case "lines":
      if (modifiedPath.length === 5) {
        // I have to add a line
        promises.push(addLine(sceneData, planData, layer, modifiedPath[4], catalog, actions.linesActions));
      }
      break;
    case "holes":
      if (modifiedPath.length === 5) {
        promises.push(addHole(sceneData, planData, layer, modifiedPath[4], catalog, actions.holesActions));
      }
      break;
    case "areas":
      if (modifiedPath.length === 5) {
        // I have to add an area
        promises.push(addArea(sceneData, planData, layer, modifiedPath[4], catalog, actions.areaActions));
      }
      break;
    case "items":
      if (modifiedPath.length === 5) {
        // I have to add an area
        promises.push(addItem(sceneData, planData, layer, modifiedPath[4], catalog, actions.itemsActions));
      }
      break;
  }

  Promise.all(promises).then(values => {
    updateBoundingBox(planData);
  })
}

function addHole(sceneData, planData, layer, holeID, catalog, holesActions) {
  let holeData = layer.holes.get(holeID);

  // Create the hole object
  return catalog.getElement(holeData.type).render3D(holeData, layer, sceneData).then(object => {

    let pivot = new Three.Object3D();
    pivot.add(object);

    pivot.name = holeData.type;

    let line = layer.lines.get(holeData.line);

    // First of all I need to find the vertices of this line
    let vertex0 = layer.vertices.get(line.vertices.get(0));
    let vertex1 = layer.vertices.get(line.vertices.get(1));
    let offset = holeData.offset;

    if (vertex0.x > vertex1.x) {
      let app = vertex0;
      vertex0 = vertex1;
      vertex1 = app;
      offset = 1 - offset;
    }

    let distance = Math.sqrt(Math.pow(vertex0.x - vertex1.x, 2) + Math.pow(vertex0.y - vertex1.y, 2));
    let alpha = Math.asin((vertex1.y - vertex0.y) / distance);

    let boundingBox = new Three.Box3().setFromObject(pivot);
    let center = [
      (boundingBox.max.x - boundingBox.min.x) / 2 + boundingBox.min.x,
      (boundingBox.max.y - boundingBox.min.y) / 2 + boundingBox.min.y,
      (boundingBox.max.z - boundingBox.min.z) / 2 + boundingBox.min.z];

    let holeAltitude = holeData.properties.get('altitude').get('length');
    let holeHeight = holeData.properties.get('height').get('length');

    pivot.rotation.y = alpha;
    pivot.position.x = vertex0.x + distance * offset * Math.cos(alpha) - center[2] * Math.sin(alpha);
    pivot.position.y = holeAltitude + holeHeight / 2 - center[1] + layer.altitude;
    pivot.position.z = -vertex0.y - distance * offset * Math.sin(alpha) - center[2] * Math.cos(alpha);

    planData.plan.add(pivot);
    planData.sceneGraph.layers[layer.id].holes[holeData.id] = pivot;

    applyType(pivot, holeData.type);
    applyInteract(pivot, () => {
      return holesActions.selectHole(layer.id, holeData.id)
    });

    if (!holeData.selected) {
      applyOpacity(pivot, layer.opacity);
    }

  });
}

function addLine(sceneData, planData, layer, lineID, catalog, linesActions) {
  let line = layer.lines.get(lineID);

  // First of all I need to find the vertices of this line
  let vertex0 = layer.vertices.get(line.vertices.get(0));
  let vertex1 = layer.vertices.get(line.vertices.get(1));

  if (vertex0.x > vertex1.x) {
    let app = vertex0;
    vertex0 = vertex1;
    vertex1 = app;
  }

  return catalog.getElement(line.type).render3D(line, layer, sceneData).then(line3D => {

    let pivot = new Three.Object3D();
    pivot.add(line3D);

    pivot.name = line.type;

    pivot.position.x = vertex0.x;
    pivot.position.y = layer.altitude;
    pivot.position.z = -vertex0.y;

    planData.plan.add(pivot);
    planData.sceneGraph.layers[layer.id].lines[lineID] = pivot;

    applyType(pivot, line.type);
    applyInteract(pivot, () => {
      return linesActions.selectLine(layer.id, line.id);
    });

    if (!line.selected && layer.opacity !== 1) {
      applyOpacity(pivot, layer.opacity);
    }

  });
}

function addArea(sceneData, planData, layer, areaID, catalog, areaActions) {
  let area = layer.areas.get(areaID);
  let interactFunction = () => {
    areaActions.selectArea(layer.id, area.id);
  };

  return catalog.getElement(area.type).render3D(area, layer, sceneData).then(area3D => {
    let pivot = new Three.Object3D();
    pivot.add(area3D);

    pivot.position.y = layer.altitude;
    planData.plan.add(pivot);
    planData.sceneGraph.layers[layer.id].areas[area.id] = pivot;

    applyType(pivot, area.type);
    applyInteract(pivot, interactFunction);

    if (!area.selected && layer.opacity !== 1) {
      applyOpacity(pivot, layer.opacity);
    }

  });
}

function addItem(sceneData, planData, layer, itemID, catalog, itemsActions) {
  let item = layer.items.get(itemID);

  return catalog.getElement(item.type).render3D(item, layer, sceneData).then(item3D => {

    let pivot = new Three.Object3D();
    pivot.add(item3D);

    pivot.rotation.y = item.rotation * Math.PI / 180;
    pivot.position.x = item.x;
    pivot.position.y = layer.altitude;
    pivot.position.z = -item.y;

    applyType(item3D, item.type);
    applyInteract(item3D, () => {
        itemsActions.selectItemFromPresent(layer.id, item.id);
      }
    );

    if (!item.selected && layer.opacity !== 1) {
      applyOpacity(pivot, layer.opacity);
    }

    planData.plan.add(pivot);
    planData.sceneGraph.layers[layer.id].items[item.id] = pivot;
  });

}

// Apply interact function to children of an Object3D
function applyInteract(object, interactFunction) {
  object.traverse(function (child) {
    if (child instanceof Three.Mesh) {
      child.interact = interactFunction;
    }
  });
}

// Name to children of an Object3D
function applyType(object, type) {
  object.traverse(function (child) {
    if (child instanceof Three.Mesh) {
      child.type = type;
    }
  });
}

// Apply opacity to children of an Object3D
function applyOpacity(object, opacity) {
  object.traverse(function (child) {
    if (child instanceof Three.Mesh) {
      if (child.material instanceof Three.MultiMaterial) {
        child.material.materials.forEach(materialChild => {
          materialChild.transparent = true;
          if (materialChild.maxOpacity) {
            materialChild.opacity = Math.min(materialChild.maxOpacity, opacity);
          } else if (materialChild.opacity && materialChild.opacity > opacity) {
            materialChild.maxOpacity = materialChild.opacity;
            materialChild.opacity = opacity;
          }
        });
      } else {
        child.material.transparent = true;
        if (child.material.maxOpacity) {
          child.material.opacity = Math.min(child.material.maxOpacity, opacity);
        } else if (child.material.opacity && child.material.opacity > opacity) {
          child.material.maxOpacity = child.material.opacity;
          child.material.opacity = opacity;
        }
      }
    }
  });
}


function updateBoundingBox(planData) {
  let newBoundingBox = new Three.Box3().setFromObject(planData.plan);
  if (isFinite(newBoundingBox.max.x)
    && isFinite(newBoundingBox.min.x)
    && isFinite(newBoundingBox.max.y)
    && isFinite(newBoundingBox.min.y)
    && isFinite(newBoundingBox.max.z)
    && isFinite(newBoundingBox.min.z)) {

    let newCenter = new Three.Vector3(
      ( newBoundingBox.max.x - newBoundingBox.min.x ) / 2 + newBoundingBox.min.x,
      ( newBoundingBox.max.y - newBoundingBox.min.y ) / 2 + newBoundingBox.min.y,
      ( newBoundingBox.max.z - newBoundingBox.min.z ) / 2 + newBoundingBox.min.z
    );

    planData.plan.position.sub( newCenter );
    planData.grid.position.sub( newCenter );

    newBoundingBox.min.sub( newCenter );
    newBoundingBox.max.sub( newCenter );

    planData.boundingBox = newBoundingBox;
  }
}

/**
 * Reduces the number of change properties diffs
 * @param diffArray the array of the diffs
 * @returns {Array}
 */
function minimizeChangePropertiesDiffs(diffArray) {
  let idsFound = {};
  return diffArray.filter( diff => {
    let split = diff.path.split('/');
    if( split[5] == 'properties' ) {
      return idsFound[ split[4] ] ? false : ( idsFound[ split[4] ] = 1 );
    }
    return true;
  });
}