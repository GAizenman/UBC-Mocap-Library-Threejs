import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

// json that holds all of the asset information
import assets from './assets.json' assert { type: 'json' };

let camera, scene, renderer, controls;
let lastActions = [];
let mixers = [];
let animationsReady = false
const actions = {}
const gltfLoader = new GLTFLoader()
const gui = new GUI();
const duration = 3.5;
init();

function init() {
    //scene
    scene = new THREE.Scene();

    //renderer

    renderer = new THREE.WebGLRenderer()
    renderer.shadowMap.enabled = true
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    
    // environment

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 0, 20, 10 );
    scene.add( dirLight );

    const ground = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    ground.rotation.x = - Math.PI / 2;
    scene.add( ground );

    const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );
    
    scene.background = new THREE.Color( 0xe0e0e0 );
    scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );
    
    //camera

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.y = 1.5
    camera.position.z = 2.5

    //controls

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.y = 1
    //O(n^2) : make better?
    //models and animations are in seperate gltf files so they can be retargeted 
    for(let x = 0; x < assets.length; x++){
        let asset = assets[x];
        let folder = gui.addFolder(asset.name);
        loadModel(asset, folder);
    }
    animationsReady = true;
}
function activateAllActions(actions) {

    

}
function loadModel(asset, folder){
    gltfLoader.load(
        '../assets/models/' + asset.model,
        (gltf) => {
            let mixer = new THREE.AnimationMixer(gltf.scene);
            mixers.push(mixer);

            actions['None'] = gltf.animations[0];
            let lastAction = actions['None'];
            lastActions.push(lastAction);
            
            addAnimButton(mixer, lastAction, 'None', folder);

            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    const m = child
                    m.castShadow = true
                }
            });

            scene.add(gltf.scene);
            loadAnimations(asset, folder, mixer, lastAction);
        }
    );
}
function loadAnimations(asset, folder, mixer, lastAction){
    for(let y = 0; y < asset.animations.length; y++){
        let clipFileName = asset.animations[y][0];
        let clipPath = '../assets/animations/' + clipFileName;
        let clipName = asset.animations[y][1];
    
        gltfLoader.load(
            clipPath,
            (gltf) => {
                actions[clipName] = gltf.animations[0];
                actions[clipName].play();
                addAnimButton(mixer, lastAction, clipName, folder);
            }
        )
    }
}

function addAnimButton(mixer, lastAction, clipName, folder){
    let button = {
        action: function() {
            let nextAction = mixer.clipAction(actions[clipName]);
            prepareCrossFade(mixer, lastAction, nextAction, duration );

            // mixer.clipAction(actions[clipName]).reset().fadeIn(0.5).play()
            lastAction = actions[clipName];
        },
    };
    folder.add(button, 'action').name(clipName);
}
function prepareCrossFade( mixer, startAction, endAction, defaultDuration ) {


    // Make sure that we don't go on in singleStepMode, and that all actions are unpaused

    // singleStepMode = false;
    // unPauseAllActions();

    // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
    // else wait until the current action has finished its current loop

    if ( startAction === actions['None'] ) {

        executeCrossFade( startAction, endAction, duration );

    } else {

        synchronizeCrossFade( startAction, endAction, duration );

    }

}


function synchronizeCrossFade( mixer, startAction, endAction, duration ) {

    mixer.addEventListener( 'loop', onLoopFinished );

    function onLoopFinished( event ) {

        if ( event.action === startAction ) {

            mixer.removeEventListener( 'loop', onLoopFinished );

            executeCrossFade( startAction, endAction, duration );

        }

    }

}

function executeCrossFade( startAction, endAction, duration ) {

    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)

    setWeight( endAction, 1 );
    endAction.time = 0;

    // Crossfade with warping - you can also try without warping by setting the third parameter to false

    startAction.crossFadeTo( endAction, duration, true );

}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight( action, weight ) {

    action.enabled = true;
    action.setEffectiveTimeScale( 1 );
    action.setEffectiveWeight( weight );

}


window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

//stats
    
const stats = Stats();
document.body.appendChild(stats.dom);

//clock

const clock = new THREE.Clock();
let delta = 0;


function animate() {
    requestAnimationFrame(animate);

    controls.update();

    delta = clock.getDelta();

    if (animationsReady) {
        for ( const mixer of mixers ) mixer.update( delta );
    }
    render();

    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

animate();