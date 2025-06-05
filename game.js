import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PlayerController, ThirdPersonCameraController } from 'rosieControls';
import { createSteampunkWorld } from 'world';
import { setupAtmosphericLighting } from 'lighting';
import { createInteractables, updateInteractables } from 'interactables';
import * as TWEEN from 'tween.js';

const Game = () => {
  const mountRef = useRef(null); // For mounting the Three.js canvas
  const gameRef = useRef(null); // To store Three.js objects for access outside setup
  const [interactedObjects, setInteractedObjects] = useState(0); // Total activated mechanisms for UI
  const [activatedPlatformGears, setActivatedPlatformGears] = useState(0); // Gears for bridge logic
  const [isBridgeExtended, setIsBridgeExtended] = useState(false); // Flag to animate bridge only once
  const [activatedPlinths, setActivatedPlinths] = useState(0); // Plinths for second bridge logic
  const [isBridge2Extended, setIsBridge2Extended] = useState(false); // Flag for the second bridge animation
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    // Create player
    const playerGeometry = new THREE.CapsuleGeometry(0.3, 1.4, 4, 8);
    const playerMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2c5f7c,
      transparent: true,
      opacity: 0.9
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    // Player starts on the central platform of the octagonal arrangement.
    // Values from world.js: octagonOrigin.y = 15, centralPlatformBaseThickness = 2
    // Platform surface Y = 15 (octagonOrigin.y) + 2/2 (half base thickness) = 16
    // Player capsule height = 1.4, so half height = 0.7
    // Player position.y = 16 + 0.7 = 16.7
    player.position.set(0, 16.7, 70);
    player.castShadow = true;
    scene.add(player);

    // Initialize controllers
    const playerController = new PlayerController(player, {
      moveSpeed: 6,
      jumpForce: 12,
      gravity: 25,
      groundLevel: 16.7 // Corresponds to player.position.y when grounded
    });

    const thirdPersonController = new ThirdPersonCameraController(camera, player, renderer.domElement, {
      distance: 8,
      height: 4,
      rotationSpeed: 0.003
    });
    // Create world
    // We'll expect createSteampunkWorld to also return bridge2 in a future step
    const { worldObjects, bridge, bridgePlinths, bridge2 } = createSteampunkWorld(scene);
    setupAtmosphericLighting(scene);
    const interactables = createInteractables(
      scene,
      (count) => setInteractedObjects(count), 
      (gearCount) => setActivatedPlatformGears(gearCount),
      (plinthCount) => setActivatedPlinths(plinthCount),
      bridgePlinths
    );
    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactables.map(i => i.mesh));
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const interactable = interactables.find(i => i.mesh === clickedObject);
        if (interactable && !interactable.activated) {
          interactable.activate();
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const clock = new THREE.Clock();
    
    const animate = () => {
      const deltaTime = clock.getDelta();
      
      // Update controllers
      const cameraRotation = thirdPersonController.update();
      playerController.update(deltaTime, cameraRotation);
      
      // Update interactables and tweens
      updateInteractables(interactables, deltaTime);
      TWEEN.update();
      // Animate totem gears
      if (gameRef.current && gameRef.current.worldObjects) {
        gameRef.current.worldObjects.forEach(obj => {
          obj.traverse(child => {
            if (child.userData && child.userData.isTotemGear) {
              child.rotation.y += child.userData.spinSpeed * deltaTime;
            }
          });
        });
      }
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Store game reference
    gameRef.current = {
      scene,
      camera,
      renderer,
      playerController,
      thirdPersonController,
      worldObjects,
      interactables,
      bridge,
      bridge2 // Store bridge2 reference
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []); // Empty dependency array ensures this runs once on mount
  // useEffect for bridge activation logic
  useEffect(() => {
    const NUM_GEARS_FOR_BRIDGE = 6; // This should match the number of gears on platform 1
    if (
      activatedPlatformGears === NUM_GEARS_FOR_BRIDGE &&
      gameRef.current &&
      gameRef.current.bridge &&
      !isBridgeExtended
    ) {
      setIsBridgeExtended(true); // Ensure animation runs only once
      const bridgeMeshGroup = gameRef.current.bridge;
      bridgeMeshGroup.visible = true;
      bridgeMeshGroup.children.forEach((plank, index) => {
        plank.scale.set(0.01, 1, 1); // Start scaled down on X-axis (assuming length is along X)
        plank.material.transparent = true; // Enable transparency for opacity animation
        plank.material.opacity = 0;     // Start fully transparent
        // Animate scale
        new TWEEN.Tween(plank.scale)
          .to({ x: 1 }, 700) // Grow to full length
          .delay(index * 150) // Stagger appearance of each plank
          .easing(TWEEN.Easing.Elastic.Out)
          .start();
        // Animate opacity
        new TWEEN.Tween(plank.material)
          .to({ opacity: 1 }, 500) // Fade in
          .delay(index * 150)      // Stagger with scale animation
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
      });
    }
  }, [activatedPlatformGears, isBridgeExtended]); // Dependencies for this effect
  // useEffect for second bridge activation logic (triggered by plinths)
  useEffect(() => {
    const NUM_PLINTHS_FOR_BRIDGE2 = 2;
    if (
      activatedPlinths === NUM_PLINTHS_FOR_BRIDGE2 &&
      gameRef.current &&
      gameRef.current.bridge2 && // Ensure bridge2 exists
      !isBridge2Extended // Ensure animation runs only once
    ) {
      setIsBridge2Extended(true);
      const bridge2MeshGroup = gameRef.current.bridge2;
      bridge2MeshGroup.visible = true;
      // Animate planks of the second bridge
      // Assumes bridge2MeshGroup.children are the planks and have their own material instances
      bridge2MeshGroup.children.forEach((plank, index) => {
        if (plank.isMesh && plank.material) { // Check it's a mesh with material
          plank.scale.set(0.01, 1, 1); // Start scaled down (length assumed along local X)
          plank.material.transparent = true;
          plank.material.opacity = 0;
          new TWEEN.Tween(plank.scale)
            .to({ x: 1 }, 700)
            .delay(index * 150)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
          new TWEEN.Tween(plank.material)
            .to({ opacity: 1 }, 500)
            .delay(index * 150)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        }
      });
    }
  }, [activatedPlinths, isBridge2Extended, gameRef]); // Dependencies for this effect
  return React.createElement('div',
    { ref: mountRef, style: { width: '100%', height: '100%' } },
    interactedObjects > 0 && React.createElement('div',
      {
        style: {
          position: 'absolute',
          top: '60px',
          left: '20px',
          color: '#d4af7a',
          fontSize: '14px',
          textShadow: '0 0 5px rgba(255,255,255,0.8)',
          zIndex: 100
        }
      },
      `🔧 Activated: ${interactedObjects} mechanisms`
    )
  );
};

export default Game;