import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

import assets from './assets.json' assert { type: 'json' };
console.log(assets);

let camera, scene, renderer, controls;
let mixer, lastAction, folder;
let botsReady = false
const animationClips = {}
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

    

    // const totalBots = 2
    // let botsLoaded = 0
    

    const gltfLoader = new GLTFLoader()
    const gui = new GUI();
    
    //O(n^2) : make better?

    //models and animations are in seperate gltf files so they can be retargeted 
    for(let x = 0; x < assets.length; x++){
        gltfLoader.load(
            '../assets/models/' + assets[x].model,
            (gltf) => {
                mixer = new THREE.AnimationMixer(gltf.scene);
    
                animationClips['default'] = gltf.animations[0];
                lastAction = animationClips['default'];
                
                folder = gui.addFolder(assets[x].name); 
                folder.open();
                
                folder.add('default',
                    function() {
                        mixer.clipAction(lastAction).fadeOut(0.5)
                        mixer.clipAction(animationClips['default']).reset().fadeIn(0.5).play()
                        lastAction = animationClips['default']
                    }
                );
    
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        const m = child
                        m.castShadow = true
                    }
                })

                scene.add(gltf.scene);
                
                for(let y = 0; y < assets[x].animations.length; y++){
                    let clipName = assets[x].animations[y];
                    
                    let clipPath = '../assets/animations/' + clipName;
                    gltfLoader.load(
                        clipPath,
                        (gltf) => {
                            console.log('loaded ' + clipName)
                            animationClips[clipName] = gltf.animations[0]
                
                            folder.add(clipName,
                                function() {
                                    mixer.clipAction(lastAction).fadeOut(0.5)
                                    mixer.clipAction(animationClips[clipName]).reset().fadeIn(0.5).play()
                                    lastAction = animationClips[clipName]
                                }
                            );
                        },
                        (xhr) => {
                            if (xhr.lengthComputable) {
                                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' + clipName);
                            }
                        },
                        (error) => {
                            console.log(error)
                        }
                    )
                }
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
    botsReady = true;
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
function crossFade(clip) {
    mixer.clipAction(lastAction).fadeOut(0.5)
    mixer.clipAction(animationClips[clip]).reset().fadeIn(0.5).play()
    lastAction = animationClips[clip]
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