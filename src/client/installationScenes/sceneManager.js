//import * as TestScene from './gigiTree.js'
import * as GiGiTreeFinal from './gigiTreeFinal.js'
import * as Fisheye from './fisheye.js'

var scenes = [GiGiTreeFinal, Fisheye];
var currentSceneIndex = 0;
const numScenes = 2;
var currentScene = scenes[currentSceneIndex];
var renderer = null;

var blocker = null;
var instructions = null;
var skipMessageTimer = null;

export function initManager(_renderer) {
  renderer = _renderer;

  instructions = document.getElementById('instructions');
  blocker = document.getElementById( 'blocker' );

  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if(!isMobile) {
    document.getElementById('instructions').style.display = 'block';
  }
  //instructions.style.display = 'none';
  blocker.style.display = 'none';

  currentScene = scenes[currentSceneIndex];
  setTimeout(loadCurrentScene, 2600);
  skipMessageTimer = setTimeout(showSkipMessage, 30000);
}

export function render(renderer, now) {

  if(currentScene.isInitialized())
    currentScene.render(renderer, now);
}

export function resize() {
    currentScene.resize();
}

window.prevScene = function() {
  console.log("Previous Scene");

  currentSceneIndex--;

  if(currentSceneIndex < 0)
    currentSceneIndex = numScenes - 1;

  loadScene(currentSceneIndex);
}


window.nextScene = function() {
  console.log("Next Scene");

  currentSceneIndex++;

  if(currentSceneIndex >= numScenes)
    currentSceneIndex = 0;

  loadScene(currentSceneIndex);
}

window.hideInstructions = function() {
  instructions.style.display = 'none';
  document.getElementById('questionLogo').style.display = 'block';
}

window.showInstructions = function() {
  instructions.style.display = 'block';
  document.getElementById('questionLogo').style.display = 'none';
}

function loadScene(sceneIndex) {

  currentScene.deinit();
  currentScene = scenes[currentSceneIndex];

  //instructions.style.display = 'none';
  blocker.style.display = 'none';

  document.getElementById('loadingscreen').style.display = 'flex';

  document.getElementById('front-ui').style.display = 'none';
  document.getElementById('threejsScrollScene').style.display = 'none';
  document.getElementById('background').style.display = 'none';

  setTimeout(loadCurrentScene, 2600);
  skipMessageTimer = setTimeout(showSkipMessage, 30000);
}

function loadCurrentScene() {
  currentScene.init(renderer, skipMessageTimer);
}

function showSkipMessage() {
  document.getElementById('skipText').style.display = 'block';
  document.getElementById('skipButton').style.display = 'block';
}

document.body.onkeydown = function(e){
  if(e.keyCode == 32){
      currentScene.toggleCamera();
  }
}

