import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Colors } from './colors';
import { Materials } from './materials';
import './style.css';

let camera: THREE.Camera | THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let controls;
let cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>;

init();
animate();

function init() {
    initGraphics();
    createObjects();
}

function initGraphics() {
    // Camera
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set(5, 5, 5);
    camera.lookAt(0,0,0);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb5c9e8);

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    // Orbit Control
    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0.5, 0 );
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;

    // Ambient Light
    scene.add( new THREE.AmbientLight(Colors.DarkGrey));

    // Light
    const light = new THREE.PointLight( Colors.White, 1, 100);
    light.position.set(1, 4, -1);
    light.castShadow = true;
    scene.add(light);
}

function createObjects() {
    // Floor Plane
    const plane = new THREE.Mesh( new THREE.PlaneGeometry(5, 5, 1, 1), Materials.Standard());
    plane.receiveShadow = true;
    plane.castShadow = true;
    plane.rotateX(dtr(-90));
    scene.add(plane);

    cube = new THREE.Mesh( new THREE.BoxGeometry(), Materials.Standard() );
    cube.material.color = Colors.Blue
    cube.position.set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
}

// Animate Scene
function animate() {
    requestAnimationFrame( animate );
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render( scene, camera );
}

// Degree's to radians
function dtr(degrees: number) {
    return degrees * (Math.PI / 180);
}
