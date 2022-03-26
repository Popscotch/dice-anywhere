import * as THREE from 'three';
import ammo from 'ammo.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Colors } from './colors';
import { Materials } from './materials';
import './style.css';

let camera: THREE.Camera | THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let controls;
let cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>;
const clock = new THREE.Clock();

let Ammo;
// Physics variables
const gravityConstant = - 9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let softBodySolver;
let physicsWorld;
let rigidBodies: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>[] = [];
const margin = 0.05;
let transformAux1;

start()

async function start() {
    ammo().then( AmmoLib => {
        Ammo = AmmoLib
        init();
        animate();
    });
}

async function init() {
    initGraphics();
    initPhysics();
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

    // Sun
    const light = new THREE.DirectionalLight(Colors.White, 1);
    light.position.set( -10, 20, 10 );
    light.castShadow = true;
    light.shadow.mapSize.width = 2048; 
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.near = 1;
    scene.add(light);
}

function initPhysics() {
    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    softBodySolver = new Ammo.btDefaultSoftBodySolver();
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
    physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

    transformAux1 = new Ammo.btTransform();
}

function createObjects() {

    let pos = new THREE.Vector3();
    let quat = new THREE.Quaternion();

    // Ground
    pos.set(0,-1,0);
    quat.set(0,0,0,1);
    let material = Materials.Standard();
    material.color = Colors.LightGrey;
    const ground = createParalellepiped(40, 1, 40, 0, pos, quat, material);
    ground.castShadow = true;
    ground.receiveShadow = true;

    // CUBES!!!
    for(let i = 0; i < 20; i++){
        pos.set( 0, i, 0 );
        quat.set( 10, 5, 0, 1 );
        material = Materials.Standard();
        material.color = Colors.Red;
        cube = createParalellepiped(0.5, 0.5, 0.5, 10, pos, quat, material)
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        scene.add(cube);
    }
}

function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

    const threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
    const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    shape.setMargin( margin );

    createRigidBody( threeObject, shape, mass, pos, quat );

    return threeObject;

}

function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

    threeObject.position.copy( pos );
    threeObject.quaternion.copy( quat );

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    physicsShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    threeObject.userData.physicsBody = body;

    scene.add( threeObject );

    if ( mass > 0 ) {

        rigidBodies.push( threeObject );

        // Disable deactivation
        body.setActivationState( 4 );

    }

    physicsWorld.addRigidBody( body );

}

// Animate Scene
function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    const deltaTime = clock.getDelta();

    updatePhysics( deltaTime );

    renderer.render( scene, camera );
}

function updatePhysics( deltaTime ) {

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {
        const objThree = rigidBodies[ i ];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if ( ms ) {

            ms.getWorldTransform( transformAux1 );
            const p = transformAux1.getOrigin();
            const q = transformAux1.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        }
    }
}

// Degree's to radians
function dtr(degrees: number) {
    return degrees * (Math.PI / 180);
}
