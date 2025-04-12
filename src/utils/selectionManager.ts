import * as THREE from 'three';
import { ModelExtender } from './modelExtender';

export class SelectionManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private selectableObjects: THREE.Object3D[] = [];
  private selectedObject: THREE.Object3D | null = null;
  private boundingBox: THREE.BoxHelper | null = null;
  
  private modelExtender: ModelExtender;
  private currentExtensionFactor: number = 0;
  private isAnimating: boolean = false;

  constructor(
    scene: THREE.Scene, 
    camera: THREE.PerspectiveCamera
  ) {
    this.scene = scene;
    this.camera = camera;
    
    // Init
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.modelExtender = new ModelExtender();

    
    this.addEventListeners();
    this.initSelectionUI();
  }

  // Add a selectable object to the list
  public addSelectableObject(object: THREE.Object3D): void {
    this.selectableObjects.push(object);
    console.log(`Added selectable object: ${object.name || 'Unnamed object'}`);
  }
  
  // Remove a selectable object from the list
  private addEventListeners(): void {
    window.addEventListener('contextmenu', this.onRightClick.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
  
  // Track mouse
  private onMouseMove(event: MouseEvent): void {
    // Normalize 
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  // right-click for object selection
  private onRightClick(event: MouseEvent): void {
    event.preventDefault();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    // intersecting objects
    const intersects = this.raycaster.intersectObjects(this.selectableObjects, true);
    
    // Check if any object was intersected
    if (intersects.length > 0) {
      let selectedObject = intersects[0].object;
            while (selectedObject.parent && !this.selectableObjects.includes(selectedObject)) {
        selectedObject = selectedObject.parent;
      }
      
      if (this.selectableObjects.includes(selectedObject)) {
        this.selectObject(selectedObject);
      }
    } else {
      this.clearSelection();
    }
  }
  
  private selectObject(object: THREE.Object3D): void {
    this.clearSelection();
    
    // New selected object
    this.selectedObject = object;
    console.log(`Selected object: ${object.name || 'Unnamed object'}`);
    
    // Spawn bounding box
    this.boundingBox = new THREE.BoxHelper(object, 0xffff00);
    this.scene.add(this.boundingBox);
    
    this.updateSelectionUI();
  }
  
  // Clear the current selection
  private clearSelection(): void {
    if (this.boundingBox) {
      this.scene.remove(this.boundingBox);
      this.boundingBox = null;
    }
    
    // Reset the model to its original state
    if (this.selectedObject) {
      this.modelExtender.resetModel(this.selectedObject);
      this.currentExtensionFactor = 0;
    }
    
    this.selectedObject = null;
    
    // Hide the selection panel
    const selectionPanel = document.getElementById('selection-panel');
    if (selectionPanel) {
      selectionPanel.style.display = 'none';
    }
  }
  
  private initSelectionUI(): void {
    console.log('selection ui started');
        // Set up the extension slider
    const extensionSlider = document.getElementById('x-extension-slider') as HTMLInputElement;
    const extensionValue = document.getElementById('extension-value');
    
    if (extensionSlider && extensionValue) {
      extensionSlider.addEventListener('input', (event) => {
        const value = parseFloat((event.target as HTMLInputElement).value);

        if (extensionValue) {
          extensionValue.textContent = value.toFixed(2);
        }
        
        // Apply the extension to the selected model
        this.applyExtension(value);
      });
    }
  }
  
  // Apply extension to selected model
  private async applyExtension(factor: number): Promise<void> {
    if (!this.selectedObject || this.isAnimating) return;
    
    // Skip if too small
    if (Math.abs(factor - this.currentExtensionFactor) < 0.01) return;
    
    this.isAnimating = true;
    
    await this.modelExtender.extendModel(
      this.selectedObject,
      factor,
      true,
      300
    );
    
    this.currentExtensionFactor = factor;
    this.isAnimating = false;
  }

  // Update UI when object is selected
  private updateSelectionUI(): void {
    const selectionPanel = document.getElementById('selection-panel');
    const modelNameSpan = document.getElementById('model-name');
    const extensionSlider = document.getElementById('x-extension-slider') as HTMLInputElement;
    const extensionValue = document.getElementById('extension-value');
    
    if (selectionPanel && modelNameSpan && this.selectedObject) {
      // Show panel
      selectionPanel.style.display = 'block';
      modelNameSpan.textContent = this.selectedObject.name || 'Unnamed Model';
      
      // Reset
      if (extensionSlider && extensionValue) {
        extensionSlider.value = '0';
        extensionValue.textContent = '0';
        this.currentExtensionFactor = 0;
        
        // Reset to original model
        this.modelExtender.resetModel(this.selectedObject);
      }
    }
  }
  
  public update(): void {
    if (this.boundingBox && this.selectedObject) {
      // Update the bounding box in case the object has moved
      this.boundingBox.update();
    }
  }
  
  // Get the currently selected object
  public getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }
}