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
  const [activatedPlatformGears, setActivatedPlatformGears] = useState(0); // Gears for first bridge
  const [activatedPlinths, setActivatedPlinths] = useState(0); // Total plinth activations
  const [extendedBridges, setExtendedBridges] = useState([]); // Track which bridges have been extended
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
    // Create world with sequential bridges
    const { worldObjects, bridges, bridgePlinths } = createSteampunkWorld(scene);
    setExtendedBridges(Array(bridges.length).fill(false));
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
      bridges
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
  const extendBridge = (index) => {
    if (!gameRef.current || !gameRef.current.bridges) return;
    const group = gameRef.current.bridges[index];
    if (!group) return;
    setExtendedBridges(prev => {
      if (prev[index]) return prev;
      const arr = [...prev];
      arr[index] = true;
      return arr;
    });
    group.visible = true;
    group.children.forEach((plank, idx) => {
      if (plank.material) {
        plank.scale.set(0.01, 1, 1);
        plank.material.transparent = true;
        plank.material.opacity = 0;
        new TWEEN.Tween(plank.scale)
          .to({ x: 1 }, 700)
          .delay(idx * 150)
          .easing(TWEEN.Easing.Elastic.Out)
          .start();
        new TWEEN.Tween(plank.material)
          .to({ opacity: 1 }, 500)
          .delay(idx * 150)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
      }
    });
  };

  // Extend first bridge after gears activated
  useEffect(() => {
    const NUM_GEARS_FOR_BRIDGE = 6;
    if (
      activatedPlatformGears === NUM_GEARS_FOR_BRIDGE &&
      gameRef.current &&
      gameRef.current.bridges &&
      extendedBridges[0] === false
    ) {
      extendBridge(0);
    }
  }, [activatedPlatformGears, extendedBridges]);

  // Extend subsequent bridges based on plinth activations
  useEffect(() => {
    const PLINTHS_PER_PLATFORM = 2;
    if (!gameRef.current || !gameRef.current.bridges) return;
    for (let i = 1; i < gameRef.current.bridges.length; i++) {
      if (activatedPlinths >= i * PLINTHS_PER_PLATFORM && extendedBridges[i] === false) {
        extendBridge(i);
      }
    }
  }, [activatedPlinths, extendedBridges]);
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