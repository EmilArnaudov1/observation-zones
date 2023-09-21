import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const [scene, controls, options, renderer, camera] = initScene();
let cone, line, observationZones;
updateScene();
animate();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function updateScene() {
  if (cone && line && observationZones.length > 0) {
    scene.remove(cone);
    scene.remove(line);
    cone.geometry.dispose();
    cone.material.dispose();
    line.geometry.dispose();
    line.material.dispose();
    observationZones.forEach((zone) => {
      scene.remove(zone);
      zone.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      zone.children.length = 0;
    });
  }

  cone = createCone(options);
  [line, observationZones] = createSpiralAndObservationZones(options);

  observationZones.forEach((zone) => {
    scene.add(zone);
  });
  scene.add(cone);
  scene.add(line);
}

function createCone(options) {
  const geometry = new THREE.ConeGeometry(
    options.coneBaseRadius,
    options.coneHeight,
    32
  );
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

  const cone = new THREE.Mesh(geometry, material);
  cone.position.y = options.coneHeight / 2;
  return cone;
}

function createSpiralAndObservationZones(options) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfff });
  const points = [];
  const observationZones = [];
  const numPoints = 500;
  const thetaMax = 20 * Math.PI;

  const h = options.coneHeight;
  const R = options.coneBaseRadius * 2;
  const d = 0.35 * R;

  for (let i = 0; i < numPoints; i++) {
    const theta = (i / (numPoints - 1)) * thetaMax;
    const y = (i / (numPoints - 1)) * h;
    const r = ((R - d) / h) * (h - y) + d;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    points.push(new THREE.Vector3(x, y, z));

    if (i % 5 === 0) {
      const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(x, y, z);

      const pointerGeometry = new THREE.PlaneGeometry(0.5, 0.5);
      const pointerMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        opacity: 0.5,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
      pointer.position.set(x, y, z);

      const centerVector = new THREE.Vector3(0, y, 0);
      pointer.lookAt(centerVector);

      const group = new THREE.Group();
      group.add(sphere);
      group.add(pointer);

      observationZones.push(group);
    }
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(lineGeometry, lineMaterial);

  return [line, observationZones];
}

function initScene() {
  const gui = new dat.GUI();

  const options = {
    coneHeight: 8,
    coneBaseRadius: 2,
  };

  gui.add(options, "coneHeight", 8, 24).onChange(updateScene);
  gui.add(options, "coneBaseRadius", 2, 12).onChange(updateScene);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.y = 10;
  camera.position.x = 10;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  const axesHelper = new THREE.AxesHelper(10);
  axesHelper.setColors("red", "green", "blue");
  scene.add(axesHelper);

  return [scene, controls, options, renderer, camera];
}
