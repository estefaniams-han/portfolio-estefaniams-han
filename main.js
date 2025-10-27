import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const scene = new THREE.Scene();
const canvas = document.getElementById('experience-canvas');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


// physics stuff
const GRAVITY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 8;
const MOVE_SPEED = 10;


let character = {
    instance: null,
    isMoving: false,
    spawnPosition: new THREE.Vector3(),
};

let targetRotation = 0;


const colliderOctree = new Octree();
const playerCollider = new Capsule(
    new THREE.Vector3(0, CAPSULE_RADIUS,0),
    new THREE.Vector3(0, CAPSULE_HEIGHT,0),
    CAPSULE_RADIUS
);


let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.0;


const modalContent = {
    Billboard: {
        title: 'lorem ipsum dolor sit amet',
        description: `
            lorem ipsum dolor sit amet, consectetur adipiscing elit.  
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        `,
        link: 'https://example.com'
    },
    Billboard001: {
        title: 'lorem ipsum dolor sit amet',
        description: `
            lorem ipsum dolor sit amet, consectetur adipiscing elit.  
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.  
        `,
        link: 'https://example.com'
    },
    Billboard002: {
        title: 'Voxel Park',
        description: `
            Welcome to Voxel Park 🌳✨ — a 3D voxel-style park created in Blender.  
            This project is a blend of creativity, geometry, and art — combining my love for both tech and design.  
        `,
        link: 'https://github.com/estefaniams-han/portfolio-estefaniams-han',
        img: './img/voxel_park.jpeg'
    },
    Cube011: {
    title: 'About Me',
    description: `
        Hi! I'm Estefanía "Tefi" Marmolejo 💕<br>
        Computer Systems Engineer turned AI Engineer and 3D enthusiast 🎮<br><br>
        
        Passionate about Applied AI, Machine Learning, Cloud Tech, and 3D Design.<br>
        Always learning, building, and blending code with creativity ✨<br><br>

        🌸 I believe technology (especially AI) can make the world better.<br>
        🎶 Guitar lover, creative spirit, and always chasing sparkly things! ✨<br>
        💡 Currently preparing for a Master's in Applied AI.
    `
    },
};

const modal = document.querySelector('.modal');
const modalTitle = document.querySelector('.modal-title');
const modalProjectDescription = document.querySelector('.modal-project-description');
const modalProjectImage = document.querySelector('.modal-image');

const modalExitButton = document.querySelector('.modal-exit-button');
const modalVisitProjectButton = document.querySelector('.modal-project-visit-button');


function showModal(id){
    const content = modalContent[id];
    if(content){
        modalTitle.textContent = content.title;
        modalProjectDescription.innerHTML = content.description;
        
        // Mostrar u ocultar imagen según esté disponible
        if(content.img){
            modalProjectImage.src = content.img;
            modalProjectImage.classList.remove('hidden');
        } else {
            modalProjectImage.src = '';
            modalProjectImage.classList.add('hidden');
        }
        
        if(content.link){
            modalVisitProjectButton.href = content.link;
            modalVisitProjectButton.classList.remove('hidden');
        } else{
            modalVisitProjectButton.classList.add('hidden');
        }

        modal.classList.toggle('hidden');
    }
}

function hideModal(){
    modal.classList.toggle('hidden');
}

let intersectObject = '';
const intersectObjects = [];
const intersectObjectsNames = [
    'Cube', //fox
    'Cube009', // bunny
    'Cube010', // racoon
    'Billboard', // proyect 1
    'Billboard001', // proyect 2
    'Billboard002', // proyect 3
    'Cube011' // about me
];

const loader = new GLTFLoader();

loader.load( './portfolio.glb', function ( glb ) {
    glb.scene.traverse((child) => {
        if (intersectObjectsNames.includes(child.name)) {
            intersectObjects.push(child);
            child.userData.originalScale = child.scale.clone();
            child.userData.baseY = child.position.y;
        }

        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }


        if(child.name === 'Legs003'){
            character.spawnPosition.copy(child.position);
            character.instance = child;
            playerCollider.start.copy(child.position).add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
            playerCollider.end.copy(child.position).add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
        }
        if(child.name === 'Collider'){
            colliderOctree.fromGraphNode(child);
            child.visible = false;
        }
    });
    
    scene.add( glb.scene );
  
    }, undefined, function ( error ) {
    console.error( error );
    } 
);

const sun = new THREE.DirectionalLight( 0xFFFFFF );
sun.castShadow = true;
sun.position.set( -250, 50, 0 );
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -250;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.normalBias = 0.2;
scene.add( sun );


const light = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
scene.add( light );

const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera( 
    -aspect * 50, 
    aspect * 50, 
    50, 
    -50, 
    1, 
    1000
 );


camera.position.x = 30;
camera.position.y = 60;
camera.position.z = 50;

const cameraOffset = new THREE.Vector3(30, 60, 50);


const controls = new OrbitControls( camera, canvas );
controls.enableZoom = false;
controls.update();



function onResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    camera.left = -aspect * 50;
    camera.right = aspect * 50;
    camera.top = 50;
    camera.bottom = -50;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
}

function onClick() {
    if(intersectObject !== '') {
        if (['Cube', 'Cube009', 'Cube010'].includes(intersectObject)) {
            jumpCharacter(intersectObject);
        }else{
            showModal(intersectObject);
        }
        
    }
    
}


function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function respawnCharacter(){
    character.instance.position.copy( character.spawnPosition );

    playerCollider.start.copy(character.spawnPosition).add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
    playerCollider.end.copy(character.spawnPosition).add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));

    playerVelocity.set(0,0,0);
    character.isMoving = false;
}

function playerCollisions(){
    const result = colliderOctree.capsuleIntersect( playerCollider );
    playerOnFloor = false
    
    if( result ){
        playerOnFloor = result.normal.y > 0;
        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

        if( playerOnFloor ){
            character.isMoving = false;
            playerVelocity.x = 0;
            playerVelocity.z = 0;
        }   
    }
}

function updatePlayer(){
    // Placeholder for player update logic (e.g., physics, collisions)
    if(!character.instance) return;

     if (character.instance.position.y < -20){
        respawnCharacter();
        return;
    }

    if(!playerOnFloor){
        playerVelocity.y -= GRAVITY * 0.035;
    }

    playerCollider.translate( playerVelocity .clone().multiplyScalar(0.03));

    playerCollisions();

    character.instance.position.copy( playerCollider.start );
    character.instance.position.y -= CAPSULE_RADIUS;

    let rotationDiff = 
    ((((targetRotation - character.instance.rotation.y + Math.PI) % (2 * Math.PI)) + 
    (2 * Math.PI)) % 
    (2 * Math.PI)) - 
    Math.PI;

    let finalRotation = character.instance.rotation.y + rotationDiff;

    character.instance.rotation.y = THREE.MathUtils.lerp(
        character.instance.rotation.y,
        finalRotation,
        0.1
    );

}

function onKeyDown( event ) {
    if(event.key.toLowerCase() === 'r'){
        respawnCharacter();
        return;
    }


    if (character.isMoving) return;

    switch(event.key.toLowerCase()){
        case 'w':
        case "arrowup":
            playerVelocity.x -= MOVE_SPEED;
            targetRotation = 0;
            break;
        case 's':
        case "arrowdown":
            playerVelocity.x += MOVE_SPEED;
            targetRotation = Math.PI;
            break;
        case 'a':
        case "arrowleft":
            playerVelocity.z += MOVE_SPEED;
            targetRotation = Math.PI / 2;
            break;
        case 'd':
        case "arrowright":
            playerVelocity.z -= MOVE_SPEED;
            targetRotation = -Math.PI / 2;
            break;
        default:
            return; // Quit when this doesn't handle the key event.
    }

    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;

}

function jumpCharacter(meshID){
    const mesh = scene.getObjectByName(meshID);
    if(!mesh) return;

    const originalScale = mesh.userData.originalScale ? mesh.userData.originalScale.clone() : mesh.scale.clone();
    const baseY = (typeof mesh.userData.baseY === 'number') ? mesh.userData.baseY : mesh.position.y;

    const jumpHeight = 2;
    const jumpDuration = 0.5;

    const t1 = gsap.timeline();

    // animar relativas a la escala original
    t1.to(mesh.scale, {
        x: originalScale.x * 1.2,
        y: originalScale.y * 0.8,
        z: originalScale.z * 1.2,
        duration: jumpDuration * 0.2,
        ease: "power2.out"
    });

    t1.to(mesh.scale, {
        x: originalScale.x * 0.8,
        y: originalScale.y * 1.3,
        z: originalScale.z * 0.8,
        duration: jumpDuration * 0.3,
        ease: "power2.out"
    });

    t1.to(mesh.position, {
        y: baseY + jumpHeight,
        duration: jumpDuration * 0.5,
        ease: "power2.out",
    }, "<");

    t1.to(mesh.scale, {
        x: originalScale.x,
        y: originalScale.y,
        z: originalScale.z,
        duration: jumpDuration * 0.3,
        ease: "power1.inOut"
    });

    t1.to(mesh.position, {
        y: baseY,
        duration: jumpDuration * 0.5,
        ease: "bounce.out",
    }, ">");

    t1.to(mesh.scale, {
        x: originalScale.x,
        y: originalScale.y,
        z: originalScale.z,
        duration: jumpDuration * 0.2,
        ease: "elastic.out(1, 0.3)",
    });


}

modalExitButton.addEventListener('click', hideModal);
window.addEventListener('resize', onResize);
window.addEventListener( 'click', onClick);
window.addEventListener( 'pointermove', onPointerMove );
window.addEventListener( 'keydown', onKeyDown);


function animate() {
    updatePlayer();

    if (character.instance) {
        const targetCameraPosition = new THREE.Vector3(
            character.instance.position.x + cameraOffset.x, 
            cameraOffset.y, 
            character.instance.position.z + cameraOffset.z
        );
        camera.position.copy(targetCameraPosition);
        camera.lookAt(character.instance.position.x,
            camera.position.y - 45,
            character.instance.position.z
        );

    }

    raycaster.setFromCamera( pointer, camera );

	const intersects = raycaster.intersectObjects( intersectObjects );

    if(intersects.length > 0){
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
        intersectObject = '';
    }

	for ( let i = 0; i < intersects.length; i ++ ) {
        intersectObject = intersects[0].object.parent.name;

	}


  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );