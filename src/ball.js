import * as THREE from "three";
import { margin, physicsWorld } from "./physics";
import { barsA, barsB, teamAFiles, teamBFiles } from "./scene";
import * as TWEEN from "@tweenjs/tween.js";

let ballMesh;
export let ballStarted = false;

let barRotatingA = [false, false, false, false];
let barRotatingB = [false, false, false, false];

let stillTime = 0;
const STILL_LIMIT = 5;
const VELOCITY_EPS = 0.05;

export const rigidBodies = [];

export function startKickA(index) {
  const bar = barsA[index];
  const players = teamAFiles[index];

  const kickAngle = -Math.PI / 2.5;

  new TWEEN.Tween(bar.rotation)
    .to({ x: kickAngle }, 100)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      attemptKick(players, +1);
    })
    .onComplete(() => {
      new TWEEN.Tween(bar.rotation)
        .to({ x: 0 }, 150)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    })
    .start();
}

export function startKickB(index) {
  const bar = barsB[index];
  const players = teamBFiles[index];

  const kickAngle = Math.PI / 2.5;

  new TWEEN.Tween(bar.rotation)
    .to({ x: kickAngle }, 100)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      attemptKick(players, -1);
    })
    .onComplete(() => {
      new TWEEN.Tween(bar.rotation)
        .to({ x: 0 }, 150)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    })
    .start();
}

function attemptKick(players, direction) {
  if (!ballMesh) return;

  const ballBody = ballMesh.userData.physicsBody;
  if (!ballBody) return;

  const ballPos = ballMesh.position;

  for (const p of players) {
    const dx = Math.abs(p.getWorldPosition(new THREE.Vector3()).x - ballPos.x);
    if (dx > 0.7) continue;
    const dz = p.getWorldPosition(new THREE.Vector3()).z - ballPos.z;

    if (Math.abs(dz) < 1) {
      const impulse = new Ammo.btVector3(0, 0, direction * 10);
      ballBody.applyCentralImpulse(impulse);
      return;
    }
  }
}

export function updateKickAnimations() {
  for (let i = 0; i < barsA.length; i++) {
    if (barRotatingA[i]) {
      barsA[i].rotation.x += 0.2;

      if (barsA[i].rotation.x >= 0) {
        barsA[i].rotation.x = 0;
        barRotatingA[i] = false;
      }
    }
  }

  for (let i = 0; i < barsB.length; i++) {
    if (barRotatingB[i]) {
      barsB[i].rotation.x += 0.2;

      if (barsB[i].rotation.x >= 0) {
        barsB[i].rotation.x = 0;
        barRotatingB[i] = false;
      }
    }
  }
}

export function createBall(scene) {
  const ballRadius = 0.5;
  const ballMass = 1;

  const ballGeo = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
  ballMesh = new THREE.Mesh(ballGeo, ballMat);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  ballMesh.position.set(0, 3, 0);

  scene.add(ballMesh);

  const shape = new Ammo.btSphereShape(ballRadius);
  shape.setMargin(margin);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(0, 3, 0));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  shape.calculateLocalInertia(ballMass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    ballMass,
    motionState,
    shape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.2);
  body.setRestitution(0.8);

  ballMesh.userData.physicsBody = body;
  rigidBodies.push(ballMesh);

  physicsWorld.addRigidBody(body);
}

export function kickBallRandom(body) {
  const dir = Math.random() < 0.5 ? -1 : 1;

  const force = new Ammo.btVector3(0, 0, dir * 5);

  body.setLinearVelocity(force);

  console.log("Pelota impulsada hacia", dir > 0 ? "adelante" : "atrás");
}

export function checkBallStill(dt) {
  if (!ballMesh) return;

  const body = ballMesh.userData.physicsBody;
  const vel = body.getLinearVelocity();

  const speed = Math.abs(vel.x()) + Math.abs(vel.y()) + Math.abs(vel.z());

  if (speed < VELOCITY_EPS) {
    stillTime += dt;

    if (stillTime >= STILL_LIMIT) {
      updateBallStarted(false);
      resetBallPosition();
      stillTime = 0;
    }
  } else {
    stillTime = 0;
  }
}

export function resetBallPosition() {
  console.log("🔄 La pelota estuvo quieta 5s → reiniciando...");

  const body = ballMesh.userData.physicsBody;

  const trans = new Ammo.btTransform();
  trans.setIdentity();
  trans.setOrigin(new Ammo.btVector3(0, 3, 0));

  body.setWorldTransform(trans);
  body.getMotionState().setWorldTransform(trans);

  body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
  body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));

  ballMesh.position.set(0, 3, 0);
}

export function updateBallStarted(bool) {
  ballStarted = bool;
}

export function createResetBallButton() {
  const btn = document.createElement("button");
  btn.textContent = "Reset Ball";
  btn.id = "resetBallBtn";

  Object.assign(btn.style, {
    position: "fixed",
    top: "10px",
    left: "10px",
    zIndex: 9999,
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    background: "#222",
    color: "white",
    border: "2px solid white",
    borderRadius: "8px",
    cursor: "pointer",
    opacity: "0.85",
  });

  btn.addEventListener("mouseenter", () => {
    btn.style.opacity = "1";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.opacity = "0.85";
  });

  btn.addEventListener("click", () => {
    resetBallPosition();
    updateBallStarted(false);
  });

  document.body.appendChild(btn);
}
