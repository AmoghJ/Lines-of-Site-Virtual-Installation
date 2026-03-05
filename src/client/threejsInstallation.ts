import * as THREE from 'three';
import * as SceneManager from './installationScenes/sceneManager.js';
import * as Typewriter from './typewriter.js';
import * as Stats from 'stats.js';

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
var threejsScrollScene = document.getElementById('threejsScrollScene');
//threejsScrollScene.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight - window.innerHeight*0.1);
renderer.setPixelRatio(1.5);
//renderer.outputEncoding = THREE.LinearEncoding;
//document.body.appendChild( renderer.domElement );

threejsScrollScene.appendChild( renderer.domElement );

THREE.Cache.enabled = true;

SceneManager.initManager(renderer);

var previousOrientation = window.orientation;

var checkOrientation = function(){
    if(window.orientation !== previousOrientation){
        previousOrientation = window.orientation;
    }
};

window.addEventListener("resize", checkOrientation, false);
window.addEventListener("orientationchange", checkOrientation, false);

// (optional) Android doesn't always fire orientationChange on 180 degree turns
setInterval(checkOrientation, 2000);


/*window.goToCuratedContent = function() {
  console.log("Curated Content");
}*/



const animate = function(now) {

  //stats.begin();

  SceneManager.render(renderer, now);

  //stats.end();

  requestAnimationFrame( animate );
}

requestAnimationFrame(animate);



window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {

  SceneManager.resize();

  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if(isMobile) {
    if(window.orientation == 0) {
      renderer.setSize( window.innerWidth, window.innerHeight);
    } else if (window.orientation == 90) {
      renderer.setSize( window.innerHeight, window.innerWidth);
    }
  } else {
    renderer.setSize( window.innerWidth, window.innerHeight - window.innerHeight*0.1);
  }
}


Typewriter.startType();