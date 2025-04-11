import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  private loader: GLTFLoader;
  
  constructor() {
    this.loader = new GLTFLoader();
  }

  // Load model from a given path
  loadModel(path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          console.log(`Model loaded: ${path}`);
          resolve(gltf);
        },
        (progress) => {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`Loading model: ${percentComplete.toFixed(2)}%`);
        },
        (error) => {
          console.error(`Error loading model: ${path}`, error);
          reject(error);
        }
      );
    });
  }
}