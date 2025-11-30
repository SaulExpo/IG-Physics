import * as THREE from "three";
import { FIELD_LIMITS, scoreMeshA, scoreMeshB } from "./scene";
import { resetBallPosition } from "./ball";

let scoreA = 0;
let scoreB = 0;

export function loadScoreTexture(number) {
  const textureLoader = new THREE.TextureLoader();
  return textureLoader.load(`numbers/${number}.png`);
}

function goalForTeamA() {
  scoreA++;
  if (scoreA > 9) scoreA = 0;

  scoreMeshA.material.map = loadScoreTexture(scoreA);
  scoreMeshA.material.needsUpdate = true;

  showGoalAnimation();
  resetBallPosition();
}

function goalForTeamB() {
  scoreB++;
  if (scoreB > 9) scoreB = 0;

  scoreMeshB.material.map = loadScoreTexture(scoreB);
  scoreMeshB.material.needsUpdate = true;

  showGoalAnimation();
  resetBallPosition();
}

export function checkGoal(ballPos) {
  const goalWidth = 4;
  const goalXMin = -goalWidth / 2;
  const goalXMax = goalWidth / 2;

  if (
    ballPos.z < FIELD_LIMITS.minZ - 0.4 &&
    ballPos.x > goalXMin &&
    ballPos.x < goalXMax
  ) {
    goalForTeamA();
  }

  if (
    ballPos.z > FIELD_LIMITS.maxZ + 0.4 &&
    ballPos.x > goalXMin &&
    ballPos.x < goalXMax
  ) {
    goalForTeamB();
  }
}

function showGoalAnimation() {
  const gif = document.getElementById("goalGif");
  gif.style.display = "block";

  gif.src = "";
  gif.src = "/src/gol.gif";

  setTimeout(() => {
    gif.style.display = "none";
  }, 3000);
}
