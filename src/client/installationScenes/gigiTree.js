import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as oc from 'three-orbit-controls'

import {GUI} from 'three/examples/jsm/libs/dat.gui.module';

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
var myLensDistortionPass = null;
var fx = null;
var projTex = null;
var renderer = null;
var gui = null;

var barrelDistortion = {
    distortion : 0.35,
    focalLength : 0.35
}

var initialized = false;

export function isInitialized() {
    return initialized;
}

export function init(_renderer) {
    renderer = _renderer;

    initThreejs();

    setupProjection();

    loadModel();

    initialized = true;
}

export function deinit() {
    gui.destroy();
}

export function render(renderer, now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    projCamera.updateProjectionMatrix(); 
    projCamera.getWorldDirection(projCameraDirection);

    camera.updateProjectionMatrix();
    controls.update();


    scene.overrideMaterial = depthMaterial;
    renderer.setRenderTarget(projectorShadowTexture);
    renderer.clear();
    renderer.clearDepth();
    renderer.render(scene, projCamera);

    renderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    renderer.setClearColor(new THREE.Color("white"));
    renderer.clear();
    renderer.clearDepth();

    myLensDistortionPass.distortion.set(barrelDistortion.distortion,barrelDistortion.distortion);
    myLensDistortionPass.focalLength.set(barrelDistortion.focalLength, barrelDistortion.focalLength);
    fx.render(deltaTime);
}

export function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    fx.setSize(window.innerWidth,window.innerHeight);
}


//----------------------------------------------------------
function initThreejs() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.x = 5;
    camera.position.y = 2;
    scene.add(camera);

    const OrbitControls = oc(THREE);
    controls  = new OrbitControls(camera, renderer.domElement );

    const LensDistortionPass = LensDistortionPassGen({ THREE, Pass, FullScreenQuad }); 
    myLensDistortionPass = new LensDistortionPass({
    distortion: new THREE.Vector2(0.1, 0.1), // radial distortion coeff
    principalPoint: new THREE.Vector2(0.0, 0.0), // principal point coord
    focalLength: new THREE.Vector2(0.8, 0.8), // focal length
    skew: 0. // skew coeff
    });

    fx = new EffectComposer(renderer);
    fx.setSize(window.innerWidth*2,window.innerHeight*2);

    fx.addPass(new RenderPass(scene, camera));
    fx.addPass(myLensDistortionPass);
    myLensDistortionPass.renderToScreen = true;

    const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );
}
//----------------------------------------------------------

//----------------------------------------------------------
function setupProjection() {
    projCamera = new THREE.PerspectiveCamera(60,1,3.1,100.0);
    projCamera.position.set(2.5,1.9,10.5);
    projCamera.rotation.y = 1.5;
    projCamera.rotation.x = 0.0;
    projCamera.rotation.z = 3.14;
    scene.add(projCamera);

    projCameraDirection = new THREE.Vector3();
    projCamera.getWorldDirection(projCameraDirection);

    gui = new GUI();
    const cameraFolder = gui.addFolder('Projection')
    cameraFolder.add(projCamera, 'fov', 0.0, 180);
    cameraFolder.add(projCamera.rotation, 'y', -3.14,3.14);
    cameraFolder.add(camera, 'fov', 0.0, 180);
    cameraFolder.add(barrelDistortion, 'distortion', 0.0, 1.0, 0.01);
    cameraFolder.add(barrelDistortion, 'focalLength', 0.0, 1.0, 0.01);
    cameraFolder.open();

    projectorShadowTexture = new THREE.WebGLRenderTarget(1024, 1024, {format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: true});
    depthMaterial = new THREE.ShaderMaterial({
        vertexShader : depthVert,
        fragmentShader : depthFrag
    });
    
    projTex = new THREE.TextureLoader().load( 'textures/tree.jpg', function(tex) {
        projCamera.aspect = tex.image.width/tex.image.height;
        projCamera.updateMatrix();
        projCamera.updateProjectionMatrix();
    });
    projTex.wrapS = THREE.ClampToEdgeWrapping;
    projTex.wrapT = THREE.ClampToEdgeWrapping;
    projTex.flipY = false;
}
//----------------------------------------------------------


//----------------------------------------------------------
function loadModel() {
    var modelTex = new THREE.TextureLoader().load('textures/nidSpaceMap2.jpg');
    modelTex.wrapS = THREE.ClampToEdgeWrapping;
    modelTex.wrapT = THREE.ClampToEdgeWrapping;

    const objLoader = new OBJLoader();
    objLoader.load('models/nidSpace.obj', (object)=> {
    
    object.traverse( function( child ) {
    if ( child instanceof THREE.Mesh ) {
        
        var col = child.material.color;

        if(col == undefined)
        col = new Color(15,15,15);

        const material = new THREE.ShaderMaterial({
        uniforms: {
            projectionMatProj : {value: projCamera.projectionMatrix},
            cameraMatProj : {value : projCamera.matrixWorldInverse},
            texture1 : {value: projTex},
            shadowMap : {value: projectorShadowTexture.texture},
            albedoMap : {value: modelTex},
            projPosition : {value: projCamera.position},
            projDirection : {value: projCameraDirection},
            color : {value: new THREE.Vector3(col.r,col.g,col.b)}
        },
        vertexShader: projectorVert,
        fragmentShader: projectorFrag
        });

        child.material = material;
            }
    });

        scene.add(object);
    });
}
//----------------------------------------------------------