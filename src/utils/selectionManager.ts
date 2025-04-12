import * as THREE from 'three';
import { ModelExtender } from './modelExtender';
import { TextureManager } from './textureManager';

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

  private textureManager: TextureManager;
  private currentTexturePath: string | null = null;
  
  // Map to store texture paths for each model
  private modelTextures: Map<THREE.Object3D, string> = new Map();
  // Map to store extension factors for each model
  private modelExtensionFactors: Map<THREE.Object3D, number> = new Map();

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
    this.textureManager = new TextureManager();
    
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
    // Save the current extension factor before changing selection
    if (this.selectedObject && this.currentExtensionFactor !== 0) {
      this.modelExtensionFactors.set(this.selectedObject, this.currentExtensionFactor);
    }
    
    // Store current texture before changing selection
    if (this.selectedObject && this.currentTexturePath) {
      this.modelTextures.set(this.selectedObject, this.currentTexturePath);
    }
    
    // Clear the bounding box
    if (this.boundingBox) {
      this.scene.remove(this.boundingBox);
      this.boundingBox = null;
    }
    
    // Set new selected object
    this.selectedObject = object;
    console.log(`Selected object: ${object.name || 'Unnamed object'}`);
    
    // Create a bounding box for the selected object
    this.boundingBox = new THREE.BoxHelper(object, 0xffff00);
    this.scene.add(this.boundingBox);
    
    // Get stored extension factor or default to 0
    this.currentExtensionFactor = this.modelExtensionFactors.get(object) || 0;
    
    // Check if this object has a previously applied texture
    this.currentTexturePath = this.modelTextures.get(object) || null;
    
    // Update UI for the newly selected object
    this.updateSelectionUI();
  }
  
  // Clear only the current selection, not the materials or extensions
  private clearSelection(): void {
    if (this.boundingBox) {
      this.scene.remove(this.boundingBox);
      this.boundingBox = null;
    }
    
    // Save the current extension factor
    if (this.selectedObject && this.currentExtensionFactor !== 0) {
      this.modelExtensionFactors.set(this.selectedObject, this.currentExtensionFactor);
    }
    
    // Save current texture
    if (this.selectedObject && this.currentTexturePath) {
      this.modelTextures.set(this.selectedObject, this.currentTexturePath);
    }
    
    this.selectedObject = null;
    this.currentTexturePath = null;
    this.currentExtensionFactor = 0;
    
    // Hide the selection panel
    const selectionPanel = document.getElementById('selection-panel');
    if (selectionPanel) {
      selectionPanel.style.display = 'none';
    }
  }
  
  private initSelectionUI(): void {
  console.log('Initializing selection UI');
    
  // Setup the extension slider
  const setupExtensionSlider = () => {
  const extensionSlider = document.getElementById('x-extension-slider') as HTMLInputElement;
  const extensionValue = document.getElementById('extension-value');
      
    if (extensionSlider && extensionValue) {
      console.log('Found extension slider element');
        
      extensionSlider.onchange = null;
      extensionSlider.oninput = null;
      
      // Add the event listener
      extensionSlider.addEventListener('input', async (event) => {
        if (!event.target) return;
        
        const value = parseFloat((event.target as HTMLInputElement).value);
        console.log(`Slider value changed: ${value}`);
        
        if (extensionValue) {
          extensionValue.textContent = value.toFixed(2);
        }
        
        // Apply the extension to the selected model
        await this.applyExtension(value);
      });
      
      console.log('Extension slider event binding complete');
    } else {
      console.warn('Extension slider not found in DOM!');
      
      // Try again if not found
      setTimeout(setupExtensionSlider, 100);
    }
  };
  
  this.setupTextureSelector();
  
  // Slider setup on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupExtensionSlider);
  } else {
    setupExtensionSlider();
  }
}
  
    // Selector ui
  private setupTextureSelector(): void {
    const textureContainer = document.getElementById('texture-selector');
    if (!textureContainer) {
      console.warn('Texture selector container not found in DOM');
      return;
    }
    
    // Clear any existing content
    textureContainer.innerHTML = '';
    
    // Get available textures
    const availableTextures = this.textureManager.getAvailableTextures();
    
    // Create the texture selector title
    const title = document.createElement('div');
    title.className = 'texture-title';
    title.textContent = 'Texture Options';
    textureContainer.appendChild(title);
    
    // Create the texture button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'texture-button-container';
    textureContainer.appendChild(buttonContainer);
    
    // Add a button for each texture
    availableTextures.forEach(texture => {
      const button = document.createElement('button');
      button.className = 'texture-button';
      button.textContent = texture.name;
      
      // Use direct event assignment instead of addEventListener
      button.onclick = () => {
        console.log(`Applying texture: ${texture.name}`);
        this.applyTexture(texture.path);
        
        // Update button styles
        document.querySelectorAll('.texture-button').forEach(btn => {
          btn.classList.remove('selected');
        });
        button.classList.add('selected');
      };
      
      buttonContainer.appendChild(button);
    });
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'texture-button reset';
    resetButton.textContent = 'Reset';
    resetButton.onclick = () => {
      console.log('Resetting texture');
      this.resetTexture();
      
      // Remove this object from the texture map
      if (this.selectedObject) {
        this.modelTextures.delete(this.selectedObject);
      }
      
      document.querySelectorAll('.texture-button').forEach(btn => {
        btn.classList.remove('selected');
      });
    };
    
    buttonContainer.appendChild(resetButton);
  }
  
  // Apply texture to selected model
  private async applyTexture(texturePath: string): Promise<void> {
    if (!this.selectedObject) return;
    
    // Skip if it's the same texture
    if (texturePath === this.currentTexturePath) return;
    
    // Apply the new texture
    await this.textureManager.applyTextureToModel(this.selectedObject, texturePath);
    this.currentTexturePath = texturePath;
    
    // Store the texture for this model
    this.modelTextures.set(this.selectedObject, texturePath);
  }
  
  //reset texture to default
  private resetTexture(): void {
    if (!this.selectedObject) return;
    
    this.textureManager.resetModelMaterials(this.selectedObject);
    this.currentTexturePath = null;
    
    // Remove from the texture map
    this.modelTextures.delete(this.selectedObject);
  }
  
  // Apply extension to selected model
  private async applyExtension(factor: number): Promise<void> {
    console.log(`Applying extension factor: ${factor}`);
    if (!this.selectedObject || this.isAnimating) {
      console.log('Cannot apply extension: No object selected or animation in progress');
      return;
    }
    
    // Skip if too small
    if (Math.abs(factor - this.currentExtensionFactor) < 0.01) return;
    
    this.isAnimating = true;
    console.log('Starting extension animation');
    
    try {
      await this.modelExtender.extendModel(
        this.selectedObject,
        factor,
        true,
        300
      );
      
      this.currentExtensionFactor = factor;
      
      // Store the extension factor for this model
      this.modelExtensionFactors.set(this.selectedObject, factor);
      
      console.log('Extension animation completed');
    } catch (error) {
      console.error('Error during extension:', error);
    } finally {
      this.isAnimating = false;
    }
  }

  // Update UI when object selected
  private updateSelectionUI(): void {
    const selectionPanel = document.getElementById('selection-panel');
    const modelNameSpan = document.getElementById('model-name');
    const extensionSlider = document.getElementById('x-extension-slider') as HTMLInputElement;
    const extensionValue = document.getElementById('extension-value');
    
    if (selectionPanel && modelNameSpan && this.selectedObject) {
      // Show panel
      selectionPanel.style.display = 'block';
      modelNameSpan.textContent = this.selectedObject.name || 'Unnamed Model';
      
      // Set extension controls to stored value
      if (extensionSlider && extensionValue) {
        extensionSlider.value = this.currentExtensionFactor.toString();
        extensionValue.textContent = this.currentExtensionFactor.toFixed(2);
        
        // Apply the saved extension if not zero
        if (this.currentExtensionFactor > 0) {
          this.applyExtension(this.currentExtensionFactor);
        }
      }
      
      // Match texture button with the selected object
      document.querySelectorAll('.texture-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Button highlight
      if (this.currentTexturePath) {
        const availableTextures = this.textureManager.getAvailableTextures();
        const matchingTexture = availableTextures.find(t => t.path === this.currentTexturePath);
        
        if (matchingTexture) {
          const buttons = document.querySelectorAll('.texture-button');
          buttons.forEach(btn => {
            if (btn.textContent === matchingTexture.name) {
              btn.classList.add('selected');
            }
          });
        }
        
        // Apply the saved texture
        this.textureManager.applyTextureToModel(this.selectedObject, this.currentTexturePath);
      }
    }
  }
  
  public update(): void {
    if (this.boundingBox && this.selectedObject) {
      this.boundingBox.update();
    }
  }
  
  // Get the currently selected object
  public getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }
}