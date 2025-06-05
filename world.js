import * as THREE from 'three';

export function createSteampunkWorld(scene) {
  const worldObjects = [];

  // Porcelain material
  const porcelainMaterial = new THREE.MeshPhongMaterial({
    color: 0xf8f0e3,
    shininess: 100,
    reflectivity: 0.3,
    transparent: true,
    opacity: 0.95
  });

  // Bronze material
  const bronzeMaterial = new THREE.MeshPhongMaterial({
    color: 0xcd7f32,
    shininess: 80,
    metalness: 0.8
  });

// Main platform previously here, now removed to integrate into octagonal arrangement.

// Octagonal formation is now the primary starting area.
  // --- New Octagonal Platform Arrangement ---
  const octagonOrigin = new THREE.Vector3(0, 15, 70); // Center of the new platform set
  const octagonRadius = 35; // Default radius for octagonal platforms
  const octagonPlatformSize = 6; // Increased radius of each of the 8 platform discs
  const octagonPlatformThickness = 1.2; // Slightly thicker for better visual proportion
  // Define bridge geometry constants early for platform positioning
  const bridgeSegmentLength = 1.8;
  const segmentGap = 0.2;
  const numSegments = 12;
  const bridgeSegmentWidth = 2.5; // Moved this definition higher
  // Calculate the target position for the platform that the bridge connects to
  const centralPlatformBaseSizeForBridgeCalc = 7; // Matching centralPlatformBaseSize
  const bridgeGroupStartX = octagonOrigin.x + centralPlatformBaseSizeForBridgeCalc;
  const bridgeLength = (numSegments - 1) * (bridgeSegmentLength + segmentGap) + bridgeSegmentLength;
  const targetPlatformCenterX = bridgeGroupStartX + bridgeLength;
  const targetPlatformCenterZ = octagonOrigin.z; // Bridge extends along X axis
  // Create 8 platforms in an octagonal layout
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    let x, z;
    let currentPlatformSize = octagonPlatformSize; // Default size
    // Special handling for platform i=3 (enlarge it)
    if (i === 3) {
      currentPlatformSize = octagonPlatformSize * 1.8; // Make it larger
    }
    // The platform at angle 0 (i=0) is the one the bridge connects to.
    // We'll position it precisely at the end of the bridge.
    if (i === 0) {
      x = targetPlatformCenterX;
      z = targetPlatformCenterZ;
    } else {
      x = octagonOrigin.x + Math.cos(angle) * octagonRadius;
      z = octagonOrigin.z + Math.sin(angle) * octagonRadius;
    }
    const platformGroup = new THREE.Group();
    platformGroup.position.set(x, octagonOrigin.y, z);
    // Porcelain disc
    const discGeometry = new THREE.CylinderGeometry(currentPlatformSize, currentPlatformSize, octagonPlatformThickness, 12);
    const disc = new THREE.Mesh(discGeometry, porcelainMaterial);
    disc.receiveShadow = true;
    disc.castShadow = true;
    platformGroup.add(disc);
    // Bronze decorative rim
    const rimGeometry = new THREE.TorusGeometry(currentPlatformSize, 0.1, 6, 12);
    const rim = new THREE.Mesh(rimGeometry, bronzeMaterial);
    rim.position.y = octagonPlatformThickness * 0.5 + 0.05; // Place slightly above the disc
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = true;
    platformGroup.add(rim);
    // If this is the platform the bridge connects to (i === 0), add decorative plinths
    if (i === 0) {
      const plinthGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 6);
      const plinthMaterial = bronzeMaterial.clone(); // Use the same bronze material
      const plinth1 = new THREE.Mesh(plinthGeometry, plinthMaterial);
      plinth1.position.set(0, octagonPlatformThickness / 2 + 1.5 / 2, (bridgeSegmentWidth / 2) + 0.5);
      plinth1.castShadow = true;
      platformGroup.add(plinth1);
      const plinth2 = new THREE.Mesh(plinthGeometry, plinthMaterial);
      plinth2.position.set(0, octagonPlatformThickness / 2 + 1.5 / 2, -((bridgeSegmentWidth / 2) + 0.5));
      plinth2.castShadow = true;
      platformGroup.add(plinth2);
    }
    // Add Gear-Totem to platform i=3
    if (i === 3) {
      const totemGroup = new THREE.Group();
      const totemBaseY = octagonPlatformThickness / 2;
      totemGroup.position.y = totemBaseY; // Position totem on the platform surface
      const gearHeights = [0.5, 1.8, 3.1]; // Y positions for the centers of the gears
      const gearRadii = [2.8, 2.2, 1.6];
      const gearThickness = 0.4;
      for (let k = 0; k < 3; k++) {
        const totemGearGroup = new THREE.Group();
        // Main gear body
        const gearGeom = new THREE.CylinderGeometry(gearRadii[k], gearRadii[k], gearThickness, 16);
        const gearMesh = new THREE.Mesh(gearGeom, bronzeMaterial);
        gearMesh.castShadow = true;
        totemGearGroup.add(gearMesh);
        // Gear teeth
        const numTeeth = 12;
        for (let j = 0; j < numTeeth; j++) {
          const toothAngle = (j / numTeeth) * Math.PI * 2;
          const toothGeom = new THREE.BoxGeometry(0.3, gearThickness * 1.5, 0.4); // Thicker teeth
          const toothMesh = new THREE.Mesh(toothGeom, bronzeMaterial);
          toothMesh.position.set(
            Math.cos(toothAngle) * (gearRadii[k] + 0.15), // Place teeth slightly outside gear radius
            0,
            Math.sin(toothAngle) * (gearRadii[k] + 0.15)
          );
          toothMesh.rotation.y = toothAngle;
          toothMesh.castShadow = true;
          totemGearGroup.add(toothMesh);
        }
        totemGearGroup.position.y = gearHeights[k];
        // Add spinning animation via userData for interactables or game loop to pick up
        totemGearGroup.userData.isTotemGear = true;
        totemGearGroup.userData.spinSpeed = 0.2 * (k % 2 === 0 ? 1 : -1) * (0.5 + Math.random() * 0.5); // Varied speed and direction
        totemGroup.add(totemGearGroup);
        // Porcelain connector if not the last gear
        if (k < 2) {
            const connectorHeight = gearHeights[k+1] - gearHeights[k] - gearThickness;
            const connectorRadius = Math.min(gearRadii[k], gearRadii[k+1]) * 0.5;
            const connectorGeom = new THREE.CylinderGeometry(connectorRadius, connectorRadius, connectorHeight, 8);
            const connectorMesh = new THREE.Mesh(connectorGeom, porcelainMaterial);
            connectorMesh.position.y = gearHeights[k] + gearThickness/2 + connectorHeight/2;
            connectorMesh.castShadow = true;
            totemGroup.add(connectorMesh);
        }
      }
      platformGroup.add(totemGroup);
    }
    scene.add(platformGroup);
    worldObjects.push(platformGroup);
  }
// The central tall platform (pillar) code that was here has been removed.
// The central platform is now just the base disc and its rim,
// which allows for better visibility and interaction with gears.
  // Create the central platform base disc (formerly part of the tower assembly)
  const centralPlatformGroup = new THREE.Group(); // New group for the central base
  centralPlatformGroup.position.set(octagonOrigin.x, octagonOrigin.y, octagonOrigin.z);
  const centralPlatformBaseSize = 7; 
  const centralPlatformBaseThickness = 2;
  const baseDiscGeometry = new THREE.CylinderGeometry(centralPlatformBaseSize, centralPlatformBaseSize, centralPlatformBaseThickness, 12);
  const baseDisc = new THREE.Mesh(baseDiscGeometry, porcelainMaterial);
  baseDisc.receiveShadow = true;
  baseDisc.castShadow = true;
  centralPlatformGroup.add(baseDisc);
  const baseRimGeometry = new THREE.TorusGeometry(centralPlatformBaseSize, 0.15, 8, 16);
  const baseRim = new THREE.Mesh(baseRimGeometry, bronzeMaterial);
  baseRim.position.y = centralPlatformBaseThickness * 0.5 + 0.075;
  baseRim.rotation.x = Math.PI / 2;
  baseRim.castShadow = true;
  centralPlatformGroup.add(baseRim);
  scene.add(centralPlatformGroup);
  worldObjects.push(centralPlatformGroup);
  // Add distant clockwork towers at fixed, non-intersecting positions
  // Define an exclusion zone around the central platform area to avoid intersections.
  // octagonOrigin = (0, 15, 70), octagonRadius = 35. Furthest platform edge is around 70 + 35 + platformSize = ~111 in Z.
  // Bridge 1 extends to targetPlatformCenterX = 30.8. Bridge 2 goes from 30.8 (P0) to 0 (P2).
  // A simple exclusion radius from (0,0,0) or a slightly offset center should work.
  // Let's use a minimum distance from world origin (0,0,0) and also consider the game area center (octagonOrigin).
  const minDistanceFromOrigin = 80; // Min distance from (0,0,0)
  const gameAreaCenter = octagonOrigin; // (0, 15, 70)
  const minDistanceFromGameCenter = 65; // Min distance from the center of octagonal platforms
  const towerPositions = [
    { angle: Math.PI / 6, distanceScale: 1.0, heightScale: 1.0 },   // 30 deg
    { angle: Math.PI / 3, distanceScale: 1.15, heightScale: 0.8 },  // 60 deg
    { angle: Math.PI / 2, distanceScale: 1.05, heightScale: 1.1 },  // 90 deg
    { angle: (2 * Math.PI) / 3, distanceScale: 1.2, heightScale: 0.9 }, // 120 deg
    { angle: (5 * Math.PI) / 6, distanceScale: 1.0, heightScale: 1.2 }, // 150 deg
    { angle: Math.PI, distanceScale: 1.1, heightScale: 0.85 },        // 180 deg
    { angle: (7 * Math.PI) / 6, distanceScale: 1.05, heightScale: 1.0 }, // 210 deg
    { angle: (4 * Math.PI) / 3, distanceScale: 1.25, heightScale: 0.95 },// 240 deg
    { angle: (3 * Math.PI) / 2, distanceScale: 1.0, heightScale: 1.15 },// 270 deg
    { angle: (5 * Math.PI) / 3, distanceScale: 1.15, heightScale: 0.75 },// 300 deg
    { angle: (11 * Math.PI) / 6, distanceScale: 1.0, heightScale: 1.0 },// 330 deg
    { angle: 0, distanceScale: 1.2, heightScale: 0.9 },               // 0 deg / 360 deg
  ];
  towerPositions.forEach(posData => {
    const baseDistance = 75; // Base distance for towers before scaling
    const distance = baseDistance * posData.distanceScale;
    
    // Calculate position relative to world origin, ensuring it's far enough.
    let x = Math.cos(posData.angle) * distance;
    let z = Math.sin(posData.angle) * distance;
    // Ensure minimum distance from gameAreaCenter as well
    const distToGameCenter = Math.sqrt(Math.pow(x - gameAreaCenter.x, 2) + Math.pow(z - gameAreaCenter.z, 2));
    if (distToGameCenter < minDistanceFromGameCenter) {
        const scaleUp = minDistanceFromGameCenter / distToGameCenter;
        x *= scaleUp;
        z *= scaleUp;
    }
    // Also ensure min distance from overall origin if needed (though gameAreaCenter check is more relevant here)
     const distToOrigin = Math.sqrt(x*x + z*z);
     if (distToOrigin < minDistanceFromOrigin) {
        const scaleUpOrigin = minDistanceFromOrigin / distToOrigin;
        x *= scaleUpOrigin;
        z *= scaleUpOrigin;
     }
    const baseHeight = 25;
    const height = baseHeight * posData.heightScale + (Math.random() * 10 - 5); // Add a little variation
    const towerGroup = new THREE.Group();
    
    const baseGeometry = new THREE.CylinderGeometry(2, 3, height * 0.6, 8);
    const towerMesh = new THREE.Mesh(baseGeometry, porcelainMaterial);
    towerMesh.position.y = height * 0.3; // Base of tower at y=0, center of mesh at height * 0.3
    towerMesh.castShadow = true; // Towers can cast shadows on distant elements (though unlikely to hit main scene)
    towerGroup.add(towerMesh);
    
    const domeGeometry = new THREE.SphereGeometry(2.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMesh = new THREE.Mesh(domeGeometry, bronzeMaterial);
    domeMesh.position.y = height * 0.6; // Dome sits on top of the base
    domeMesh.castShadow = true;
    towerGroup.add(domeMesh);
    
    towerGroup.position.set(x, 0, z); // Tower base rests on y=0 plane
    
    scene.add(towerGroup);
    worldObjects.push(towerGroup);
  });

  // Add floating atmospheric elements
  for (let i = 0; i < 15; i++) {
    const cloudGeometry = new THREE.SphereGeometry(2 + Math.random() * 3, 8, 6);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1 + Math.random() * 0.2
    });
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    
    cloud.position.set(
      (Math.random() - 0.5) * 200,
      10 + Math.random() * 20,
      (Math.random() - 0.5) * 200
    );
    
    scene.add(cloud);
    worldObjects.push(cloud);
  }
// Second main platform previously here, now removed.
  // Create the Bridge
  const bridgeGroup = new THREE.Group();
  // Position bridge to start from the edge of the central octagonal platform and extend along +X
  // Central platform surface Y: octagonOrigin.y + centralPlatformBaseThickness / 2
  const centralPlatformSurfaceY = octagonOrigin.y + (centralPlatformBaseThickness / 2);
  // Bridge group starts at the +X edge of the central platform
  bridgeGroup.position.set(
    octagonOrigin.x + centralPlatformBaseSize, 
    centralPlatformSurfaceY + 0.15, // Slightly above the platform surface
    octagonOrigin.z
  );
  scene.add(bridgeGroup);
  worldObjects.push(bridgeGroup);
  // Bridge geometry constants are now defined earlier (lines 31-34)
  // const bridgeSegmentLength = 1.8; // Defined earlier
  // const bridgeSegmentWidth = 2.5; // Defined earlier
  const bridgeSegmentHeight = 0.3;
  // const segmentGap = 0.2; // Defined earlier
  // const numSegments = 12; // Defined earlier
  const bridgePlankGeometry = new THREE.BoxGeometry(bridgeSegmentLength, bridgeSegmentHeight, bridgeSegmentWidth);
  
  for (let i = 0; i < numSegments; i++) {
    const plank = new THREE.Mesh(bridgePlankGeometry, bronzeMaterial.clone());
    // Planks are positioned relative to the bridgeGroup, starting from its origin and extending along +X
    plank.position.x = (bridgeSegmentLength / 2) + i * (bridgeSegmentLength + segmentGap);
    // plank.position.y is 0 relative to bridgeGroup, which is already set at the correct height.
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
  }
  bridgeGroup.visible = false; // Bridge is initially hidden
  // Find the plinths to return them for interaction
  let bridgePlinths = [];
  worldObjects.forEach(obj => {
    if (obj.children) {
      obj.children.forEach(child => {
        // Assuming plinths were added to a platform group that's identifiable
        // Or, more robustly, give plinths a specific name or userData property when created
        // For now, let's assume the plinths are the CylinderGeometries with height 1.5 on platform i=0
        if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.geometry.parameters.height === 1.5) {
            // This is a heuristic. A better way would be to tag them during creation.
            // For this specific setup where platform i=0 has two such plinths.
            const platformGroupForPlinths = worldObjects.find(wo => 
                wo.position.x === targetPlatformCenterX && wo.position.z === targetPlatformCenterZ
            );
            if (platformGroupForPlinths && child.parent === platformGroupForPlinths) {
                 bridgePlinths.push(child);
            }
        }
      });
    }
  });
  // Ensure we only get two plinths from the correct platform. This might need refinement if structure changes.
  // A direct reference during creation loop (i===0) is safer.
  // Let's refine this by directly capturing plinths from the loop where i === 0.
  const targetPlatform = worldObjects.find(wo => 
    wo.position.x === targetPlatformCenterX && wo.position.z === targetPlatformCenterZ
  );
  
  bridgePlinths = [];
  if (targetPlatform) {
    targetPlatform.children.forEach(child => {
      if (child.geometry && child.geometry.type === 'CylinderGeometry' && 
          child.geometry.parameters.height === 1.5 && 
          (child.position.z > bridgeSegmentWidth / 2 || child.position.z < -bridgeSegmentWidth / 2) ) {
            bridgePlinths.push(child);
          }
    });
  }
  // --- Create Bridge 2 (Connects plinth platform P0 to another octagonal platform P2) ---
  const bridge2Group = new THREE.Group();
  const platformSurfaceY = octagonOrigin.y + octagonPlatformThickness / 2; // Y-level of platform tops: 15.6
  const bridgeYPosition = platformSurfaceY + bridgeSegmentHeight / 2; // Center Y for planks: 15.75
  // P0 is the platform with plinths (platform i=0 in the octagonal loop)
  const p0_center_x = targetPlatformCenterX; // 30.8
  const p0_center_z = targetPlatformCenterZ; // 70
  // P2 is platform i=2 in the octagonal loop
  const angle_p2 = (2 / 8) * Math.PI * 2; // Math.PI / 2
  const p2_center_x = octagonOrigin.x + Math.cos(angle_p2) * octagonRadius; // 0
  const p2_center_z = octagonOrigin.z + Math.sin(angle_p2) * octagonRadius; // 70 + 35 = 105
  const bridge2_startPlatform_center = new THREE.Vector3(p0_center_x, platformSurfaceY, p0_center_z);
  const bridge2_endPlatform_center = new THREE.Vector3(p2_center_x, platformSurfaceY, p2_center_z);
  const bridge2_direction = new THREE.Vector3().subVectors(bridge2_endPlatform_center, bridge2_startPlatform_center);
  const bridge2_totalLength = bridge2_direction.length();
  bridge2_direction.normalize();
  // Position bridge2Group at the edge of the starting platform (P0)
  bridge2Group.position.copy(bridge2_startPlatform_center)
    .addScaledVector(bridge2_direction, octagonPlatformSize); // Move to P0's edge
  bridge2Group.position.y = bridgeYPosition;
  // Rotate bridge2Group to align its local +X axis with bridge2_direction
  // Math.atan2(direction.x, direction.z) gives angle relative to +Z. We want angle for +X.
  const angleY_bridge2 = Math.atan2(bridge2_direction.x, bridge2_direction.z) - Math.PI / 2;
  bridge2Group.rotation.y = angleY_bridge2;
  // Calculate number of segments for the span between platform edges
  const bridge2_spanLength = bridge2_totalLength - (2 * octagonPlatformSize);
  const bridge2_numSegments = Math.max(1, Math.floor((bridge2_spanLength + segmentGap) / (bridgeSegmentLength + segmentGap)));
  for (let i = 0; i < bridge2_numSegments; i++) {
    const plank = new THREE.Mesh(bridgePlankGeometry, bronzeMaterial.clone()); // Use same geometry/material
    // Position planks along the local X-axis of bridge2Group
    plank.position.x = (bridgeSegmentLength / 2) + i * (bridgeSegmentLength + segmentGap);
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridge2Group.add(plank);
  }
  bridge2Group.visible = false; // Initially hidden
  scene.add(bridge2Group);
  worldObjects.push(bridge2Group);
  return { worldObjects, bridge: bridgeGroup, bridgePlinths, bridge2: bridge2Group };
}