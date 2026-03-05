import { debug } from 'console';
import * as THREE from 'three'

//@ts-expect-error
import scrollVert from './shaders/scrollVertex.glsl';
//@ts-expect-error
import scrollFrag from './shaders/scrollFragment.glsl';
import { Uniform, Vector2 } from 'three';

import { AddTextAnimation, TextAnimationTimeline } from './scrollVideoTextAnimation';
//import e = require('express');

var playbackConst = 500;
var scene = null;
var renderer = null;
var camera = null;
var scrollMaterial = null;
var plane = null;
var video = null;
var videoTexture = null;
var scrollSpaceElement = null;
var textAnimation = new TextAnimationTimeline();

var skipMessageHandle = null;

var currentFrame = 0;
var time = 0;

setTimeout(start, 2600);

function showSkipMessage() {
  document.getElementById('skipText').style.display = 'block';
  document.getElementById('skipButton').style.display = 'block';
}

function start() {

  console.log("start");

  skipMessageHandle = setTimeout(showSkipMessage, 30000);
  //this is the first time
  //if(!localStorage.nofirstVisit) {
    //localStorage.nofirstVisit = true;

    startScroll();
    
    //console.log("first time");

  /*} else {
    
    document.getElementById('loadingscreen').style.display = 'none';
    document.getElementById('skipText').style.display = 'none';
    document.getElementById('skipButton').style.display = 'none';

    clearTimeout(skipMessageHandle);

    var navButtons = document.getElementById('nav-buttons');
    navButtons.style.display = 'flex';

    //console.log("More than one");
  }*/
}

//@ts-expect-error
window.loadScrollVideo = function() {

  var navButtons = document.getElementById('nav-buttons');
  navButtons.style.display = 'none';

  document.getElementById('loadingscreen').style.display = 'flex';

  setTimeout(startScroll, 2600);
  skipMessageHandle = setTimeout(showSkipMessage, 30000);
  //startScroll();
}

function startScroll() {

  AddTextAnimation(textAnimation);

  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  /*if(isMobile) {
    req.open('GET', 'videos/scrollVideoMobile.mp4', true); 
    req.responseType = 'blob';
  } else {
    
  }*/
  
  //isMobile = true;

  if(isMobile) {

    //req.onload = function() {
      //if(this.status === 200) {

        //var videoBlob = this.response;
        //var vid = URL.createObjectURL(videoBlob);

        video = document.createElement("video");
        video.src = 'videos/scrollVideoMobile.mp4';

        var existingNode = document.getElementById('threejsScrollScene');
        existingNode.parentNode.insertBefore(video, existingNode.nextSibling);

        video.id = 'autoplayVideo';

        //video.preload = 'auto';
        video.setAttribute('autobuffer','');
        video.setAttribute('autoplay', '');
        video.setAttribute('controls', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.setAttribute('playsinline','');

        video.addEventListener('loadedmetadata', function() {

          var navButton = document.getElementById('button-container');
          navButton.style.display = 'flex';

          document.getElementById('loadingscreen').style.display = 'none';
          document.getElementById('skipText').style.display = 'none';
          document.getElementById('skipButton').style.display = 'none';

          clearTimeout(skipMessageHandle);

        });

        //URL.revokeObjectURL(videoBlob);
      //}
    //}

  } else {

    initThreeJS();

    var req = new XMLHttpRequest();

    req.open('GET', 'videos/scrollVideo.mp4', true); 
    req.responseType = 'blob';

    //-----------------------------------------------------------
    req.onload = function() {
      if(this.status === 200) {

        var videoBlob = this.response;
        var vid = URL.createObjectURL(videoBlob);

        video = document.createElement("video");
        video.src = vid;

        onVideoLoad();

        initializeVideoRender();

        /*console.log("Loaded Video");
        var loadingElement = document.getElementById('loading');
        loadingElement.style.display = "none";

        var instructElement = document.getElementById('instruction');
        instructElement.style.display = "block";

        var t1 = performance.now();
        var timeTaken = (t1-t0)/1000;
        var loadTimeElement = document.getElementById('loadTime');
        loadTimeElement.textContent = timeTaken.toFixed(2) + " seconds";*/

        URL.revokeObjectURL(videoBlob);
        
        animate();
      }
    }
  }
  //-----------------------------------------------------------


  //-----------------------------------------------------------
  function initThreeJS() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();

    renderer.setSize( window.innerWidth, window.innerHeight );

    var threejsScrollScene = document.getElementById('threejsScrollScene');
    threejsScrollScene.appendChild( renderer.domElement );
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.zindex = '0';

    camera = new THREE.OrthographicCamera(0,window.innerWidth, 0, window.innerHeight, -10.0, 10.0);
    scene.add(camera);
  }
  //----------------------------------------------------------


  //----------------------------------------------------------
  function onVideoLoad() {
    video.preload = 'auto';
    video.setAttribute('autobuffer','');

    scrollSpaceElement = document.getElementById('scrollspace');
    //document.body.appendChild(scrollSpaceElement);
    scrollSpaceElement.style.display = 'block';

    video.addEventListener('loadedmetadata', function() {
      scrollSpaceElement.style.minHeight = video.duration * playbackConst + 1080 + "px";

      var navButton = document.getElementById('button-container');
      navButton.style.display = 'flex';

      document.getElementById('loadingscreen').style.display = 'none';
      document.getElementById('skipText').style.display = 'none';
      document.getElementById('skipButton').style.display = 'none';

      clearTimeout(skipMessageHandle);

      var scrollDownArrow = document.getElementById('scrollDown');
      scrollDownArrow.style.display = 'flex';

    });

    scrollSpaceElement.style.minHeight = video.duration * playbackConst + 1080 + "px";
  }
  //----------------------------------------------------------


  //----------------------------------------------------------
  function initializeVideoRender() {
      videoTexture = new THREE.Texture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;

      scrollMaterial = new THREE.ShaderMaterial({
        uniforms: {
          videoTexture : {value: videoTexture},
          time : {value: time},
          mouse_pos : new Uniform(new Vector2(0.0,0.0)),
          u_resolution : new Uniform(new Vector2(window.innerWidth,window.innerHeight))
        },
        vertexShader: scrollVert,
        fragmentShader: scrollFrag
      });

      //const movieMaterial = new THREE.MeshBasicMaterial({color : new THREE.Color('red')});
      const geometry = new THREE.PlaneGeometry(1920, 1080);
      plane = new THREE.Mesh( geometry, scrollMaterial);
      plane.position.x = window.innerWidth/2;
      plane.position.y = window.innerHeight/2;
      plane.rotateZ(Math.PI);
      plane.rotateY(Math.PI);
      scene.add( plane );
  }
  //----------------------------------------------------------

  //----------------------------------------------------------
  function animate() {
    if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
    {
      currentFrame = lerp(currentFrame, window.pageYOffset/playbackConst, 0.60);
      video.currentTime = currentFrame;
      textAnimation.timeline.seek(currentFrame*1000);

      if ( videoTexture ) 
        videoTexture.needsUpdate = true;
    }

    time += 0.1;
    scrollMaterial.uniforms.time.value = time;

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  }
  //----------------------------------------------------------


  //----------------------------------------------------------
  window.addEventListener( 'resize', onWindowResize, false );
  function onWindowResize(){

    camera.right = window.innerWidth;
    camera.bottom = window.innerHeight;

    if(scrollMaterial != null)
      scrollMaterial.uniforms.u_resolution.value = new Vector2(window.innerWidth,window.innerHeight);

    if(plane != null) {
      plane.position.x = window.innerWidth/2.0;
      plane.position.y = window.innerHeight/2.0;
    }

    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  //----------------------------------------------------------


  //----------------------------------------------------------
  window.addEventListener('mousemove', onmousemove, false);
  function onmousemove(e)  {
    //console.log("mouse location:",e.clientX/window.innerWidth, 1.0-e.clientY/window.innerHeight);
    if(scrollMaterial != null)
      scrollMaterial.uniforms.mouse_pos.value = new Vector2(e.clientX, e.clientY);
  }
  //----------------------------------------------------------


  //----------------------------------------------------------
  req.onerror = function() {
    console.log("Failed to download video");
  }

  req.send();
  //----------------------------------------------------------


  //----------------------------------------------------------
  function lerp(current, target, step) {
    step = step*step*(3-2*step);
    return current*step + target*(1.0 - step);
  }
  //----------------------------------------------------------
}