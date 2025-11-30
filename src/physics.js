import * as THREE from "three";
import Ammo from "ammojs-typed";
import {
  fieldWidth,
  fieldHeight,
  FIELD_LIMITS,
  teamAFiles,
  teamBFiles,
} from "./scene";
import {
  rigidBodies,
  ballStarted,
  updateBallStarted,
  checkBallStill,
  kickBallRandom,
} from "./ball";
import { checkGoal } from "./goal";

export let physicsWorld;
const gravityConstant = 7.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let transformAux1;

let ballGrounded = false;

export const margin = 0.05;

export function initPhysics() {
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
}

export function createFieldPhysics() {
  const sx = fieldWidth;
  const sy = 1;
  const sz = fieldHeight;

  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  shape.setMargin(margin);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(0, -0.5, 0));

  const motionState = new Ammo.btDefaultMotionState(transform);
  const localInertia = new Ammo.btVector3(0, 0, 0);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    localInertia
  );

  const body = new Ammo.btRigidBody(rbInfo);
  physicsWorld.addRigidBody(body);
}

function createShape(w, h, d) {
  return new Ammo.btBoxShape(new Ammo.btVector3(w / 2, h / 2, d / 2));
}

function addWall(shape, pos) {
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

  const motionState = new Ammo.btDefaultMotionState(transform);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new Ammo.btVector3(0, 0, 0)
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setRestitution(1.3);
  body.setFriction(0.3);

  physicsWorld.addRigidBody(body);
}

export function createWallsPhysics() {
  const wallThickness = 0.5;
  const wallHeight = 2;

  const halfWidth = fieldWidth * 0.5;
  const halfHeight = fieldHeight * 0.5;

  const goalWidth = 4;
  const gapHalf = goalWidth / 2;

  const wallY = 1;

  {
    const zPos = FIELD_LIMITS.maxZ + wallThickness;

    const leftWidth = halfWidth - gapHalf;
    const rightWidth = leftWidth;

    addWall(createShape(leftWidth, wallHeight, wallThickness), {
      x: -gapHalf - leftWidth / 2,
      y: wallY,
      z: zPos,
    });

    addWall(createShape(rightWidth, wallHeight, wallThickness), {
      x: gapHalf + rightWidth / 2,
      y: wallY,
      z: zPos,
    });
  }

  {
    const zPos = FIELD_LIMITS.minZ - wallThickness;

    const leftWidth = halfWidth - gapHalf;
    const rightWidth = leftWidth;

    addWall(createShape(leftWidth, wallHeight, wallThickness), {
      x: -gapHalf - leftWidth / 2,
      y: wallY,
      z: zPos,
    });

    addWall(createShape(rightWidth, wallHeight, wallThickness), {
      x: gapHalf + rightWidth / 2,
      y: wallY,
      z: zPos,
    });
  }

  const sideZ = 0;

  addWall(createShape(wallThickness, wallHeight, fieldHeight), {
    x: -halfWidth - wallThickness,
    y: wallY,
    z: sideZ,
  });

  addWall(createShape(wallThickness, wallHeight, fieldHeight), {
    x: halfWidth + wallThickness,
    y: wallY,
    z: sideZ,
  });

  createGoalFloor(FIELD_LIMITS.maxZ + 2);

  createGoalFloor(FIELD_LIMITS.minZ - 2);

  createGoalPhysics(FIELD_LIMITS.maxZ + 0.5, +1);

  createGoalPhysics(FIELD_LIMITS.minZ - 0.5, -1);
}

function createGoalPhysics(zPos, direction) {
  const goalWidth = 4;
  const goalHeight = 2.5;
  const goalDepth = 3;

  const halfW = goalWidth / 2;
  const halfH = goalHeight / 2;
  const halfD = goalDepth / 2;

  const baseY = 0.8;

  function addBox(w, h, d, pos) {
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(w, h, d));

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

    const motionState = new Ammo.btDefaultMotionState(transform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
      0,
      motionState,
      shape,
      new Ammo.btVector3(0, 0, 0)
    );

    const body = new Ammo.btRigidBody(rbInfo);
    body.setRestitution(0.2);
    body.setFriction(1);
    physicsWorld.addRigidBody(body);
  }

  addBox(halfW, 0.1, halfD, {
    x: 0,
    y: baseY - halfH,
    z: zPos + direction * halfD,
  });

  addBox(halfW, 0.1, halfD, {
    x: 0,
    y: baseY + goalHeight,
    z: zPos + direction * halfD,
  });

  addBox(halfW, halfH, 0.1, {
    x: 0,
    y: baseY,
    z: zPos + direction * goalDepth,
  });

  addBox(0.1, halfH, halfD, {
    x: -goalWidth / 2,
    y: baseY,
    z: zPos + direction * halfD,
  });

  addBox(0.1, halfH, halfD, {
    x: goalWidth / 2,
    y: baseY,
    z: zPos + direction * halfD,
  });
}

function createGoalFloor(zPos) {
  const floorWidth = 4;
  const floorDepth = 3;
  const floorY = 0;

  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(floorWidth / 2, 0.1, floorDepth / 2)
  );

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(0, floorY, zPos));

  const motionState = new Ammo.btDefaultMotionState(transform);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new Ammo.btVector3(0, 0, 0)
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setRestitution(0.2);
  body.setFriction(1.0);

  physicsWorld.addRigidBody(body);
}

export function createPlayerPhysics(player) {
  const pos = player.position;
  const quat = player.quaternion;

  const shape = new Ammo.btCylinderShape(new Ammo.btVector3(0.2, 1, 0.2));
  shape.setMargin(margin);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);
  player.userData.physicsBody = body;
  physicsWorld.addRigidBody(body);
  body.setCollisionFlags(body.getCollisionFlags() | 2);
  body.setActivationState(4);
}

export function updatePhysics(deltaTime) {
  if (!physicsWorld) return;

  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();
    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      if (!ballStarted && p.y() < 0.6) {
        kickBallRandom(objPhys);
        updateBallStarted(true);
        ballGrounded = true;
      }
      if (ballGrounded) {
        const vel = objPhys.getLinearVelocity();

        if (vel.y() > 0.5) {
          vel.setY(0.5);
          objPhys.setLinearVelocity(vel);
        }

        if (p.y() > 1.2) {
          const corrected = new Ammo.btTransform();
          corrected.setIdentity();
          corrected.setOrigin(new Ammo.btVector3(p.x(), 1.2, p.z()));
          corrected.setRotation(objPhys.getWorldTransform().getRotation());

          objPhys.setWorldTransform(corrected);
          objPhys.activate();
        }
      }
      checkGoal(objThree.position);
    }
  }
  checkBallStill(deltaTime);
}

export function updatePlayerPhysicsFromMeshes() {
  const allPlayers = [...teamAFiles.flat(), ...teamBFiles.flat()];

  allPlayers.forEach((player) => {
    const body = player.userData.physicsBody;
    if (!body) return;

    const flags = body.getCollisionFlags();
    const CF_KINEMATIC_OBJECT = 2;

    if ((flags & CF_KINEMATIC_OBJECT) === 0) return;

    const wp = player.getWorldPosition(new THREE.Vector3());
    const wq = player.getWorldQuaternion(new THREE.Quaternion());

    const trans = new Ammo.btTransform();
    trans.setIdentity();
    trans.setOrigin(new Ammo.btVector3(wp.x, wp.y, wp.z));
    trans.setRotation(new Ammo.btQuaternion(wq.x, wq.y, wq.z, wq.w));

    body.getMotionState().setWorldTransform(trans);
    body.setWorldTransform(trans);

    body.activate();
  });
}
