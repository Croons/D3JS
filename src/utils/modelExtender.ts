import * as THREE from 'three';

export class ModelExtender {
    /// Map to store original geometries for each mesh
  private originalGeometries: Map<THREE.Object3D, Map<THREE.BufferGeometry, Float32Array>> = new Map();
  
  public async extendModel(
    model: THREE.Object3D, 
    factor: number, 
    animate: boolean = true,
    duration: number = 300
  ): Promise<void> {
    if (!model) return;
    
    // extend the model by traversing
    model.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        this.extendMeshGeometry(object, factor, animate, duration);
      }
    });
    
    // If animation is enabled
    if (animate) {
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), duration);
      });
    }
  }
  
  // Extend mesh geometry by a factor
  private extendMeshGeometry(
    mesh: THREE.Mesh, 
    factor: number, 
    animate: boolean,
    duration: number
  ): void {
    const geometry = mesh.geometry;
    
    // Handles BufferGeometry, should maybe not needed since all models are BufferGeometry
    // but just in case
    if (!(geometry instanceof THREE.BufferGeometry)) return;
    
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) return;
    
    // Store original positions, check
    if (!this.originalGeometries.has(mesh)) {
      this.storeOriginalGeometry(mesh, geometry);
    }
    
    const originalGeometries = this.originalGeometries.get(mesh);
    if (!originalGeometries) return;
    
    const originalPositions = originalGeometries.get(geometry);
    if (!originalPositions) return;
    
    // array to modify
    const positions = positionAttribute.array as Float32Array;
    
    // Create the target positions based on the extension
    const targetPositions = new Float32Array(originalPositions.length);
    for (let i = 0; i < originalPositions.length; i += 3) {
      const originalX = originalPositions[i];
      targetPositions[i] = originalX * (1 + factor);
      
      targetPositions[i + 1] = originalPositions[i + 1];
      targetPositions[i + 2] = originalPositions[i + 2];
    }
    
    // Animate the extension if required
    if (animate) {
      const startTime = performance.now();
      const initialPositions = new Float32Array(positions);
      
      const animateExtension = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Lerp between initial and target positions
        for (let i = 0; i < positions.length; i++) {
          positions[i] = initialPositions[i] + (targetPositions[i] - initialPositions[i]) * progress;
        }
        
        positionAttribute.needsUpdate = true;
        
        if (progress < 1) {
          requestAnimationFrame(animateExtension);
        }
      };
      
      requestAnimationFrame(animateExtension);
    } else {
      // Apply the extension immediately
      for (let i = 0; i < positions.length; i++) {
        positions[i] = targetPositions[i];
      }
      positionAttribute.needsUpdate = true;
    }
  }
  
    // Store original geometry for later resetting
  private storeOriginalGeometry(mesh: THREE.Mesh, geometry: THREE.BufferGeometry): void {
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) return;
    
    const originalPositions = new Float32Array(positionAttribute.array.length);
    for (let i = 0; i < positionAttribute.array.length; i++) {
      originalPositions[i] = (positionAttribute.array as Float32Array)[i];
    }
    
    // Store original positions for geometry
    let geometryMap = this.originalGeometries.get(mesh);
    if (!geometryMap) {
      geometryMap = new Map<THREE.BufferGeometry, Float32Array>();
      this.originalGeometries.set(mesh, geometryMap);
    }
    geometryMap.set(geometry, originalPositions);
  }
  
  // Reset model to original state
  public resetModel(model: THREE.Object3D): void {
    if (!model) return;
    
    model.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        this.resetMeshGeometry(object, object.geometry);
      }
    });
  }
  
  // Reset to mesh original state
  private resetMeshGeometry(mesh: THREE.Mesh, geometry: THREE.BufferGeometry): void {
    const geometryMap = this.originalGeometries.get(mesh);
    if (!geometryMap) return;
    
    const originalPositions = geometryMap.get(geometry);
    if (!originalPositions) return;
    
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) return;
    
    const positions = positionAttribute.array as Float32Array;
    
    // Reset to original pos
    for (let i = 0; i < originalPositions.length; i++) {
      positions[i] = originalPositions[i];
    }
    
    positionAttribute.needsUpdate = true;
  }
}