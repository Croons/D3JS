import './crypto-polyfill.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModelLoader } from './utils/modelLoader';
import { SelectionManager } from './utils/selectionManager';
import { GravityManager } from './utils/gravityManager';
import '../ui.css';

// Init Three.js components
class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private modelLoader: ModelLoader;
  private selectionManager: SelectionManager;
  private loadedModels: THREE.Group[] = [];
  private gravityManager: GravityManager;


  constructor() {
    // Scene creation
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x282c34);
    this.gravityManager = new GravityManager();


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

    this.modelLoader = new ModelLoader();
    
    this.selectionManager = new SelectionManager(
      this.scene,
      this.camera
    );
    
    this.loadModels();

    // Window resizer!
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private async loadModelAtPosition(modelPath: string, position: THREE.Vector3, name: string): Promise<THREE.Group | null> {
    try {
      const model = await this.modelLoader.loadModel(modelPath);
      
      // Set the model name for easier identification
      model.scene.name = name;
      
      // Position the model
      model.scene.position.copy(position);
      
      // Add to scene
      this.scene.add(model.scene);
      
      // Store for reference
      this.loadedModels.push(model.scene);
      
      // Add to selection manager
      this.selectionManager.addSelectableObject(model.scene);
      
      return model.scene;
    } catch (error) {
      console.error(`Failed to load model: ${modelPath}`, error);
      return null;
    }
  }

  private async loadModels(): Promise<void> {
    // Load models
    await this.loadModelAtPosition('./models/bike.glb', new THREE.Vector3(0, 0.57, 0), 'Bike');
    await this.loadModelAtPosition('./models/head.glb', new THREE.Vector3(-3, 5.22, -4.5), 'Left Bike');
    await this.loadModelAtPosition('./models/table.glb', new THREE.Vector3(3, 0, 0), 'Right Bike');
    this.gravityManager.scanScene(this.scene);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    //Update for bounding box
    this.selectionManager.update();
    this.gravityManager.update();
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
  console.log('Scene initialized');
});