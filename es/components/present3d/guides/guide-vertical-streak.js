import * as Three from 'three';
import { List } from 'immutable';

export default function (width, height, guide) {
  var step = guide.properties.get('step');
  var colors = void 0;

  if (guide.properties.has('color')) {
    colors = new List([guide.properties.get('color')]);
  } else {
    colors = guide.properties.get('colors');
  }

  var streak = new Three.Object3D();

  var counter = 0;

  for (var i = 0; i <= width; i += step) {

    var geometry = new Three.Geometry();
    geometry.vertices.push(new Three.Vector3(i, 0, 0));
    geometry.vertices.push(new Three.Vector3(i, 0, -height));
    var color = colors.get(counter % colors.size);
    var material = new Three.LineBasicMaterial({
      opacity: 0,
      transparent: true,
      color: color
    });

    streak.add(new Three.LineSegments(geometry, material));
    counter++;
  }
  return streak;
}