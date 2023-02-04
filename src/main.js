import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

let camera, scene, renderer, controls;

init();

function init() {
    //scene
    scene = new THREE.Scene();

    //renderer

    renderer = new THREE.WebGLRenderer()
    renderer.shadowMap.enabled = true
    // renderer.outputEncoding = THREE.sRGBEncoding
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
}

const animationClips = {}

let mixer
let lastAction

// const totalBots = 2
// let botsLoaded = 0
let botsReady = false

const gltfLoader = new GLTFLoader()

gltfLoader.load(
    '../assets/models/female_medical_model.glb',
    (gltf) => {
        mixer = new THREE.AnimationMixer(gltf.scene)

        animationClips['default'] = gltf.animations[0]
        lastAction = animationClips['default']
        female_medical_folder.add(fem_medic_buttons, 'default')

        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                const m = child
                m.castShadow = true
            }
        })

        //skeleton visualizer
        // const helper = new THREE.SkeletonHelper(gltf.scene)
        // scene.add(helper)

        scene.add(gltf.scene)
        loadAnimations()
    },
    (xhr) => {
        if (xhr.lengthComputable) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        }
    },
    (error) => {
        console.log(error)
    }
)

function loadAnimations() {
    //add an animation from another file
    gltfLoader.load(
        '../assets/animations/actionClip@administering_cpr.glb',
        (gltf) => {
            console.log('loaded administering_cpr')
            animationClips['administering_cpr'] = gltf.animations[0]

            female_medical_folder.add(fem_medic_buttons, 'administering_cpr')
            botsReady = true

            progressBar.style.display = 'none'

        },
        (xhr) => {
            if (xhr.lengthComputable) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            }
        },
        (error) => {
            console.log(error)
        }
    )
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const fem_medic_buttons = {
    default: function () {
        mixer.clipAction(lastAction).fadeOut(0.5)
        mixer.clipAction(animationClips['default']).reset().fadeIn(0.5).play()
        lastAction = animationClips['default']
    },
    administering_cpr: function () {
        mixer.clipAction(lastAction).fadeOut(0.5)
        mixer.clipAction(animationClips['administering_cpr']).reset().fadeIn(0.5).play()
        lastAction = animationClips['administering_cpr']
    },
}

const gui = new GUI();
const female_medical_folder = gui.addFolder('Female Medic'); 
female_medical_folder.open();

const stats = Stats();
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();
let delta = 0;

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    delta = clock.getDelta();
    if (botsReady) {
        mixer.update(delta);
    }

    render();

    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

animate();