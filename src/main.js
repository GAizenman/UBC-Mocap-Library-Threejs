import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

// json that holds all of the asset information
import assets from './assets.json' assert { type: 'json' };

let camera, scene, renderer, controls, folder;
let lastActions = [];
let mixers = [];
let animationsReady = false
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

    const gltfLoader = new GLTFLoader()
    const gui = new GUI();
    
    //O(n^2) : make better?
    //models and animations are in seperate gltf files so they can be retargeted 
    for(let x = 0; x < assets.length; x++){
        let clipName = 'None'
        gltfLoader.load(
            '../assets/models/' + assets[x].model,
            (gltf) => {
                mixers.push(new THREE.AnimationMixer(gltf.scene));

                animationClips[clipName] = gltf.animations[0];
                lastActions.push(animationClips[clipName]);
                
                folder = gui.addFolder(assets[x].name); 
                folder.open();
                
                let button = {
                    action: function() { 
                        mixers[x].clipAction(lastActions[x]).fadeOut(0.5)
                        mixers[x].clipAction(animationClips[clipName]).reset().fadeIn(0.5).play()
                        lastActions[x] = animationClips[clipName] 
                    },
                
                };
                folder.add(button, 'action').name(clipName);
    
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        const m = child
                        m.castShadow = true
                    }
                })

                scene.add(gltf.scene);
                
                for(let y = 0; y < assets[x].animations.length; y++){
                    let clipFileName = assets[x].animations[y][0];
                    let clipPath = '../assets/animations/' + clipFileName;
                    let clipName = assets[x].animations[y][1];
                
                    gltfLoader.load(
                        clipPath,
                        (gltf) => {
                            animationClips[clipName] = gltf.animations[0]
                            let button = {
                                action: function() { 
                                    mixers[x].clipAction(lastActions[x]).fadeOut(0.5)
                                    mixers[x].clipAction(animationClips[clipName]).reset().fadeIn(0.5).play()
                                    lastActions[x] = animationClips[clipName] 
                                },
                            
                            };
                            folder.add(button, 'action').name(clipName);
                        }
                    )
                }
            }
        )
        
    }
    animationsReady = true;
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
        for(let j = 0; j < mixers.length; j++){
            mixers[j].update(delta);
        }
        
    }
    render();

    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

animate();