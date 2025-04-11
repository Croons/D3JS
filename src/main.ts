import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModelLoader } from './utils/modelLoader';

// Init Three.js components
class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private modelLoader: ModelLoader;
  private loadedModels: THREE.Group[] = [];

  constructor() {
    // Scene creation
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x282c34);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 10;
    this.camera.position.y = 2;

    // Web rendering
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('app')?.appendChild(this.renderer.domElement);

    // Camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // smooooothing

    // Let there light (Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Build plate (grid)
    const gridHelper = new THREE.GridHelper(15, 15);
    this.scene.add(gridHelper);

    // Model loader
    this.modelLoader = new ModelLoader();
    this.loadModels();

    // Window resizer!
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private async loadModelAtPosition(modelPath: string, position: THREE.Vector3): Promise<THREE.Group | null> {
    try {
      const model = await this.modelLoader.loadModel(modelPath);
      model.scene.position.copy(position);
      this.scene.add(model.scene);
      this.loadedModels.push(model.scene);
      return model.scene;
    } catch (error) {
      console.error(`Failed to load model: ${modelPath}`, error);
      return null;
    }
  }

  private async loadModels(): Promise<void> {
    // Load models here
    await this.loadModelAtPosition('models/bike.glb', new THREE.Vector3(0, 0.6, 0));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
  console.log('scene initialized');
});