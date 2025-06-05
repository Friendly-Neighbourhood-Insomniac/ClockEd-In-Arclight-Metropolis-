import * as THREE from 'three';
import * as TWEEN from 'tween.js';
// Callback 'onMechanismActivated' is for total count for UI.
// Callback 'onGearMechanismActivated' is specific to gears for game logic (e.g., first bridge).
// Callback 'onPlinthMechanismActivated' is specific to plinths for game logic (e.g., second bridge).
export function createInteractables(scene, onMechanismActivated, onGearMechanismActivated, onPlinthMechanismActivated, bridgePlinths = []) {
  const interactables = [];
  let totalActivatedMechanisms = 0;
  let activatedGearMechanisms = 0;
  let activatedPlinthMechanisms = 0;
  const NUM_GEARS_PLATFORM1 = 6;
  // Constants for positioning relative to the new central octagonal platform
  // These values should match those in world.js for the central platform
  const octagonOrigin = { x: 0, y: 15, z: 70 };
  const centralPlatformBaseSize = 7; // Updated to match world.js
  const centralPlatformBaseThickness = 2; // Updated to match world.js
  // Bronze material for gears
  const bronzeMaterial = new THREE.MeshPhongMaterial({
    color: 0xcd7f32,
    shininess: 80,
    metalness: 0.8
  });

  // Create spinning gears around the main platform
  for (let i = 0; i < NUM_GEARS_PLATFORM1; i++) {
    const angle = (i / NUM_GEARS_PLATFORM1) * Math.PI * 2;
    // Position gears around the new central platform from the octagonal set
    const gearRadius = centralPlatformBaseSize - 0.5; // Place them near the edge of the base
    const x = octagonOrigin.x + Math.cos(angle) * gearRadius;
    const z = octagonOrigin.z + Math.sin(angle) * gearRadius;
    
    const gearGroup = new THREE.Group();
    
    // Main gear body
    const gearGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
    const gear = new THREE.Mesh(gearGeometry, bronzeMaterial);
    gear.castShadow = true;
    gearGroup.add(gear);
    
    // Gear teeth
    for (let j = 0; j < 12; j++) {
      const toothAngle = (j / 12) * Math.PI * 2;
      const toothGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.3);
      const tooth = new THREE.Mesh(toothGeometry, bronzeMaterial);
      tooth.position.set(
        Math.cos(toothAngle) * 1.6,
        0,
        Math.sin(toothAngle) * 1.6
      );
      tooth.rotation.y = toothAngle;
      tooth.castShadow = true;
      gearGroup.add(tooth);
    }
    
    // Set Y position for gears on top of the central platform's base
    const gearYPosition = octagonOrigin.y + (centralPlatformBaseThickness / 2) + 0.5; // Slightly above surface
    gearGroup.position.set(x, gearYPosition, z);
    scene.add(gearGroup);
    
    const interactable = {
      mesh: gear, // The clickable part
      group: gearGroup, // The whole gear assembly for animation
      type: 'gear', // To distinguish from other interactables
      activated: false,
      spinning: false,
      activate: function() {
        if (this.activated) return;
        this.activated = true;
        this.spinning = true; // Starts spinning animation in updateInteractables
        
        totalActivatedMechanisms++;
        if (onMechanismActivated) onMechanismActivated(totalActivatedMechanisms);
        
        // If this is a gear, also call the gear-specific callback
        if (this.type === 'gear') {
          activatedGearMechanisms++;
          if (onGearMechanismActivated) onGearMechanismActivated(activatedGearMechanisms);
        }
        
        // Visual feedback on click
        new TWEEN.Tween(this.group.scale)
          .to({ x: 1.2, y: 1.2, z: 1.2 }, 200)
          .easing(TWEEN.Easing.Back.Out)
          .yoyo(true)
          .repeat(1)
          .start();
      }
    };
    
    interactables.push(interactable);
  }

  // Create steam vents
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * 6;
    const z = Math.sin(angle) * 6;
    
    const ventGroup = new THREE.Group();
    
    // Vent pipe
    const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
    const pipe = new THREE.Mesh(pipeGeometry, bronzeMaterial);
    pipe.position.y = 0.75;
    pipe.castShadow = true;
    ventGroup.add(pipe);
    
    // Steam particles
    const steamGeometry = new THREE.SphereGeometry(0.1, 8, 6);
    const steamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    
    const steamParticles = [];
    for (let j = 0; j < 5; j++) {
      const particle = new THREE.Mesh(steamGeometry, steamMaterial);
      particle.position.set(0, 1.5 + j * 0.5, 0);
      particle.visible = false;
      ventGroup.add(particle);
      steamParticles.push(particle);
    }
    
    ventGroup.position.set(x, 0, z);
    scene.add(ventGroup);
    
    const interactable = {
      mesh: pipe, // Clickable part
      group: ventGroup, // Whole assembly
      steamParticles: steamParticles,
      type: 'vent', // To distinguish
      activated: false,
      steaming: false, // For vent-specific animation
      light: null, // To store the PointLight
      materialClonedForEmissive: false, // Flag to track if material was cloned for emissive effect
      activate: function() {
        if (this.activated) return;
        this.activated = true;
        this.steaming = true;
        
        totalActivatedMechanisms++;
        if (onMechanismActivated) onMechanismActivated(totalActivatedMechanisms);
        // Emissive effect for the pipe itself
        if (!this.materialClonedForEmissive) {
            this.mesh.material = this.mesh.material.clone(); // pipe.material is this.mesh.material
            this.mesh.material.emissive = new THREE.Color(0x664411); // A subtle warm orange/brown
            this.mesh.material.emissiveIntensity = 0; // Start from no emissive glow
            this.materialClonedForEmissive = true;
        }
        
        new TWEEN.Tween(this.mesh.material)
            .to({ emissiveIntensity: 0.6 }, 700) // Animate to a subtle glow
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        
        // Create and animate the PointLight (existing logic)
        if (!this.light) {
          this.light = new THREE.PointLight(0xffcc33, 0, 5, 2); // Warm color, initial intensity 0, distance 5, decay 2
          // Position light at the top of the vent pipe. Pipe height is 1.5, positioned at y = 0.75.
          // So top of pipe is y = 0.75 (pipe center) + 1.5/2 (half pipe height) = 1.5
          this.light.position.set(0, 1.6, 0); // Slightly above the pipe opening
          this.group.add(this.light);
          
          new TWEEN.Tween(this.light)
            .to({ intensity: 1.8 }, 500) // Animate to intensity 1.8 over 500ms
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        }
        
        // Vent-specific activation effect (steam particles)
        this.steamParticles.forEach((particle, index) => {
          particle.visible = true;
          setTimeout(() => {
            new TWEEN.Tween(particle.position)
              .to({ y: particle.position.y + 3 }, 2000)
              .easing(TWEEN.Easing.Quadratic.Out)
              .repeat(Infinity)
              .start();
            
            new TWEEN.Tween(particle.material)
              .to({ opacity: 0 }, 2000)
              .easing(TWEEN.Easing.Quadratic.Out)
              .repeat(Infinity)
              .yoyo(true)
              .start();
          }, index * 200);
        });
      }
    };
    
    interactables.push(interactable);
  }
  // Create interactable plinths
  bridgePlinths.forEach(plinthMesh => {
    const interactable = {
      mesh: plinthMesh,
      group: plinthMesh, // Light and effects will be relative to the plinth itself
      type: 'plinth',
      activated: false,
      light: null,
      materialClonedForEmissive: false,
      activate: function() {
        if (this.activated) return;
        this.activated = true;
        totalActivatedMechanisms++;
        if (onMechanismActivated) onMechanismActivated(totalActivatedMechanisms);
        activatedPlinthMechanisms++;
        if (onPlinthMechanismActivated) onPlinthMechanismActivated(activatedPlinthMechanisms);
        // Emissive effect for the plinth
        if (!this.materialClonedForEmissive) {
          this.mesh.material = this.mesh.material.clone();
          this.mesh.material.emissive = new THREE.Color(0x223366); // Dark blue
          this.mesh.material.emissiveIntensity = 0;
          this.materialClonedForEmissive = true;
        }
        new TWEEN.Tween(this.mesh.material)
          .to({ emissiveIntensity: 0.8 }, 700)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
        // PointLight effect
        if (!this.light) {
          this.light = new THREE.PointLight(0x88bbff, 0, 4, 2); // Blueish white, intensity 0, dist 4, decay 2
          // Plinth height is 1.5, local origin at center. Top is at y = 0.75.
          this.light.position.set(0, 0.85, 0); // Slightly above the plinth top
          this.group.add(this.light); // Add light as child of plinth mesh
          new TWEEN.Tween(this.light)
            .to({ intensity: 1.5 }, 500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        }
         // Optional: Scale pulse feedback
        new TWEEN.Tween(this.group.scale)
          .to({ x: 1.1, y: 1.05, z: 1.1 }, 200)
          .easing(TWEEN.Easing.Back.Out)
          .yoyo(true)
          .repeat(1)
          .start();
      }
    };
    interactables.push(interactable);
  });
  return interactables;
}
export function updateInteractables(interactables, deltaTime) {
  interactables.forEach(interactable => {
    if (interactable.spinning) {
      interactable.group.rotation.y += deltaTime * 2;
    }
  });
}