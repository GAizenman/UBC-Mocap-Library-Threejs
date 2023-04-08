import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let canvas, scene, renderer, camera;
let model, skeleton, mixer, clock;

let currentFlowAction, nextFlowAction;
const allActions = [];
let baseActions = {
    Idle: { weight: 1 }
};

let numAnimations;
let singleStepMode, flowChecker = false;
let sizeOfNextStep, flowTracker = 0;
let actionList = [];

export function init(asset) {
    clock = new THREE.Clock();

    // get canvas from html
    canvas = document.getElementById("canvas-right");

    // create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // add lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(3, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    // ground
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshPhongMaterial({
            color: 0x999999,
            depthWrite: false
        })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // load in model and animations
    const loader = new GLTFLoader();
    loader.load(asset, function (gltf) {
        model = gltf.scene;
        scene.add(model);

        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });

        // create skeleton view
        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);

        // create mixer
        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);

        numAnimations = animations.length;

        // activate actions and add them to baseActions
        for (let i = 0; i !== numAnimations; ++i) {
            let clip = animations[i];
            const name = clip.name;

            const action = mixer.clipAction(clip);
            activateAction(action);
            baseActions[name].action = action;
            allActions.push(action);
        }

        animate();
    });

    // create renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;

    // camera
    camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        1,
        100
    );
    camera.position.set(-1, 2, 5);

    // orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();


}

// function to get action ready to play
function activateAction(action) {
    const clip = action.getClip();
    if (!baseActions.hasOwnProperty(clip.name)) {
        baseActions[clip.name] = { weight: 0 };
    }
    const settings = baseActions[clip.name];
    setWeight(action, settings.weight);
    action.play();
}

// function to show/hide the mesh
export function showModel(visibility) {
    model.visible = visibility;
}

// function to show/hide the skeleton
export function showSkeleton(visibility) {
    skeleton.visible = visibility;
}

// function to change speed
export function modifyTimeScale(speed) {
    mixer.timeScale = speed;
}

// function to pause button
export function pauseAllActions() {
    allActions.forEach(function (action) {
        action.paused = true;
    });
}

// function for play button
export function unPauseAllActions() {
    singleStepMode = false;
    allActions.forEach(function (action) {
        action.paused = false;
    });
}

// set single step mode if single step is clicked
export function toSingleStepMode(stepSize) {
    unPauseAllActions();

    singleStepMode = true;
    sizeOfNextStep = stepSize;
}

// function for onClick for selector page
export function changeAction(name) {

    // disable single step mode and unpause actions
    singleStepMode = false;
    unPauseAllActions();
    
    //set all animation weights to 0
    allActions.forEach(function (action) {
        setWeight(action, 0);
   });

   // disable animation flow
    flowChecker = false;

    // Change the animation to selected action
    const endAction = baseActions[name].action;
    executeCrossFade(endAction, endAction, 0);
}

// function to run through animations in the list and blend them
export function executeAnimationFlow(newActionList, duration) {
    
    actionList = newActionList;
    singleStepMode = false;

    // if nothing in the list, return
    if (actionList.length <= 0){
        return;
    }

    // change to the first action
    changeAction(actionList[0]);

    // index tracker to 0 and checker to true
    flowTracker = 0;
    flowChecker = true;

    flowHelper();
    
}

// flow helper function to iterate through animations
function flowHelper() {
    let duration = 0.6;

    //if past the last in the list, loop to the begining
    if (flowTracker == actionList.length - 1){

        // update what actions we are on
        currentFlowAction = baseActions[actionList[flowTracker]].action;
        nextFlowAction = baseActions[actionList[0]].action;

        // set flowTracker
        flowTracker = 0;

        unPauseAllActions();
        synchronizeCrossFade(duration);
    }

    //if there is a next in the list, cross fade and increment tracker
    else if (flowTracker < actionList.length - 1){
        
        // update what actions we are on
        currentFlowAction = baseActions[actionList[flowTracker]].action;
        nextFlowAction = baseActions[actionList[flowTracker+1]].action;

        // increment flowTracker
        flowTracker++;

        unPauseAllActions();
        synchronizeCrossFade(duration);
    }
    
}

function synchronizeCrossFade(duration) {
    
    // create event listener for 1 full loop of the animation
    mixer.addEventListener("loop", onLoopFinished);

    // when event triggered, remove listener and crossfade.
    // then go to next iteration of the flow list
    function onLoopFinished(event) {
        if (event.action === currentFlowAction) {
            mixer.removeEventListener("loop", onLoopFinished);

            if (flowChecker){
                executeCrossFade(currentFlowAction, nextFlowAction, duration);
                flowHelper();
            }
        }
    }
}

function executeCrossFade(startAction, endAction, duration) {
    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)
    if (endAction) {
        setWeight(endAction, 1);
        endAction.time = 0;

        if (startAction) {
            // Crossfade with warping
            startAction.crossFadeTo(endAction, duration, true);
        } else {
            // Fade in
            endAction.fadeIn(duration);
        }
    } else {
        // Fade out
        startAction.fadeOut(duration);
    }
}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))
function setWeight(action, weight) {
    action.reset();
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
}

// window resizer function
function updateSize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        renderer.setViewport( 0, 0, width, height );
        camera.aspect = width/height;
        camera.updateProjectionMatrix();
    }
    
}

function animate() {
    // Render loop
    requestAnimationFrame(animate);
    updateSize();

    for (let i = 0; i !== numAnimations; ++i) {
        const action = allActions[i];
        const clip = action.getClip();
        const settings = baseActions[clip.name];
        settings.weight = action.getEffectiveWeight();
    }

    // Get the time elapsed since the last frame, used for mixer update
    let mixerUpdateDelta = clock.getDelta();

    // If in single step mode, make one step and then do nothing (until the user clicks again)
    if (singleStepMode) {
        mixerUpdateDelta = sizeOfNextStep;
        sizeOfNextStep = 0;
    }
    // Update the animation mixer and render this frame
    mixer.update(mixerUpdateDelta);

    renderer.render(scene, camera);
}


// Download function
export function download() {

    return;

}