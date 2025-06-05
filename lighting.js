import * as THREE from 'three';

export function setupAtmosphericLighting(scene) {
  // Warm ambient light
  const ambientLight = new THREE.AmbientLight(0xffd07a, 0.4);
  scene.add(ambientLight);

  // Main directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffd07a, 0.8);
  directionalLight.position.set(50, 80, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);

  // Secondary warm light from opposite direction
  const secondaryLight = new THREE.DirectionalLight(0xffeb9c, 0.3);
  secondaryLight.position.set(-30, 40, -20);
  scene.add(secondaryLight);

  // Atmospheric fog
  const fog = new THREE.Fog(0xf4e4bc, 30, 120);
  scene.fog = fog;

  // Sky gradient background
  const skyGeometry = new THREE.SphereGeometry(500, 32, 16);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0xffffff) },
      bottomColor: { value: new THREE.Color(0xf4e4bc) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  return {
    ambientLight,
    directionalLight,
    secondaryLight,
    sky
  };
}