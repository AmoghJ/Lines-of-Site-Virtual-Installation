import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as oc from 'three-orbit-controls'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { PointerLockControlsMobile } from '../pointerLockControlsMobile.js';

import {GUI} from 'three/examples/jsm/libs/dat.gui.module';

import {Projection} from '../projectionCamera.js';

import { EffectComposer, Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { LensDistortionPassGen } from 'three-lens-distortion'

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
var projCamera = null;
var projCameraDirection = null;
var controls = null;
var depthMaterial = null;
var projectorShadowTexture = null;
var fx = null;
var myLensDistortionPass = null;
var projTex = null;
var renderer = null;
var gui = null;
var mixer = null;
var clock = null;
var cameraFolder = null;
var scale = 40;

var blocker = null;
var instructions = null;

var animatedControls = null;
var animatedCamera = null;
var animatedView = true;

var cameraPass = null;
var animatedCameraPass = null;

var projector1 = null;

var isMobile = null;

var skipMessage = null;


var barrelDistortion = {
    distortion : 0.8,
    focalLength : 0.5
}

var initialized = false;

var cameraCurve = [
    [2.48992919921875, -3.0919578075408936, 0.0] ,
    [4.48992919921875, -3.0919578075408936, 0.0] ,
    [4.038435935974121, -0.5625264644622803, 0.0] ,
    [2.118119239807129, 1.2058924436569214, 0.0] ,
    [0.1406611204147339, -1.3695014715194702, 0.0] ,
    [1.1145453453063965, -3.4617762565612793, -0.33635735511779785]
];

for (var i = 0; i < cameraCurve.length; i++) {
    var x = cameraCurve[i][0];
    var y = cameraCurve[i][1];
    var z = cameraCurve[i][2];
    cameraCurve[i] = new THREE.Vector3(x, z, -y);
}

var cameraCurvePath =  new THREE.CatmullRomCurve3(cameraCurve);

export function isInitialized() {
    return initialized;
}

export function init(_renderer, _skipMessage) {
    renderer = _renderer;
    skipMessage = _skipMessage;

    instructions = document.getElementById('instructions');
    blocker = document.getElementById( 'blocker');

    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    isMobile = true;
        
    if (isMobile) {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } else {
        instructions.style.display = 'block';
        blocker.style.display = 'none';
    }
    
    initThreejs();
    setupProjection();
    
    loadModel('models/fisheyeAnimatedGLTF.glb', 'textures/gigiTreeSpaceAtlas.png');
    clock = new THREE.Clock();

    const OrbitalControls = new oc(THREE);
    controls = new OrbitalControls( camera, renderer.domElement);
    controls.enabled = false;
    //scene.add(controls.getObject());

    animatedView = true;

    //if(!isMobile) {
        //animatedControls = new PointerLockControls(animatedCamera, renderer.domElement);
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

    initialized = true;

    gui.destroy();
}

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

export function deinit() {
    //gui.destroy();

    animatedControls.removeEventListener('lock', lockCamera);
    animatedControls.removeEventListener('unlock', unlockCamera);

    instructions.style.display = 'none';
    blocker.style.display = 'none';
}

export function render(renderer, now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    //projCamera.updateProjectionMatrix();
    //projCamera.getWorldDirection(projCameraDirection);

    const looptime = 20 * 5000;
	const t = ( Date.now() % looptime ) / looptime;

    if(animatedView) {
        animatedCamera.position.copy(cameraCurvePath.getPointAt(t).multiplyScalar(scale));
        animatedCamera.updateProjectionMatrix();
    } else {
        //camera.updateProjectionMatrix();
        controls.update();
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, -30.0, 80.0);
    }

    /*scene.overrideMaterial = depthMaterial;
    renderer.setRenderTarget(projectorShadowTexture);
    renderer.clear();
    renderer.clearDepth();
    renderer.render(scene, projCamera);*/

    /*renderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    renderer.setClearColor(new THREE.Color("black"));
    renderer.clear();
    renderer.clearDepth();*/

    if(mixer != null)
        mixer.update(deltaTime/10.0);

    //fx.render(deltaTime);
    projector1.render(renderer, scene, fx, deltaTime);
}

export function resize() {

    var isAMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if(isAMobile) {
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

    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = -38;
    camera.position.y = 70;
    camera.position.z = 194;
    scene.add(camera);

    animatedCamera = new THREE.PerspectiveCamera( 130, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(animatedCamera);

    //const OrbitControls = oc(THREE);

    const LensDistortionPass = LensDistortionPassGen({ THREE, Pass, FullScreenQuad }); 
    myLensDistortionPass = new LensDistortionPass({
    distortion: new THREE.Vector2(0.1, 0.1), // radial distortion coeff
    principalPoint: new THREE.Vector2(0.0, 0.0), // principal point coord
    focalLength: new THREE.Vector2(0.8, 0.8), // focal length
    skew: 0. // skew coeff
    });

    myLensDistortionPass.distortion.set(barrelDistortion.distortion,barrelDistortion.distortion);
    myLensDistortionPass.focalLength.set(barrelDistortion.focalLength, barrelDistortion.focalLength);

    fx = new EffectComposer(renderer);
    fx.setSize(window.innerWidth,window.innerHeight);

    cameraPass = new RenderPass(scene, camera);
    animatedCameraPass = new RenderPass(scene, animatedCamera);

    fx.addPass(animatedCameraPass);
    fx.addPass(myLensDistortionPass);

    myLensDistortionPass.renderToScreen = true;

    //const ambientLight = new THREE.AmbientLight(new THREE.Color('white'), 1.0 );
    //scene.add( ambientLight );
}
//----------------------------------------------------------

//----------------------------------------------------------
function setupProjection() {
    /*projCamera = new THREE.PerspectiveCamera(60,1,1.0,100.0);
    projCamera.position.set(2.5,1.9,10.5);
    projCamera.rotation.y = 1.5;
    projCamera.rotation.x = 0.0;
    projCamera.rotation.z = 3.14;
    scene.add(projCamera);*/
    projector1 = new Projection(60, 1, 5.0, 5000.0, 'textures/GGTree', 17);
    scene.add(projector1.projCamera);
    projector1.projCamera.fov = 92;
    projector1.projCamera.rotation.y = 3.14;
    projector1.projCamera.rotation.x = 0;
    projector1.projCamera.rotation.z = 3.14;
    projector1.projCamera.position.x = 2.4;
    projector1.projCamera.position.y = 15.6;
    projector1.projCamera.position.z = -31;

    projCameraDirection = new THREE.Vector3();
    projector1.projCamera.getWorldDirection(projCameraDirection);

    gui = new GUI();

    cameraFolder = gui.addFolder('Projection1')
    cameraFolder.add(projector1.projCamera, 'fov', 0.0, 180);
    cameraFolder.add(projector1.projCamera.rotation, 'y', -3.14,3.14);
    cameraFolder.add(projector1.projCamera.rotation, 'x', -3.14,3.14);
    cameraFolder.add(projector1.projCamera.rotation, 'z', -3.14,3.14);
    cameraFolder.add(projector1.projCamera.position, 'x', -100.0, 100.0);
    cameraFolder.add(projector1.projCamera.position, 'y', -100.0, 100.0);
    cameraFolder.add(projector1.projCamera.position, 'z', -100.0, 100.0);
    cameraFolder.open();

    var animatedCameraFolder = gui.addFolder('Animated Camera');
    animatedCameraFolder.add(animatedCamera, 'fov', 0.0, 180.0).onChange(function(value) {
        animatedCamera.updateMatrix();
        animatedCamera.updateProjectionMatrix();
    });

    var cameraFolder = gui.addFolder('Orbital Camera');
    cameraFolder.add(camera, 'fov', 0.0, 180.0).onChange(function(value) {
        camera.updateMatrix();
        camera.updateProjectionMatrix();
    });

    const distortionFolder = gui.addFolder("Distortion");
    distortionFolder.add( barrelDistortion, 'distortion', 0.0, 1.0 ).onChange( function ( value ) {
        myLensDistortionPass.distortion.set(barrelDistortion.distortion,barrelDistortion.distortion);
	} );

    distortionFolder.add( barrelDistortion, 'focalLength', 0.0, 1.0 ).onChange( function ( value ) {
        myLensDistortionPass.focalLength.set(barrelDistortion.focalLength, barrelDistortion.focalLength);
    } );

    projectorShadowTexture = new THREE.WebGLRenderTarget(1024, 1024, {format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: true});
    depthMaterial = new THREE.ShaderMaterial({
        vertexShader : depthVert,
        fragmentShader : depthFrag
    });
    
    /*projTex = new THREE.TextureLoader().load( 'textures/tree.jpg', function(tex) {
        projCamera.aspect = tex.image.width/tex.image.height;
        projCamera.updateMatrix();
        projCamera.updateProjectionMatrix();
    });
    projTex.wrapS = THREE.ClampToEdgeWrapping;
    projTex.wrapT = THREE.ClampToEdgeWrapping;
    projTex.flipY = false;*/
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

                const material = new THREE.ShaderMaterial({
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

                child.material = material;

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