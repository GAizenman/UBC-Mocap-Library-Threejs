import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


let canvas, renderer;
let mixer, model;
let allActions = [];
const scenes = [];
let animations;

init();
animate();

export function init() {
    canvas = document.getElementById("c");
    
    // console.log(allActions);
    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 12, 8),
        new THREE.DodecahedronGeometry(0.5),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 12)
    ];

    const content = document.getElementById("content");
    const loader = new GLTFLoader();
    

    loader.load("../assets/gltf/Female_Default.glb", function (gltf) {
        model = gltf.scene;
        
        animations = gltf.animations;
        
        console.log(animations)
        
        animations.forEach( function(anim) {
            const scene = new THREE.Scene();
            mixer = new THREE.AnimationMixer(model);
            
            // make a list item
            const element = document.createElement("div");
            element.className = "list-item";
    
            const sceneElement = document.createElement("div");
            element.appendChild(sceneElement);
    
            const descriptionElement = document.createElement("div");
            descriptionElement.innerText = anim.name;
            element.appendChild(descriptionElement);
    
            // the element that represents the area we want to render the scene
            scene.userData.element = sceneElement;
            content.appendChild(element);
    
            const camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
            camera.position.z = 2;
            scene.userData.camera = camera;
            scene.add(model)
            
            let action = mixer.clipAction(anim);
            action.fadeIn();
            action.play();
    
            scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));
    
            const light = new THREE.DirectionalLight(0xffffff, 0.5);
            light.position.set(1, 1, 1);
            scene.add(light);
    
            scenes.push(scene);
        });

    });

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
}

function updateSize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
    }
}

function animate() {
    render();
    requestAnimationFrame(animate);
}

function render() {
    updateSize();

    canvas.style.transform = `translateY(${window.scrollY}px)`;

    renderer.setClearColor(0xffffff);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(0xe0e0e0);
    renderer.setScissorTest(true);

    scenes.forEach(function (scene) {
        // so something moves
        // scene.children[0].rotation.y = Date.now() * 0.001;

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

        //camera.aspect = width / height; // not changing in this example
        //camera.updateProjectionMatrix();

        //scene.userData.controls.update();

        renderer.render(scene, camera);
    });
}
