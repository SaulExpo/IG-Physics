import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";
import Ammo from "ammojs-typed";

import {
  updatePhysics,
  initPhysics,
  createFieldPhysics,
  createWallsPhysics,
  updatePlayerPhysicsFromMeshes,
} from "./physics";
import {
  createField,
  createTeams,
  createBars,
  barsA,
  barsB,
  onResize,
  createScoreboards,
  clampBars,
  updateSelectedBars,
} from "./scene";
import {
  createBall,
  updateKickAnimations,
  startKickA,
  startKickB,
  createResetBallButton,
} from "./ball";

let scene, camera, renderer, controls;

let speed = 0.2;

const keys = {};

const clock = new THREE.Clock();

export let selectedBarA = 0;
export let selectedBarB = 0;

Ammo(Ammo).then(start);

window.addEventListener("keydown", (e) => {
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
  ) {
    e.preventDefault();
  }
});

function start() {
  initPhysics();
  init();
  createFieldPhysics();
  createWallsPhysics();
  createScoreboards(scene);
  createBall(scene);
  animationLoop();
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x80bfa5);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 35, 40);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(30, 50, 30);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  createField(scene);
  createTeams(scene);
  createBars(scene);
  createResetBallButton();
  const loader = new THREE.TextureLoader();
  loader.load("https://i.imgur.com/0g2pPuh.jpeg", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = texture;
    scene.environment = texture;
  });

  window.addEventListener("resize", onResize);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);

  const deltaTime = clock.getDelta();
  clampBars();
  updateControls();
  updateKickAnimations();
  updatePlayerPhysicsFromMeshes();
  updatePhysics(deltaTime);
  TWEEN.update();

  renderer.render(scene, camera);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "a") selectedBarA = Math.max(0, selectedBarA - 1);
  if (e.key === "d")
    selectedBarA = Math.min(barsA.length - 1, selectedBarA + 1);

  if (e.key === "ArrowLeft") selectedBarB = Math.max(0, selectedBarB - 1);
  if (e.key === "ArrowRight")
    selectedBarB = Math.min(barsB.length - 1, selectedBarB + 1);

  updateSelectedBars();

  if (e.key === " ") {
    startKickA(selectedBarA);
  }
  if (e.key === "Enter") {
    startKickB(selectedBarB);
  }
});

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function updateControls() {
  if (keys["s"]) {
    barsA[selectedBarA].position.x -= speed;
  }
  if (keys["w"]) {
    barsA[selectedBarA].position.x += speed;
  }

  if (keys["ArrowDown"]) {
    barsB[selectedBarB].position.x -= speed;
  }
  if (keys["ArrowUp"]) {
    barsB[selectedBarB].position.x += speed;
  }
}
