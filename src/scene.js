import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { createPlayerPhysics } from "./physics";
import { loadScoreTexture } from "./goal";
import { selectedBarA, selectedBarB } from ".";

export const fieldWidth = 20;
export const fieldHeight = 30;

const teamA_color = 0xff0000;
const teamB_color = 0x0000ff;

export const FIELD_LIMITS = {
  minZ: -15,
  maxZ: 15,
};

export let teamAFiles = [];
export let teamBFiles = [];

export let barsA = [];
export let barsB = [];

const minX = -4;
const maxX = 4;

export let scoreMeshA, scoreMeshB;

export function createField(scene) {
  createFieldLimitsVisual(scene);
  const loader = new THREE.TextureLoader();
  const grassTexture = loader.load("src/futbolin.jpg");
  const fieldGeo = new THREE.BoxGeometry(fieldWidth, 1, fieldHeight);
  const fieldMat = new THREE.MeshPhongMaterial({ map: grassTexture });
  const field = new THREE.Mesh(fieldGeo, fieldMat);
  field.position.y = -0.5;
  scene.add(field);

  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const centerLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-fieldWidth / 2, 0.1, 0),
    new THREE.Vector3(fieldWidth / 2, 0.1, 0),
  ]);
  const centerLine = new THREE.Line(centerLineGeo, lineMat);
  scene.add(centerLine);
}

export function createTeams(scene) {
  const rowsA = [
    { count: 1, z: -14 },
    { count: 2, z: -10 },
    { count: 5, z: -2 },
    { count: 3, z: 6 },
  ];

  const rowsB = [
    { count: 3, z: -6 },
    { count: 5, z: 2 },
    { count: 2, z: 10 },
    { count: 1, z: 14 },
  ];

  teamAFiles = addTeam(0, rowsA, teamA_color, scene);
  teamBFiles = addTeam(0, rowsB, teamB_color, scene);
}

function addTeam(baseX, rows, color, scene) {
  const files = [];

  for (const row of rows) {
    const num = row.count;
    const zPos = row.z;

    let spacing;
    if (num === 1) spacing = 0;
    else if (num === 2) spacing = 5;
    else if (num === 3) spacing = 3;
    else if (num === 5) spacing = 2;
    else spacing = 2;

    const startX = baseX - (num - 1) * spacing * 0.5;

    const filePlayers = [];

    for (let i = 0; i < num; i++) {
      const player = createPlayerGroup(color);
      player.position.set(startX + i * spacing, 1, zPos);

      scene.add(player);
      createPlayerPhysics(player);
      filePlayers.push(player);
    }

    files.push(filePlayers);
  }

  return files;
}

function createPlayerGroup(color) {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
  const clothesMat = new THREE.MeshPhongMaterial({ color });

  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.5, 16);
  const body = new THREE.Mesh(bodyGeo, clothesMat);
  body.position.y = 1;
  group.add(body);
  const body2Geo = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 16);
  const body2 = new THREE.Mesh(body2Geo, clothesMat);
  body2.position.y = 0.6;
  group.add(body2);

  const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.5;
  group.add(head);

  const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16);
  const armL = new THREE.Mesh(armGeo, clothesMat);
  armL.position.set(-0.4, 1.1, 0);
  group.add(armL);

  const handGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16);
  const handL = new THREE.Mesh(handGeo, skinMat);
  handL.position.set(-0.4, 0.7, 0);
  group.add(handL);

  const armR = armL.clone();
  armR.position.x = 0.4;
  group.add(armR);

  const handR = new THREE.Mesh(handGeo, skinMat);
  handR.position.set(0.4, 0.7, 0);
  group.add(handR);

  const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16);
  const legL = new THREE.Mesh(legGeo, clothesMat);
  legL.position.set(-0.25, 0.3, 0);
  group.add(legL);

  const footGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
  const footL = new THREE.Mesh(footGeo, skinMat);
  footL.position.set(-0.25, -0.2, 0);
  group.add(footL);

  const legR = legL.clone();
  legR.position.x = 0.25;
  group.add(legR);

  const footR = new THREE.Mesh(footGeo, skinMat);
  footR.position.set(0.25, -0.2, 0);
  group.add(footR);

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}

export function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createFieldLimitsVisual(scene) {
  const loader = new THREE.TextureLoader();
  const Tex = loader.load("src/wood.jpg");

  const Mat = new THREE.MeshPhongMaterial({ map: Tex });

  const wallHeight = 2;
  const wallThickness = 0.5;
  const goalWidth = 4;

  const sideWallGeo = new THREE.BoxGeometry(
    wallThickness,
    wallHeight,
    fieldHeight
  );

  const legGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 15);

  const floorGeo = new THREE.BoxGeometry(
    fieldWidth + 0.5,
    1.5,
    fieldHeight + 0.5
  );

  const leg1 = new THREE.Mesh(legGeo, Mat);
  leg1.position.set(-fieldWidth / 2, -5.5, fieldHeight / 2);
  scene.add(leg1);

  const leg2 = new THREE.Mesh(legGeo, Mat);
  leg2.position.set(fieldWidth / 2, -5.5, fieldHeight / 2);
  scene.add(leg2);

  const leg3 = new THREE.Mesh(legGeo, Mat);
  leg3.position.set(-fieldWidth / 2, -5.5, -fieldHeight / 2);
  scene.add(leg3);

  const leg4 = new THREE.Mesh(legGeo, Mat);
  leg4.position.set(fieldWidth / 2, -5.5, -fieldHeight / 2);
  scene.add(leg4);

  const leftWall = new THREE.Mesh(sideWallGeo, Mat);
  leftWall.position.set(-fieldWidth / 2, wallHeight / 2, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, Mat);
  rightWall.position.set(fieldWidth / 2, wallHeight / 2, 0);
  scene.add(rightWall);

  const floor = new THREE.Mesh(floorGeo, Mat);
  floor.position.set(0, -0.77, 0);
  scene.add(floor);

  const segmentWidth = (fieldWidth - goalWidth) / 2;
  const frontZ = FIELD_LIMITS.maxZ + wallThickness / 2;
  const backZ = FIELD_LIMITS.minZ - wallThickness / 2;

  const horizontalWallGeo = new THREE.BoxGeometry(
    segmentWidth,
    wallHeight,
    wallThickness
  );

  const backLeft = new THREE.Mesh(horizontalWallGeo, Mat);
  backLeft.position.set(
    -fieldWidth / 2 + segmentWidth / 2,
    wallHeight / 2,
    backZ
  );
  scene.add(backLeft);

  const backRight = new THREE.Mesh(horizontalWallGeo, Mat);
  backRight.position.set(
    fieldWidth / 2 - segmentWidth / 2,
    wallHeight / 2,
    backZ
  );
  scene.add(backRight);

  const frontLeft = new THREE.Mesh(horizontalWallGeo, Mat);
  frontLeft.position.set(
    -fieldWidth / 2 + segmentWidth / 2,
    wallHeight / 2,
    frontZ
  );
  scene.add(frontLeft);

  const frontRight = new THREE.Mesh(horizontalWallGeo, Mat);
  frontRight.position.set(
    fieldWidth / 2 - segmentWidth / 2,
    wallHeight / 2,
    frontZ
  );
  scene.add(frontRight);

  createGoalVisual(backZ - 2, "rojo", scene);
  createGoalVisual(frontZ + 2, "azul", scene);
}

function createGoalVisual(zPos, team, scene) {
  const loader = new THREE.TextureLoader();
  const wallTex = loader.load("src/wood.jpg");
  const goalMat = new THREE.MeshPhongMaterial({
    map: wallTex,
    color: team === "rojo" ? 0xaa0000 : 0x0000aa,
  });

  const goalWidth = 4;
  const goalDepth = 3;
  const goalHeight = 2;

  const backGeo = new THREE.BoxGeometry(goalWidth, goalHeight, 0.2);
  const back = new THREE.Mesh(backGeo, goalMat);
  back.position.set(0, goalHeight / 2, zPos);
  scene.add(back);

  const sideGeo = new THREE.BoxGeometry(0.2, goalHeight, goalDepth);
  const left = new THREE.Mesh(sideGeo, goalMat);
  left.position.set(
    -goalWidth / 2,
    goalHeight / 2,
    zPos + (team === "rojo" ? 1.5 : -1.5)
  );
  scene.add(left);

  const right = new THREE.Mesh(sideGeo, goalMat);
  right.position.set(
    goalWidth / 2,
    goalHeight / 2,
    zPos + (team === "rojo" ? 1.5 : -1.5)
  );
  scene.add(right);

  const topGeo = new THREE.BoxGeometry(goalWidth, 0.2, goalDepth);
  const top = new THREE.Mesh(topGeo, goalMat);
  top.position.set(0, goalHeight, zPos + (team === "rojo" ? 1.5 : -1.5));
  scene.add(top);

  const bottomGeo = new THREE.BoxGeometry(goalWidth, 0.2, goalDepth);
  const bottom = new THREE.Mesh(bottomGeo, goalMat);
  bottom.position.set(0, 0, zPos + (team === "rojo" ? 1.5 : -1.5));
  scene.add(bottom);
}

function createBarForRow(zPos, scene) {
  const barLength = 30;

  const geo = new THREE.CylinderGeometry(0.15, 0.15, barLength, 16);
  const mat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });

  const bar = new THREE.Mesh(geo, mat);

  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.8, zPos);
  bar.userData.originalColor = bar.material.color.clone();
  scene.add(bar);
  return bar;
}

export function createBars(scene) {
  const rowsA_Z = [-14, -10, -2, 6];
  const rowsB_Z = [-6, 2, 10, 14];

  rowsA_Z.forEach((zPos) => {
    const bar = createBarForRow(zPos, scene);
    barsA.push(bar);
  });

  rowsB_Z.forEach((zPos) => {
    const bar = createBarForRow(zPos, scene);
    barsB.push(bar);
  });

  attachPlayersToBars();
  attachHandlesToBars(barsA, 0x993300, scene);
  attachHandlesToBars(barsB, 0x000066, scene);
}

export function clampBars() {
  [...barsA, ...barsB].forEach((bar) => {
    bar.position.x = Math.max(minX, Math.min(maxX, bar.position.x));
  });
}

function colorBar(bar, color) {
  if (Array.isArray(bar.material)) {
    bar.material.forEach((m) => m.color.set(color));
  } else {
    bar.material.color.set(color);
  }
}

export function updateSelectedBars() {
  barsA.forEach((bar, index) => {
    if (index === selectedBarA) {
      colorBar(bar, 0xffff00);
    } else {
      colorBar(bar, bar.userData.originalColor);
    }
  });

  barsB.forEach((bar, index) => {
    if (index === selectedBarB) {
      colorBar(bar, 0x00ff00);
    } else {
      colorBar(bar, bar.userData.originalColor);
    }
  });
}

function attachPlayersToBars() {
  for (let i = 0; i < barsA.length; i++) {
    const bar = barsA[i];
    const players = teamAFiles[i];

    console.log(teamAFiles[i]);

    players.forEach((p) => {
      const globalPos = p.getWorldPosition(new THREE.Vector3());
      const globalQuat = p.getWorldQuaternion(new THREE.Quaternion());

      bar.add(p);

      p.position.copy(bar.worldToLocal(globalPos));

      const barQuat = bar.getWorldQuaternion(new THREE.Quaternion());
      const barQuatInv = barQuat.invert();
      p.quaternion.copy(barQuatInv.multiply(globalQuat));
    });
  }

  for (let i = 0; i < barsB.length; i++) {
    const bar = barsB[i];
    const players = teamBFiles[i];

    players.forEach((p) => {
      const globalPos = p.getWorldPosition(new THREE.Vector3());
      const globalQuat = p.getWorldQuaternion(new THREE.Quaternion());

      bar.add(p);

      p.position.copy(bar.worldToLocal(globalPos));

      const barQuat = bar.getWorldQuaternion(new THREE.Quaternion());
      const barQuatInv = barQuat.invert();
      p.quaternion.copy(barQuatInv.multiply(globalQuat));
    });
  }
}

function attachHandlesToBars(bars, color, scene) {
  const handleGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
  const handleMat = new THREE.MeshPhongMaterial({ color });

  bars.forEach((bar) => {
    const barLength = 30;
    const half = barLength / 2 + 1;

    const localDir = new THREE.Vector3(0, 1, 0);
    const worldDir = localDir
      .clone()
      .applyQuaternion(bar.getWorldQuaternion(new THREE.Quaternion()));

    const leftWorldPos = bar.getWorldPosition(new THREE.Vector3());
    leftWorldPos.addScaledVector(worldDir, -half);

    const left = new THREE.Mesh(handleGeo, handleMat);
    left.position.copy(leftWorldPos);
    left.quaternion.copy(bar.getWorldQuaternion(new THREE.Quaternion()));

    scene.add(left);

    const leftLocal = bar.worldToLocal(left.position.clone());
    const barQuat = bar.getWorldQuaternion(new THREE.Quaternion());
    const barQuatInv = barQuat.clone().invert();

    bar.add(left);
    left.position.copy(leftLocal);
    left.quaternion.copy(barQuatInv.multiply(left.quaternion));

    const rightWorldPos = bar.getWorldPosition(new THREE.Vector3());
    rightWorldPos.addScaledVector(worldDir, +half);

    const right = new THREE.Mesh(handleGeo, handleMat);
    right.position.copy(rightWorldPos);
    right.quaternion.copy(bar.getWorldQuaternion(new THREE.Quaternion()));

    scene.add(right);

    const rightLocal = bar.worldToLocal(right.position.clone());
    const barQuat2 = bar.getWorldQuaternion(new THREE.Quaternion());
    const barQuatInv2 = barQuat2.clone().invert();

    bar.add(right);
    right.position.copy(rightLocal);
    right.quaternion.copy(barQuatInv2.multiply(right.quaternion));
  });
}

export function createScoreboards(scene) {
  const scoreGeo = new THREE.BoxGeometry(2, 10, 10);
  const panelGeo = new THREE.BoxGeometry(3, 25, 40);
  const legGeo = new THREE.CylinderGeometry(2, 2, 30, 16);

  const matA = new THREE.MeshBasicMaterial({ map: loadScoreTexture(0) });
  const matB = new THREE.MeshBasicMaterial({ map: loadScoreTexture(0) });
  const matC = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const matD = new THREE.MeshBasicMaterial({ color: 0x222222 });

  scoreMeshA = new THREE.Mesh(scoreGeo, matA);
  scoreMeshB = new THREE.Mesh(scoreGeo, matB);
  const panelMesh = new THREE.Mesh(panelGeo, matC);
  const legMesh1 = new THREE.Mesh(legGeo, matD);
  const legMesh2 = new THREE.Mesh(legGeo, matD);

  scoreMeshA.position.set(25, 10, 10);
  scoreMeshB.position.set(25, 10, -10);
  panelMesh.position.set(26, 12, 0);
  legMesh1.position.set(26, 0, 18);
  legMesh2.position.set(26, 0, -18);

  scene.add(scoreMeshA, scoreMeshB, panelMesh, legMesh1, legMesh2);

  const loader = new FontLoader();
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const textGeoA = new TextGeometry("TEAM A", {
        font,
        size: 2,
        height: 0.5,
      });
      const textMatA = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const textMeshA = new THREE.Mesh(textGeoA, textMatA);
      textMeshA.position.set(24, 18, -15);
      textMeshA.rotation.y = -Math.PI / 2;
      scene.add(textMeshA);

      const textGeoB = new TextGeometry("TEAM B", {
        font,
        size: 2,
        height: 0.5,
      });
      const textMatB = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const textMeshB = new THREE.Mesh(textGeoB, textMatB);
      textMeshB.position.set(24, 18, 5);
      textMeshB.rotation.y = -Math.PI / 2;
      scene.add(textMeshB);
    }
  );
}
