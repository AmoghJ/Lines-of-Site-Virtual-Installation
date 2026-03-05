import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as oc from 'three-orbit-controls'

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { PointerLockControlsMobile } from '../pointerLockControlsMobile.js';

import {GUI} from 'three/examples/jsm/libs/dat.gui.module';

import { EffectComposer, Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import {FilmPass} from 'three/examples/jsm/postprocessing/FilmPass'

import {Projection} from '../projectionCamera.js';

//@ts-expect-error
import projectorVert from '../shaders/projectionVertex.glsl';
//@ts-expect-error
import projectorFrag from '../shaders/projectionFragment.glsl';
//@ts-expect-error
import depthVert from '../shaders/depthVertex.glsl';
//@ts-expect-error
import depthFrag from '../shaders/depthFragment.glsl';

var scene = null;
var camera = null;
var then = 0;
var controls = null;
var fx = null;
var bloomPass = null;
var renderer = null;
var gui = null;
var projectorMaterial = null;
var mixer = null;

var projector1 = null;

var skipMessage = null;

var animatedControls = null;
var animatedCamera = null;
var animatedView = true;

var cameraPass = null;
var animatedCameraPass = null;

var bloomParams = {
    exposure : 1,
    strength: 0.5,
	threshold: 0.996,
	radius: 1.0
}

var scale = 1.0;

var cameraCurve = [
    [-58.85067367553711, -143.70318603515625, -0.8807566165924072] ,
[-0.5424919128417969, -128.38278198242188, 12.738374710083008] ,
[-0.5424919128417969, -90.57848358154297, 20.51996612548828] ,
[-67.02599334716797, -78.84036254882812, 1.2002718448638916] ,
[-80.35120391845703, -110.29950714111328, -15.007401466369629] ,
];

for (var i = 0; i < cameraCurve.length; i++) {
    var x = cameraCurve[i][0];
    var y = cameraCurve[i][1];
    var z = cameraCurve[i][2];
    cameraCurve[i] = new THREE.Vector3(x, z, -y);
}

var cameraCurvePath =  new THREE.CatmullRomCurve3(cameraCurve);

var initialized = false;

export function isInitialized() {
    return initialized;
}

export function init(_renderer, _skipMessage) {
    renderer = _renderer;
    skipMessage = _skipMessage;

    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    //isMobile = true;
        
    if (isMobile) {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    }
    
    initThreejs();
    setupProjection();
    
    loadModel('models/gigiTreeSpaceGLTF.glb', 'textures/gigiTreeSpaceAtlas.png');

    initialized = true;

    gui.destroy();
}

export function deinit() {
    //gui.destroy();

    animatedControls.removeEventListener('lock', lockCamera);
    animatedControls.removeEventListener('unlock', unlockCamera);
}

export function render(renderer, now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    const looptime = 20 * 5000;
	const t = ( Date.now() % looptime ) / looptime;

    //camera.updateProjectionMatrix();
    if(animatedView) {
        animatedCamera.position.copy(cameraCurvePath.getPointAt(t).multiplyScalar(scale));
        animatedCamera.updateProjectionMatrix();
    } else {
        //camera.updateProjectionMatrix();
        controls.update();
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, -30.0, 80.0);
    }

    /*renderer.setRenderTarget(null);
    renderer.setClearColor(new THREE.Color("black"));
    renderer.clear();
    renderer.clearDepth();*/

    if(mixer != null)
       mixer.update(deltaTime);

    projector1.render(renderer, scene, fx, deltaTime);
}

export function resize() {

    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if(isMobile) {
        if(window.orientation == 0) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            fx.setSize(window.innerWidth,window.innerHeight);
        } else if (window.orientation == 90) {
            camera.aspect = window.innerHeight / window.innerWidth;
            camera.updateProjectionMatrix();
            fx.setSize(window.innerHeight,window.innerWidth);
        }
    } else {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        fx.setSize(window.innerWidth,window.innerHeight);
    }
}

//----------------------------------------------------------
function initThreejs() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = -31;
    camera.position.y = 0;
    camera.position.z = 159;
    scene.add(camera);

    animatedCamera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(animatedCamera);

    const OrbitControls = oc(THREE);
    controls  = new OrbitControls(camera, renderer.domElement );
    controls.enabled = false;

    animatedView = true;

    //var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    //if(!isMobile) {
      //  animatedControls = new PointerLockControls(animatedCamera, renderer.domElement);
    //} else {
        animatedControls = new PointerLockControlsMobile(animatedCamera, renderer.domElement);
    //}

    scene.add(animatedControls.getObject());

    blocker.addEventListener('click', function () {
		//controls.lock();
        animatedControls.lock();
	});

    animatedControls.addEventListener('lock', lockCamera);
    animatedControls.addEventListener('unlock', unlockCamera);

    controls.target.x = -31;
    controls.target.y = 0;
    controls.target.z = 27;

    bloomPass = new UnrealBloomPass(new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85);
    bloomPass.threshold = bloomParams.threshold;
    bloomPass.strength = bloomParams.strength;
    bloomPass.radius = bloomParams.radius;

    fx = new EffectComposer(renderer);
    fx.setSize(window.innerWidth,window.innerHeight);

    cameraPass = new RenderPass(scene, camera);
    animatedCameraPass = new RenderPass(scene, animatedCamera);

    fx.addPass(animatedCameraPass);
    fx.addPass(bloomPass);

    bloomPass.renderToScreen = true;
}
//----------------------------------------------------------

function lockCamera() {
    console.log("called lock");
    instructions.style.display = 'none';
    blocker.style.display = 'none';
}

function unlockCamera(){

    if(animatedView) {
        instructions.style.display = 'block';
        blocker.style.display = '';
    }
}

//----------------------------------------------------------
function setupProjection() {

    projector1 = new Projection(60, 1, 5.0, 2000.0, 'textures/GGTree', 17);
    scene.add(projector1.projCamera);
    projector1.projCamera.fov = 37;
    projector1.projCamera.rotation.y = -1.6;
    projector1.projCamera.rotation.x = -3.14;
    projector1.projCamera.rotation.z = 3.14;
    projector1.projCamera.position.x = -59.4;
    projector1.projCamera.position.y = 22.2;
    projector1.projCamera.position.z = 75;

    gui = new GUI();

    const folder = gui.addFolder("Camera");
    folder.add(camera, 'fov', 0.0, 180).onChange( function ( value ) {
        camera.updateProjectionMatrix();
});

    folder.add(controls.target, 'x', -200,200);
    folder.add(controls.target, 'y', -200,200);
    folder.add(controls.target, 'z', -200,200);
    folder.open();

    const cameraFolder = gui.addFolder('Projection1')
    cameraFolder.add(projector1.projCamera, 'fov', 0.0, 180);
    cameraFolder.add(projector1.projCamera.rotation, 'y', -3.14,3.14);
    cameraFolder.add(projector1.projCamera.rotation, 'x', -3.14,3.14);
    cameraFolder.add(projector1.projCamera.rotation, 'z', -3.14,3.14);
    cameraFolder.add(projector1.projCamera.position, 'x', -100.0, 100.0);
    cameraFolder.add(projector1.projCamera.position, 'y', -100.0, 100.0);
    cameraFolder.add(projector1.projCamera.position, 'z', -100.0, 100.0);
    cameraFolder.open();

    const bloomFolder = gui.addFolder("Bloom");
    bloomFolder.add( bloomParams, 'exposure', 0.1, 2 ).onChange( function ( value ) {
				renderer.toneMappingExposure = Math.pow( value, 4.0 );
	} );

    bloomFolder.add( bloomParams, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value );
    } );

    bloomFolder.add( bloomParams, 'strength', 0.0, 10.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value );
    } );

    bloomFolder.add( bloomParams, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        bloomPass.radius = Number( value );
    } );
}
//----------------------------------------------------------

//----------------------------------------------------------
function loadModel(objPath, texturePath) {

    const loader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'js/libs/draco/gltf/');
    loader.setDRACOLoader( dracoLoader );

    loader.load(objPath,function(gltf) {

        gltf.scene.traverse(function (child) {
            if (child.isMesh) {

                var albedoTexture = child.material.map;

                var col = child.material.color;

                if(col == undefined)
                col = new Color(15,15,15);

                projectorMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        projectionMatProj : {value: projector1.projCamera.projectionMatrix},
                        cameraMatProj : {value : projector1.projCamera.matrixWorldInverse},
                        texture1 : {value: projector1.projTex},
                        shadowMap : {value: projector1.projectorShadowTexture.texture},
                        albedoMap : {value: albedoTexture},
                        projPosition : {value: projector1.projCamera.position},
                        projDirection : {value: projector1.projCameraDirection},
                        color : {value: new THREE.Vector3(col.r,col.g,col.b)}
                    },
                    vertexShader: projectorVert,
                    fragmentShader: projectorFrag,
                    side: THREE.DoubleSide
                });

                child.material = projectorMaterial;
            }
        });

        gltf.scene.scale.multiplyScalar(scale);

        mixer = new THREE.AnimationMixer(gltf.scene);

        for(var i = 0; i < gltf.animations.length; i++) {
            mixer.clipAction( gltf.animations[ i ] ).play();
        }

        scene.add(gltf.scene);

        document.getElementById('loadingscreen').style.display = 'none';
        document.getElementById('skipText').style.display = 'none';
        document.getElementById('skipButton').style.display = 'none';

        document.getElementById('front-ui').style.display = 'block';
        document.getElementById('threejsScrollScene').style.display = 'block';
        document.getElementById('background').style.display = 'block';

        clearTimeout(skipMessage);
    });
}
//----------------------------------------------------------

export function toggleCamera() {

    if(!animatedView) {

        fx.removePass(cameraPass);
        fx.insertPass(animatedCameraPass, 0);

        controls.enabled = false;

        animatedControls.lock();
        
        /*if (isMobile) {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        } else {
            blocker.style.display = 'block';
            instructions.style.display = '';
        }*/

        animatedView = true;
    } else {
       
        fx.removePass(animatedCameraPass);
        fx.insertPass(cameraPass, 0);

        animatedControls.unlock();

        controls.enabled = true;

        /*blocker.style.display = 'none';
        instructions.style.display = 'none';*/

        animatedView = false;
    }
}