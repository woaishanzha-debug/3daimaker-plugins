import * as THREE from 'three';
import { Evaluator, Brush } from 'three-bvh-csg';

const m1 = new THREE.Mesh(new THREE.BoxGeometry());
m1.geometry.deleteAttribute('uv');
const m2 = new THREE.Mesh(new THREE.BufferGeometry());
m2.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0, 1,0,0, 0,1,0]), 3));
m2.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0,0,1, 0,0,1, 0,0,1]), 3));

const evaluator = new Evaluator();
try {
  evaluator.evaluate(new Brush(m1.geometry), new Brush(m2.geometry), 0);
  console.log("Success");
} catch(e) {
  console.error("Crash:", e.message, e.stack);
}
