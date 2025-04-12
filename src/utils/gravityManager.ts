import * as THREE from 'three';

// Just a fun, self contained script to add a gravity toggle to the scene C:

export class GravityManager {
  private objects: THREE.Object3D[] = [];
  private originalPositions: Map<THREE.Object3D, THREE.Vector3> = new Map();
  private originalRotations: Map<THREE.Object3D, THREE.Quaternion> = new Map();
  private isActive: boolean = false;
  private floatSpeed: number = 0.02;
  private maxHeight: number = 10;
  
  // Random movement
  private objectVelocities: Map<THREE.Object3D, THREE.Vector3> = new Map();
  private objectRotations: Map<THREE.Object3D, THREE.Vector3> = new Map();

  constructor() {
    this.setupUI();
  }

  /// Add an object to the gravity manager
  public addObject(object: THREE.Object3D): void {
    if (this.objects.includes(object)) return;
    
    this.objects.push(object);
    this.storeOriginalTransform(object);
    this.initializeObjectPhysics(object);
  }
  
    public scanScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      // Check if the object is a mesh or group
      if (object instanceof THREE.Group) {
        // Add the group to the gravity manager
        if (object.parent === scene) {
          this.addObject(object);
        }
      }
    });
  }

  /// Store the original pos
  private storeOriginalTransform(object: THREE.Object3D): void {
    this.originalPositions.set(object, object.position.clone());
    this.originalRotations.set(object, object.quaternion.clone());
  }
  
  /// Initialize the object physics
  private initializeObjectPhysics(object: THREE.Object3D): void {
    // Random slight horizontal drift
    this.objectVelocities.set(object, new THREE.Vector3(
      (Math.random() - 1) * 0.01,
      this.floatSpeed * (0.5 + Math.random() * 0.2),
      (Math.random() - 1) * 0.01
    ));
    
    // Random rotation speed
    this.objectRotations.set(object, new THREE.Vector3(
      (Math.random() - 0.5) * 0.005,
      (Math.random() - 0.5) * 0.005,
      (Math.random() - 0.5) * 0.005
    ));
  }

    // Toggle gravity on/off
  public toggleGravity(): void {
    this.isActive = !this.isActive;
    
    if (!this.isActive) {
      this.resetObjects();
    }
    
    // Update UI
    const toggleButton = document.getElementById('gravity-toggle');
    if (toggleButton) {
      toggleButton.classList.toggle('active', this.isActive);
      const toggleLabel = toggleButton.querySelector('.toggle-label');
      if (toggleLabel) {
        toggleLabel.textContent = this.isActive ? 'ON' : 'OFF';
      }
    }
  }

  // Reset all objects to their original pos
  private resetObjects(): void {
    this.objects.forEach(object => {
      const originalPosition = this.originalPositions.get(object);
      const originalRotation = this.originalRotations.get(object);
      
      if (originalPosition && originalRotation) {
        // Reset position and rotation
        object.position.copy(originalPosition);
        object.quaternion.copy(originalRotation);
      }
    });
  }

  // Update the positions and rotations of the objects
  public update(): void {
    if (!this.isActive) return;
    
    this.objects.forEach(object => {
      const velocity = this.objectVelocities.get(object);
      const rotation = this.objectRotations.get(object);
      const originalY = this.originalPositions.get(object)?.y || 0;
      
      if (velocity && rotation) {
        object.position.add(velocity);
        
        object.rotateX(rotation.x);
        object.rotateY(rotation.y);
        object.rotateZ(rotation.z);
        
        // Bounce if reached max height
        if (object.position.y > originalY + this.maxHeight) {
          velocity.y = -velocity.y * 0.5; // Bounce with dampening
        }
        
        velocity.x += (Math.random() - 0.5) * 0.001;
        velocity.z += (Math.random() - 0.5) * 0.001;
        
        velocity.x *= 0.99;
        velocity.z *= 0.99;
      }
    });
  }

  // Setup the UI for the gravity toggle
  private setupUI(): void {
    const uiContainer = document.getElementById('ui-container');
    
    if (!uiContainer) {
      console.error('UI container not found');
      return;
    }
    
    // Create the toggle container
    const gravityToggle = document.createElement('div');
    gravityToggle.id = 'gravity-toggle';
    gravityToggle.className = 'gravity-toggle';
    
    // Create the toggle content
    const toggleHeader = document.createElement('div');
    toggleHeader.className = 'toggle-header';
    toggleHeader.textContent = 'Gravity';
    
    const toggleSwitch = document.createElement('div');
    toggleSwitch.className = 'toggle-switch';
    
    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'toggle-label';
    toggleLabel.textContent = 'OFF';
    
    toggleSwitch.appendChild(toggleLabel);
    
    // Assemble the toggle
    gravityToggle.appendChild(toggleHeader);
    gravityToggle.appendChild(toggleSwitch);
    
    // Add the click event
    gravityToggle.addEventListener('click', () => {
      this.toggleGravity();
    });
    
    uiContainer.appendChild(gravityToggle);
    
    // Add CSS for the toggle
    const style = document.createElement('style');
    style.textContent = `
      .gravity-toggle {
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 12px 15px;
        border-radius: 5px;
        cursor: pointer;
        pointer-events: auto;
        transition: background-color 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100px;
      }
      
      .gravity-toggle:hover {
        background-color: rgba(0, 0, 0, 0.8);
      }
      
      .toggle-header {
        margin-bottom: 8px;
        font-weight: bold;
        font-size: 14px;
      }
      
      .toggle-switch {
        background-color: #444;
        border-radius: 15px;
        padding: 4px 12px;
        width: 60px;
        text-align: center;
        transition: background-color 0.3s;
      }
      
      .gravity-toggle.active .toggle-switch {
        background-color: #4CAF50;
      }
      
      .toggle-label {
        font-size: 12px;
        font-weight: bold;
      }
    `;
    
    document.head.appendChild(style);
  }
}