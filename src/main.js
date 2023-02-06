import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

// json that holds all of the asset information
import assets from './assets.json' assert { type: 'json' }

let scene, renderer, camera, stats;
let model, skeleton, mixer, clock;

const crossFadeControls = [];
const weightControls = [];
const actions = [];
const weights = [];

let idleAction, walkAction, runAction;
let idleWeight, walkWeight, runWeight;
let defaultAction, defaultWeight;
let settings;

let singleStepMode = false;
let sizeOfNextStep = 0;
let lastAction;
let folder4, folder5;

init();

function init() {

    // const container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 1, 2, - 3 );
    camera.lookAt( 0, 1, 0 );

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( - 3, 10, - 10 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add( dirLight );

    // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

    // ground

    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    const loader = new GLTFLoader();
    assets.forEach(function(asset){
        loader.load( asset.modelPath, function ( gltf ) {

                model = gltf.scene;
                scene.add( model );

                model.traverse( function ( object ) {

                    if ( object.isMesh ) object.castShadow = true;

                } );

                //

                skeleton = new THREE.SkeletonHelper( model );
                skeleton.visible = false;
                scene.add( skeleton );

                //

                createPanel();

                mixer = new THREE.AnimationMixer( model );
                
                //

                defaultAction = mixer.clipAction( gltf.animations[0] );
                actions.push(defaultAction);
                weights.push(1.0);
                lastAction = defaultAction;
                for(let anim = 0; asset.animationList.length; anim++){
                    let clipPath = asset.animationList[anim][0];
                    let actionName = asset.animationList[anim][1];
                    loader.load(
                        clipPath,
                        (gltf) => {
                            let action = mixer.clipAction( gltf.animations[0] );
                            addDynamicButtons(action, actionName);
                        }
                    )
                }
                activateAllActions();

                animate();

            } );
    })
    

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    document.body.appendChild( renderer.domElement );

    stats = new Stats();
    document.body.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize );

}
function addDynamicButtons(nextAction, actionName){
    let dynamicButtons = {
        'crossFadeCTRL': function() {
            prepareCrossFade( lastAction, nextAction, 1.0 );
            lastAction = nextAction;
        },
        'modify action weight': 0.0,
    };
    crossFadeControls.push(folder4.add(dynamicButtons, 'crossFadeCTRL').name(actionName));
    
    weightControls.push(folder5.add( dynamicButtons, 'modify action weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

        setWeight( nextAction, weight );

    } ).name('modify '+ actionName + ' weight'));
    
    actions.push(nextAction);
    weights.push(0.0);
}

function createPanel() {

    const panel = new GUI( { width: 310 } );

    const folder1 = panel.addFolder( 'Visibility' );
    const folder2 = panel.addFolder( 'Activation/Deactivation' );
    const folder3 = panel.addFolder( 'Pausing/Stepping' );
    folder4 = panel.addFolder( 'Crossfading' );
    folder5 = panel.addFolder( 'Blend Weights' );
    const folder6 = panel.addFolder( 'General Speed' );

    settings = {
        'show model': true,
        'show skeleton': false,
        'deactivate all': deactivateAllActions,
        'activate all': activateAllActions,
        'pause/continue': pauseContinue,
        'make single step': toSingleStepMode,
        'modify step size': 0.05,
        'Default': function () {

            prepareCrossFade( lastAction, defaultAction, 1.0 );

        },
        // 'from idle to walk': function () {

        //     prepareCrossFade( idleAction, walkAction, 0.5 );

        // },
        // 'from walk to run': function () {

        //     prepareCrossFade( walkAction, runAction, 2.5 );

        // },
        // 'from run to walk': function () {

        //     prepareCrossFade( runAction, walkAction, 5.0 );

        // },
        'use default duration': true,
        'set custom duration': 3.5,
        'modify default weight': 1.0,
        'modify time scale': 1.0
    };

    folder1.add( settings, 'show model' ).onChange( showModel );
    folder1.add( settings, 'show skeleton' ).onChange( showSkeleton );
    folder2.add( settings, 'deactivate all' );
    folder2.add( settings, 'activate all' );
    folder3.add( settings, 'pause/continue' );
    folder3.add( settings, 'make single step' );
    folder3.add( settings, 'modify step size', 0.01, 0.1, 0.001 );
    folder4.add( settings, 'use default duration' );
    folder4.add( settings, 'set custom duration', 0, 10, 0.01 );
    crossFadeControls.push( folder4.add( settings, 'Default' ) );
    folder5.add( settings, 'modify default weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

        setWeight( defaultAction, weight );

    } );
    folder6.add( settings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( modifyTimeScale );

    folder1.open();
    folder2.open();
    folder3.open();
    folder4.open();
    folder5.open();
    folder6.open();

}


function showModel( visibility ) {

    model.visible = visibility;

}


function showSkeleton( visibility ) {

    skeleton.visible = visibility;

}


function modifyTimeScale( speed ) {

    mixer.timeScale = speed;

}


function deactivateAllActions() {

    actions.forEach( function ( action ) {

        action.stop();

    } );

}

function activateAllActions() {

    // setWeight( idleAction, settings[ 'modify idle weight' ] );
    // setWeight( walkAction, settings[ 'modify walk weight' ] );
    // setWeight( runAction, settings[ 'modify run weight' ] );
    // actions.forEach( function ( action ) {
    //     action.play();

    // } );
    
    for(let y = 0; y < actions.length; y++){
        setWeight(actions[y], weightControls[y])
        actions[y].play();
    };
   

}

function pauseContinue() {

    if ( singleStepMode ) {

        singleStepMode = false;
        unPauseAllActions();

    } else {

        if ( defaultAction.paused ) {

            unPauseAllActions();

        } else {

            pauseAllActions();

        }

    }

}

function pauseAllActions() {

    actions.forEach( function ( action ) {

        action.paused = true;

    } );

}

function unPauseAllActions() {

    actions.forEach( function ( action ) {

        action.paused = false;

    } );

}

function toSingleStepMode() {

    unPauseAllActions();

    singleStepMode = true;
    sizeOfNextStep = settings[ 'modify step size' ];

}

function prepareCrossFade( startAction, endAction, defaultDuration ) {

    // Switch default / custom crossfade duration (according to the user's choice)

    const duration = setCrossFadeDuration( defaultDuration );

    // Make sure that we don't go on in singleStepMode, and that all actions are unpaused

    singleStepMode = false;
    unPauseAllActions();

    // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
    // else wait until the current action has finished its current loop

    if ( startAction === defaultAction ) {

        executeCrossFade( startAction, endAction, duration );

    } else {

        synchronizeCrossFade( startAction, endAction, duration );

    }

}

function setCrossFadeDuration( defaultDuration ) {

    // Switch default crossfade duration <-> custom crossfade duration

    if ( settings[ 'use default duration' ] ) {

        return defaultDuration;

    } else {

        return settings[ 'set custom duration' ];

    }

}

function synchronizeCrossFade( startAction, endAction, duration ) {

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

// Called by the render loop

function updateWeightSliders() {
    for(let w = 0; w < weights.length; w++){
        weightControls[w] = weights[w];
    }
    // settings[ 'modify idle weight' ] = idleWeight;
    // settings[ 'modify walk weight' ] = walkWeight;
    // settings[ 'modify run weight' ] = runWeight;

}

// Called by the render loop

function updateCrossFadeControls() {

    if ( idleWeight === 1 && walkWeight === 0 && runWeight === 0 ) {

        crossFadeControls[ 0 ].disable();
        crossFadeControls[ 1 ].enable();
        crossFadeControls[ 2 ].disable();
        crossFadeControls[ 3 ].disable();

    }

    if ( idleWeight === 0 && walkWeight === 1 && runWeight === 0 ) {

        crossFadeControls[ 0 ].enable();
        crossFadeControls[ 1 ].disable();
        crossFadeControls[ 2 ].enable();
        crossFadeControls[ 3 ].disable();

    }

    if ( idleWeight === 0 && walkWeight === 0 && runWeight === 1 ) {

        crossFadeControls[ 0 ].disable();
        crossFadeControls[ 1 ].disable();
        crossFadeControls[ 2 ].disable();
        crossFadeControls[ 3 ].enable();

    }

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    // Render loop

    requestAnimationFrame( animate );

    for(let x = 0; x < actions.length; x++){
        weights[x] = actions[x].getEffectiveWeight();
    }
    // idleWeight = idleAction.getEffectiveWeight();
    // walkWeight = walkAction.getEffectiveWeight();
    // runWeight = runAction.getEffectiveWeight();

    // Update the panel values if weights are modified from "outside" (by crossfadings)

    updateWeightSliders();

    // Enable/disable crossfade controls according to current weight values

    // updateCrossFadeControls();

    // Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

    let mixerUpdateDelta = clock.getDelta();

    // If in single step mode, make one step and then do nothing (until the user clicks again)

    if ( singleStepMode ) {

        mixerUpdateDelta = sizeOfNextStep;
        sizeOfNextStep = 0;

    }

    // Update the animation mixer, the stats panel, and render this frame

    mixer.update( mixerUpdateDelta );

    stats.update();

    renderer.render( scene, camera );

}
