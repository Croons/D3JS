import * as THREE from 'three';

export interface TextureInfo {
  name: string;
  path: string;
  thumbnail?: string;
}

export class TextureManager {
  private textureLoader: THREE.TextureLoader;
  private loadedTextures: Map<string, THREE.Texture> = new Map();
  private availableTextures: TextureInfo[] = [
    // Texture path here
    { name: 'Red', path: './textures/red_brick.jpg' },
    { name: 'Green', path: './textures/green_fabric.jpg' },
    { name: 'Blue', path: './textures/blue_metal.jpg' },

  ];
  
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }
  
  public getAvailableTextures(): TextureInfo[] {
    return this.availableTextures;
  }
  
  // Load from path
  public loadTexture(texturePath: string): Promise<THREE.Texture> {
    if (this.loadedTextures.has(texturePath)) {
      return Promise.resolve(this.loadedTextures.get(texturePath)!);
    }
    
    // Load the texture
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        texturePath,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          // Store for reuse
          this.loadedTextures.set(texturePath, texture);
          resolve(texture);
        },
        undefined, // onProgress not used
        (error) => {
          console.error(`Error loading texture: ${texturePath}`, error);
          reject(error);
        }
      );
    });
  }
  
  // Apply texture to a model
  public async applyTextureToModel(model: THREE.Object3D, texturePath: string): Promise<void> {
    if (!model) return;
    
    try {
      const texture = await this.loadTexture(texturePath);
      
      // Create a new material with the texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.2
      });
      
      // Apply the material to all meshes in the model
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (!object.userData.originalMaterial) {
            object.userData.originalMaterial = object.material;
          }
          
          // Apply the new material
          object.material = material;
        }
      });
      
    } catch (error) {
      console.error('Failed to apply texture:', error);
    }
  }
  
  // Reset model materials to original
  public resetModelMaterials(model: THREE.Object3D): void {
    if (!model) return;
    
    model.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.originalMaterial) {
        object.material = object.userData.originalMaterial;
      }
    });
  }
}