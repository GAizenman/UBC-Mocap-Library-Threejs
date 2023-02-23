import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let canvas, scene, renderer, camera, stats;
let model, skeleton, mixer, clock;

const crossFadeControls = [];

let currentBaseAction = "Idle";
const allActions = [];
let baseActions = {
    Idle: { weight: 1 }
};

let panelSettings, numAnimations;
let singleStepMode = false;
let sizeOfNextStep = 0;

export function init(asset) {
    clock = new THREE.Clock();

    canvas = document.getElementById("canvas-right");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

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

    const loader = new GLTFLoader();
    loader.load(asset, function (gltf) {
        model = gltf.scene;
        scene.add(model);

        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });

        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);

        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);

        numAnimations = animations.length;

        for (let i = 0; i !== numAnimations; ++i) {
            let clip = animations[i];
            const name = clip.name;

            const action = mixer.clipAction(clip);
            activateAction(action);
            baseActions[name].action = action;
            allActions.push(action);
        }

        createPanel();

        animate();
    });

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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();

    stats = new Stats();
    document.body.appendChild(stats.dom);

}

function createPanel() {
    const panel = new GUI({ width: 250 });

    const folder1 = panel.addFolder("Visibility");
    const folder2 = panel.addFolder("Pausing/Stepping");
    const folder3 = panel.addFolder("Base Actions");
    const folder4 = panel.addFolder("General Speed");

    panelSettings = {
        "show model": true,
        "show skeleton": false,
        "pause/continue": pauseContinue,
        "make single step": toSingleStepMode,
        "modify step size": 0.05,
        "use default duration": true,
        "set custom duration": 0.6,
        "modify time scale": 1.0
    };
    folder1.add(panelSettings, "show model").onChange(showModel);
    folder1.add(panelSettings, "show skeleton").onChange(showSkeleton);
    folder2.add(panelSettings, "pause/continue");
    folder2.add(panelSettings, "make single step");
    folder2.add(panelSettings, "modify step size", 0.01, 0.1, 0.001);
    folder3.add(panelSettings, "use default duration");
    folder3.add(panelSettings, "set custom duration", 0, 10, 0.01);

    const baseNames = ["None", ...Object.keys(baseActions)];

    for (let i = 0, l = baseNames.length; i !== l; ++i) {
        const name = baseNames[i];
        const settings = baseActions[name];
        panelSettings[name] = function () {
            const currentSettings = baseActions[currentBaseAction];
            const currentAction = currentSettings
                ? currentSettings.action
                : null;
            const action = settings ? settings.action : null;

            if (currentAction !== action) {
                prepareCrossFade(currentAction, action, 0.6);
            }
        };

        crossFadeControls.push(folder3.add(panelSettings, name));
    }

    folder4
        .add(panelSettings, "modify time scale", 0.0, 1.5, 0.01)
        .onChange(modifyTimeScale);

    folder1.open();
    folder2.open();
    folder3.open();
    folder4.open();

}

function activateAction(action) {
    const clip = action.getClip();
    if (!baseActions.hasOwnProperty(clip.name)) {
        baseActions[clip.name] = { weight: 0 };
    }
    const settings = baseActions[clip.name];
    setWeight(action, settings.weight);
    action.play();
}

function showModel(visibility) {
    model.visible = visibility;
}

function showSkeleton(visibility) {
    skeleton.visible = visibility;
}

function modifyTimeScale(speed) {
    mixer.timeScale = speed;
}
function pauseContinue() {
    if (singleStepMode) {
        singleStepMode = false;
        unPauseAllActions();
    } else {
        if (baseActions[currentBaseAction].action.paused) {
            unPauseAllActions();
        } else {
            pauseAllActions();
        }
    }
}
function pauseAllActions() {
    allActions.forEach(function (action) {
        action.paused = true;
    });
}

function unPauseAllActions() {
    allActions.forEach(function (action) {
        action.paused = false;
    });
}
function toSingleStepMode() {
    unPauseAllActions();

    singleStepMode = true;
    sizeOfNextStep = panelSettings["modify step size"];
}

function prepareCrossFade(startAction, endAction, defaultDuration) {
    // Switch default / custom crossfade duration (according to the user's choice)
    const duration = setCrossFadeDuration(defaultDuration);

    // Make sure that we don't go on in singleStepMode, and that all actions are unpaused
    singleStepMode = false;
    unPauseAllActions();

    // If the current action is 'Idle', execute the crossfade immediately;
    // else wait until the current action has finished its current loop
    if (currentBaseAction === "Idle" || !startAction || !endAction) {
        executeCrossFade(startAction, endAction, duration);
    } else {
        synchronizeCrossFade(startAction, endAction, duration);
    }

    // Update control colors
    if (endAction) {
        const clip = endAction.getClip();
        currentBaseAction = clip.name;
    } else {
        currentBaseAction = "None";
    }

    // crossFadeControls.forEach(function (control) {
    //     const name = control.property;

    //     if (name === currentBaseAction) {
    //         control.setActive();
    //     } else {
    //         control.setInactive();
    //     }
    // });
}
function setCrossFadeDuration(defaultDuration) {
    // Switch default crossfade duration <-> custom crossfade duration
    if (panelSettings["use default duration"]) {
        return defaultDuration;
    } else {
        return panelSettings["set custom duration"];
    }
}
function synchronizeCrossFade(startAction, endAction, duration) {
    mixer.addEventListener("loop", onLoopFinished);

    function onLoopFinished(event) {
        if (event.action === startAction) {
            mixer.removeEventListener("loop", onLoopFinished);

            executeCrossFade(startAction, endAction, duration);
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
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
}

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
    // Update the animation mixer, the stats panel, and render this frame
    mixer.update(mixerUpdateDelta);

    stats.update();

    renderer.render(scene, camera);
}
