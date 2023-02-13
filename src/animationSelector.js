import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

let canvas, renderer, clock, model;
const scenes = [];
const mixers = [];
let animations;

init();
animate();

export function init() {
    loadActions();
    
    canvas = document.getElementById("c");
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
}
async function loadActions() {
    clock = new THREE.Clock();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync("../assets/gltf/Female_Default.glb");
    animations = gltf.animations;
    model = gltf.scene;

    animations.forEach((anim) => {
        let modelclone = clone(model);

        const scene = new THREE.Scene();
        const mixer = new THREE.AnimationMixer(modelclone);

        const content = document.getElementById("content");
        // make a list item
        const element = document.createElement("div");
        element.className = "list-item";

        const sceneElement = document.createElement("div");
        element.appendChild(sceneElement);

        const descriptionElement = document.createElement("div");
        descriptionElement.innerText = anim.name;
        element.appendChild(descriptionElement);

        const addButton = document.createButton('button');
        addButton.innerText = '+';
        addButton.addEventListener('click', addButtonClicked);
        element.appendChild(addButton);

        // the element that represents the area we want to render the scene
        scene.userData.element = sceneElement;
        content.appendChild(element);

        const camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
        camera.position.y = 1;
        camera.position.z = 3;

        scene.userData.camera = camera;
        scene.add(modelclone);

        scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));

        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(1, 1, 1);
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

    canvas.style.transform = `translateY(${window.scrollY}px)`;

    renderer.setClearColor(0xffffff);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(0xe0e0e0);
    renderer.setScissorTest(true);

    scenes.forEach(function (scene) {
        // get the element that is a place holder for where we want to
        // draw the scene
        const element = scene.userData.element;

        // get its position relative to the page's viewport
        const rect = element.getBoundingClientRect();

        // check if it's offscreen. If so skip it
        if (
            rect.bottom < 0 ||
            rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 ||
            rect.left > renderer.domElement.clientWidth
        ) {
            return; // it's off screen
        }

        // set the viewport
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        const camera = scene.userData.camera;

        renderer.render(scene, camera);
    });
}
