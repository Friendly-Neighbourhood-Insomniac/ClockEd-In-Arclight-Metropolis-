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

  const platformGroups = [];
  const platformCenters = [];
  const platformSizes = [];
  const bridgePlinthsByPlatform = [];

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
    // Add decorative plinths on every platform
    const plinthGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 6);
    const plinthMaterial = bronzeMaterial.clone();
    const plinth1 = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth1.position.set(0, octagonPlatformThickness / 2 + 1.5 / 2, (bridgeSegmentWidth / 2) + 0.5);
    plinth1.castShadow = true;
    platformGroup.add(plinth1);
    const plinth2 = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth2.position.set(0, octagonPlatformThickness / 2 + 1.5 / 2, -((bridgeSegmentWidth / 2) + 0.5));
    plinth2.castShadow = true;
    platformGroup.add(plinth2);
    bridgePlinthsByPlatform[i] = [plinth1, plinth2];

    platformGroups[i] = platformGroup;
    platformCenters[i] = new THREE.Vector3(x, octagonOrigin.y, z);
    platformSizes[i] = currentPlatformSize;
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
  // ---- Generalised bridge creation ----
  const bridgeSegmentHeight = 0.3;
  const bridgePlankGeometry = new THREE.BoxGeometry(bridgeSegmentLength, bridgeSegmentHeight, bridgeSegmentWidth);

  const bridges = [];

  const platformSurfaceY = octagonOrigin.y + octagonPlatformThickness / 2;
  const bridgeYPosition = platformSurfaceY + bridgeSegmentHeight / 2;

  function createBridge(startCenter, startSize, endCenter, endSize) {
    const group = new THREE.Group();
    const direction = new THREE.Vector3().subVectors(endCenter, startCenter);
    const totalLength = direction.length();
    direction.normalize();
    group.position.copy(startCenter).addScaledVector(direction, startSize);
    group.position.y = bridgeYPosition;
    const angleY = Math.atan2(direction.x, direction.z) - Math.PI / 2;
    group.rotation.y = angleY;
    const spanLength = totalLength - (startSize + endSize);
    const segs = Math.max(1, Math.floor((spanLength + segmentGap) / (bridgeSegmentLength + segmentGap)));
    for (let i = 0; i < segs; i++) {
      const plank = new THREE.Mesh(bridgePlankGeometry, bronzeMaterial.clone());
      plank.position.x = (bridgeSegmentLength / 2) + i * (bridgeSegmentLength + segmentGap);
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }
    group.visible = false;
    scene.add(group);
    worldObjects.push(group);
    bridges.push(group);
  }

  // Bridge from central platform to first platform
  const centralPlatformSurfaceCenter = new THREE.Vector3(octagonOrigin.x, platformSurfaceY, octagonOrigin.z);
  createBridge(centralPlatformSurfaceCenter, centralPlatformBaseSize, platformCenters[0], platformSizes[0]);

  // Sequential bridges connecting platforms 0 -> 1 -> ... -> 7
  for (let i = 0; i < 7; i++) {
    createBridge(platformCenters[i], platformSizes[i], platformCenters[i + 1], platformSizes[i + 1]);
  }

  const bridgePlinths = bridgePlinthsByPlatform.flat();
  return { worldObjects, bridges, bridgePlinths };
}