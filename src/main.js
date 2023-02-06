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
const animationClips = {}
const gltfLoader = new GLTFLoader()
const gui = new GUI();
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
function loadModel(asset, folder){
    gltfLoader.load(
        '../assets/models/' + asset.model,
        (gltf) => {
            let mixer = new THREE.AnimationMixer(gltf.scene);
            mixers.push(mixer);

            animationClips['None'] = gltf.animations[0];
            let lastAction = animationClips['None'];
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
                animationClips[clipName] = gltf.animations[0];
                addAnimButton(mixer, lastAction, clipName, folder);
            }
        )
    }
}

function addAnimButton(mixer, lastAction, clipName, folder){
    let button = {
        action: function() { 
            mixer.clipAction(lastAction).fadeOut(0.5)
            mixer.clipAction(animationClips[clipName]).reset().fadeIn(0.5).play()
            lastAction = animationClips[clipName] 
        },
    };
    folder.add(button, 'action').name(clipName);
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