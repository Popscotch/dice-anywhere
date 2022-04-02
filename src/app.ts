import * as THREE from 'three';
import ammo from 'ammo.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Colors } from './colors';
import { Materials } from './materials';
import './style.css';

let Ammo;
let clock = new THREE.Clock();

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let orbitController: OrbitControls;

let physicsWorld;
let worldTransform;
let rigidBodies: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>[] = [];

const margin = 0.05;
const gravityConstant = - 9.8;

ammo().then( AmmoLib => {
    Ammo = AmmoLib
    init();
    animate();
});

function init() {
    initGraphics();
    initPhysics();
    createObjects();
    initInput();
}

function initGraphics() {
    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    window.onresize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    };

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb5c9e8);

    // Camera
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set(5, 5, 5);

    // Orbit Control
    orbitController = new OrbitControls( camera, renderer.domElement );
    orbitController.target.set( 0, 0, 0 );

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
    light.shadow.camera.left = -20;
    light.shadow.camera.right = 20;
    light.shadow.camera.top = 20;
    light.shadow.camera.bottom = -20;
    light.shadow.camera.near = 1;
    scene.add(light);
}

function initPhysics() {
    const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const softBodySolver = new Ammo.btDefaultSoftBodySolver();

    physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
        dispatcher, 
        broadphase, 
        solver, 
        collisionConfiguration, 
        softBodySolver
    );

    physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

    worldTransform = new Ammo.btTransform();
}

function createObjects() {
    // Ground
    let pos = new THREE.Vector3(0, -1, 0);
    let quat = new THREE.Quaternion(0, 0, 0, 1);
    let material = Materials.Standard;
    material.color = Colors.LightGrey;
    const ground = createParalellepiped(40, 1, 40, 0, pos, quat, material);
    ground.castShadow = true;
    ground.receiveShadow = true;

    // Create Cubes
    for(let i = 0; i < 33; i++){
        pos = new THREE.Vector3(0.1 * i, i, 0.1 * i);
        quat = new THREE.Quaternion(10, 5, 0, 1);
        material = Materials.Standard;
        material.color = Colors.Red;
        const cube = createParalellepiped(0.5, 0.5, 0.5, 10, pos, quat, material)
        cube.castShadow = true;
        cube.receiveShadow = true;
    }
}

function createParalellepiped(
    sx: number, 
    sy: number, 
    sz: number, 
    mass: number, 
    pos: THREE.Vector3, 
    quat: THREE.Quaternion, 
    material: THREE.MeshPhysicalMaterial 
) {
    const threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
    const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    shape.setMargin( margin );

    createRigidBody( threeObject, shape, mass, pos, quat );

    return threeObject;
}

function createRigidBody( 
    threeObject: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>, 
    physicsShape, 
    mass: number, 
    pos: THREE.Vector3, 
    quat: THREE.Quaternion
) {
    threeObject.position.copy( pos );
    threeObject.quaternion.copy( quat );

    const transform = new Ammo.btTransform();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    
    const motionState = new Ammo.btDefaultMotionState( transform );
    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    physicsShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    rbInfo.m_friction = 100;
    const body = new Ammo.btRigidBody( rbInfo );

    threeObject.userData.physicsBody = body;

    scene.add( threeObject );

    if ( mass > 0 ) {
        rigidBodies.push( threeObject );
        body.setActivationState( 4 );
    }

    physicsWorld.addRigidBody( body );
    return body;
}

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
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {
        const objThree = rigidBodies[ i ];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if ( ms ) {

            ms.getWorldTransform( worldTransform );
            const p = worldTransform.getOrigin();
            const q = worldTransform.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        }
    }
}

function initInput(  ) {
    window.addEventListener('pointerdown', (event) => {
        const mouseCoords = new THREE.Vector2();
        mouseCoords.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( mouseCoords, camera );

        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4, 1, 1, 1), Materials.Standard);
        cube.castShadow = true;
        cube.receiveShadow = true;
        const cubeShape = new Ammo.btBoxShape( new Ammo.btVector3( 0.2, 0.2, 0.2 ) );
        cubeShape.setMargin( margin );

        const pos = new THREE.Vector3();
        pos.copy( raycaster.ray.direction );
        pos.add( raycaster.ray.origin );

        const quat = new THREE.Quaternion();
        quat.set( 0, 0, 0, 1 );

        const cubeBody = createRigidBody( cube, cubeShape, 35, pos, quat );

        pos.copy( raycaster.ray.direction );
        pos.multiplyScalar( 24 );
        cubeBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    });
}
