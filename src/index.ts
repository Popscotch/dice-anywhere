import { 
    AmbientLight,
    AxesHelper, 
    BoxGeometry, 
    Mesh,
    MeshPhysicalMaterial, 
    PerspectiveCamera, 
    PlaneGeometry, 
    PointLight, 
    Scene, 
    WebGLRenderer 
} from 'three';
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls'
import './style.css';

// Y is up
// X is right
// Z is depth.

const renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new Scene();

const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(5, 5, 5);
camera.lookAt(0,0,0);

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

const axesHelper = new AxesHelper( 5 );
axesHelper.position.set(-5,0,-5);
scene.add(axesHelper);

scene.add(makeFloor());

const geometry = new BoxGeometry();
const material = new MeshPhysicalMaterial( {
    color: 0xf00000,
    metalness: 0,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 1.0,
    reflectivity: 1.0,
    envMap: null
} );
const cube = new Mesh( geometry, material );
cube.position.set(0, 1, 0);
scene.add( cube );

const light = new PointLight( 0xffffff, 1, 100 );
light.position.set(0, 2, 0);
scene.add(light)
scene.add( new AmbientLight(0x222222));

function animate() {
    requestAnimationFrame( animate );
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render( scene, camera );
}
animate();

function makeFloor() {
    const geometry = new PlaneGeometry(5, 5, 1, 1);
    const material = new MeshPhysicalMaterial( {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 1.0,
        reflectivity: 1.0,
        envMap: null
    } );
    const plane = new Mesh( geometry, material );
    plane.rotateX(dtr(-90));
    return plane;
}

function dtr(degrees: number) {
    return degrees * (Math.PI / 180);
}
