import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { changeAction } from "./loadCharacter.js";
import { addAnimation, changeButtonToPause } from "./controlHandler.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


let canvas, renderer, clock, model, scroller;

const scenes = [];
const mixers = [];
let animations;

export function init(asset) {
    loadActions(asset);

    canvas = document.getElementById("canvas-left");
    scroller = document.getElementById("selector-side");

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xffffff, 0);

    renderer.setPixelRatio(window.devicePixelRatio);

    animate();
}
async function loadActions(asset) {
    // console.log(asset)
    clock = new THREE.Clock();
    const loader = new FBXLoader();
    const fbx = await loader.loadAsync(asset);
    animations = fbx.animations;
    model = fbx;
    console.log(fbx);

    /*
    clock = new THREE.Clock();
    const loader = new FBXLoader();
    const fbx = await loader.loadAsync(asset);
    animations = fbx.animations;
    model = fbx;

    clock = new THREE.Clock();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(asset);
    animations = gltf.animations;
    model = gltf.scene;
    */

    animations.forEach((anim) => {
        let modelclone = clone(model);

        const scene = new THREE.Scene();
        const mixer = new THREE.AnimationMixer(modelclone);

        const content = document.getElementById("content");
        // make a list item
        const element = document.createElement("div");
        element.className = "list-item";

        const sceneElement = document.createElement("div");
        const addButton = document.createElement("button");
        addButton.innerText = "+";
        sceneElement.appendChild(addButton);
        element.appendChild(sceneElement);

        const descriptionElement = document.createElement("div");
        descriptionElement.innerText = anim.name;
        element.appendChild(descriptionElement);

        

        element.addEventListener("click", function(e) {
            var sender = e.target.tagName.toLowerCase();
            if(sender === "button") {
                addAnimation(anim.name);
            }
            else {
                changeButtonToPause();
                changeAction(anim.name);
            }
        });

        // the element that represents the area we want to render the scene
        scene.userData.element = sceneElement;
        content.appendChild(element);

        const camera = new THREE.PerspectiveCamera(50, 1, 1, 500);
        camera.position.set( 50, 185, 250 );
        camera.rotateX(-.35);
        camera.rotateY(.2);

        scene.userData.camera = camera;
        scene.add(modelclone);

        scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));

        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set( 0, 200, 100 );
        scene.add(light);

        mixer.clipAction(anim).play();
        mixers.push(mixer);
        scenes.push(scene);
    });
}

function updateSize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateSize();

    const delta = clock.getDelta();
    for (const mixer of mixers) mixer.update(delta);


    canvas.style.transform = `translateY(${scroller.scrollTop}px)`;

    // background color of whole section
    renderer.setClearColor(0x313338);
    renderer.setScissorTest(false);
    renderer.clear();

    // background color animation selectors
    renderer.setClearColor(0x404249);
    renderer.setScissorTest(true);

    scenes.forEach(function (scene) {
        // get the element that is a place holder for where we want to
        // draw the scene
        const element = scene.userData.element;


        // get its position relative to the page's viewport
        const rect = element.getBoundingClientRect();

        // check if it's offscreen. If so skip it
        //make adjustments for header height
        if (
            rect.bottom < 0 ||
            //change 61 if header size changes
            rect.top > renderer.domElement.clientHeight + 111 ||
            rect.right < 0 ||
            rect.left > renderer.domElement.clientWidth
        ) {
            return; // it's off screen
        }

        // set the viewport
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        //change 61 if header size changes
        const bottom = renderer.domElement.clientHeight - rect.bottom + 111;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        const camera = scene.userData.camera;
        

        renderer.render(scene, camera);
    });
}
