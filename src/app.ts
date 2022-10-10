import * as THREE from 'three';
import ammo from 'ammo.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Colors } from './colors';
import { Materials } from './materials';
import './style.css';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let Ammo;
let clock = new THREE.Clock();

let _renderer: THREE.WebGLRenderer;
let _scene: THREE.Scene;
let _camera: THREE.PerspectiveCamera;
let _orbitController: OrbitControls;

let _physicsWorld;
let worldTransform;
let rigidBodies: THREE.Mesh<THREE.BufferGeometry, THREE.Material>[] = [];

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
    initScene();
    initInput();
}

function initGraphics() {
    _renderer = createRenderer();
    _scene = createScene();
    _camera = createCamera();
    _orbitController = createOrbitController();
}

function initPhysics() {
    _physicsWorld = createPhysicsWorld();
    worldTransform = new Ammo.btTransform();
}

function initScene() {
    createGroundObject();
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    const deltaTime = clock.getDelta();
    updatePhysics( deltaTime );
    _renderer.render( _scene, _camera );
}

function updatePhysics( deltaTime ) {
    _physicsWorld.stepSimulation( deltaTime, 10 );

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
        raycaster.setFromCamera( mouseCoords, _camera );

        const pos = new THREE.Vector3();
        pos.copy( raycaster.ray.direction );
        pos.add( raycaster.ray.origin );

        let dice = createDiceObject(pos);
        
        let quat = new THREE.Quaternion(0, 0, 0, 1).random();
        let transform = new Ammo.btTransform();
        transform.setOrigin( convertVectorToAmmo(pos) );
        transform.setRotation( convertQuaternionToAmmo(quat) );

        const direction = new THREE.Vector3();
        direction.copy( raycaster.ray.direction );
        direction.multiplyScalar( 12 );

        dice.userData.physicsBody.setMotionState(new Ammo.btDefaultMotionState( transform ))
        dice.userData.physicsBody.setLinearVelocity( convertVectorToAmmo(direction) );
        dice.userData.physicsBody.setAngularVelocity(new Ammo.btVector3( 2, 2 ,2));
    });
}

function createRenderer ( ) {

    let renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild( renderer.domElement );

    window.onresize = function () {
        _camera.aspect = window.innerWidth / window.innerHeight;
        _camera.updateProjectionMatrix();
        _renderer.setSize( window.innerWidth, window.innerHeight );
    };

    return renderer;
}

function createScene ( ) {
    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb5c9e8);

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

    return scene;
}

function createCamera ( ) {
    let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set(5, 5, 5);

    return camera;
}

function createOrbitController ( ) {
    let orbitController = new OrbitControls( _camera, _renderer.domElement );
    orbitController.target.set( 0, 0, 0 );

    return orbitController;
}

function createPhysicsWorld ( ) {
    const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const softBodySolver = new Ammo.btDefaultSoftBodySolver();

    let physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
        dispatcher, 
        broadphase, 
        solver, 
        collisionConfiguration, 
        softBodySolver
    );

    physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
    physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

    return physicsWorld;
}

function createGroundObject () {
    let position = new THREE.Vector3(0, -1, 0);

    let quaternion = new THREE.Quaternion(0, 0, 0, 1);

    let geometry = new THREE.BoxGeometry( 40, 1, 40, 1, 1, 1 );

    let material = Materials.Standard;
    material.color = Colors.LightGrey;

    let mass = 0;

    createObject(position, quaternion, geometry, material, mass);
}

function createDiceObject(position: THREE.Vector3) {
    let size = 0.5;

    let quaternion = new THREE.Quaternion(10, 5, 0, 1); 

    let geometry = new THREE.BoxGeometry(size, size, size);

    new GLTFLoader().load(require('./dice.gltf'), function (gltf) {
        geometry.copy((gltf.scene.getObjectByProperty('type', 'Mesh') as THREE.Mesh).geometry);
        geometry.scale(size / 2, size / 2, size / 2);
    });

    let texture = new THREE.TextureLoader().load(require('./texture_dice.png'));
    texture.mapping = THREE.UVMapping;
    texture.flipY = false;

    let material = Materials.Standard;
    material.map = texture;

    let mass = 10;
    
    return createObject(position, quaternion, geometry!, material, mass);
}

function createObject ( 
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    mass: number
) {
    let object = new THREE.Mesh(geometry, material);

    object.position.copy(position);
    object.quaternion.copy(quaternion);

    object.castShadow = true;
    object.receiveShadow = true;

    object.userData.physicsBody = createRigidBody(object, mass);

    _scene.add( object );

    if ( mass > 0 ) {
        rigidBodies.push( object );
        object.userData.physicsBody.setActivationState( 4 );
    }

    _physicsWorld.addRigidBody( object.userData.physicsBody );

    return object;
}

function createRigidBody (
    object: THREE.Mesh,
    mass: number
) {
    let transform = new Ammo.btTransform();
    transform.setOrigin( convertVectorToAmmo(object.position) );
    transform.setRotation( convertQuaternionToAmmo(object.quaternion) );

    const motionState = new Ammo.btDefaultMotionState( transform );
    const localInertia = new Ammo.btVector3( 0, 0, 0 );

    object.geometry.computeBoundingBox();
    let box = object.geometry.boundingBox!;
    let sizeX = box.max.x - box.min.x;
    let sizeY = box.max.y - box.min.y;
    let sizeZ = box.max.z - box.min.z;    

    let physicsShape = new Ammo.btBoxShape( new Ammo.btVector3( sizeX * 0.5, sizeY * 0.5, sizeZ * 0.5 ) );
    physicsShape.setMargin( margin );
    physicsShape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    rbInfo.m_friction = 100;

    return new Ammo.btRigidBody( rbInfo );
}

function convertVectorToAmmo(vec: THREE.Vector3) {
    return new Ammo.btVector3(vec.x, vec.y, vec.z);
}

function convertQuaternionToAmmo(quat: THREE.Quaternion) {
    return new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w);
}