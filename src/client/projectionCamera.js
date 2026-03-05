import * as THREE from 'three'
import { init } from "./installationScenes/fisheye";

//@ts-expect-error
import projectorVert from './shaders/projectionVertex.glsl';
//@ts-expect-error
import projectorFrag from './shaders/projectionFragment.glsl';
//@ts-expect-error
import depthVert from './shaders/depthVertex.glsl';
//@ts-expect-error
import depthFrag from './shaders/depthFragment.glsl';

export class Projection {
    constructor(fov, aspect, near, far, texturePath, textureNum) {
        this.projCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.projCamera.position.set(2.5,1.9,10.5);
        this.projCamera.rotation.y = 1.5;
        this.projCamera.rotation.x = 0.0;
        this.projCamera.rotation.z = 3.14;

        this.projCameraDirection = new THREE.Vector3();
        this.projCamera.getWorldDirection(this.projCameraDirection);

        this.currentTextureIndex = 0;
        this.maxTexture = textureNum;

        this.projectorShadowTexture = new THREE.WebGLRenderTarget(1024, 1024, {format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: true});
        this.depthMaterial = new THREE.ShaderMaterial({
            vertexShader : depthVert,
            fragmentShader : depthFrag
        });

        //var projCamera = this.projCamera;

        this.projTexArray = [];

        for(var i = 1; i <= this.maxTexture; i++) {
            this.projTexArray.push(new THREE.TextureLoader().load(texturePath + "/0" + i + ".jpg", function(tex) {
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.flipY = true;
            }));
        }

        this.intervalID = setInterval(function(t) {

            if(t.currentTextureIndex + 1 >= textureNum) {

                t.currentTextureIndex = 0;

            } else {

                t.currentTextureIndex++;
            }

        }, 7000, this);
    }

    render(renderer, scene, fx, deltaTime) {
        this.projCamera.updateProjectionMatrix();
        this.projCamera.getWorldDirection(this.projCameraDirection);

        var projCamera = this.projCamera;
        var projCameraDirection = this.projCameraDirection;
        var projTex = this.projTexArray[this.currentTextureIndex];
        var projectorShadowTexture = this.projectorShadowTexture;

        scene.traverse(function(child) {
            if(child.isMesh) {
                child.material.uniforms.projectionMatProj.value = projCamera.projectionMatrix;
                child.material.uniforms.cameraMatProj.value = projCamera.matrixWorldInverse;
                child.material.uniforms.texture1.value = projTex;
                child.material.uniforms.shadowMap.value = projectorShadowTexture.texture;
                child.material.uniforms.projPosition.value = projCamera.position;
                child.material.uniforms.projDirection.value = projCameraDirection;
            }
        });

        /*scene.overrideMaterial = this.depthMaterial;
        renderer.setRenderTarget(this.projectorShadowTexture);
        renderer.clear();
        renderer.clearDepth();
        renderer.render(scene, this.projCamera);

        scene.overrideMaterial = null;*/
        fx.render(deltaTime);
    }
}
