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
    // Reset extension on previous object if any
    if (this.selectedObject) {
      this.modelExtender.resetModel(this.selectedObject);
      
      // Store current texture before changing selection
      if (this.currentTexturePath) {
        this.modelTextures.set(this.selectedObject, this.currentTexturePath);
      }
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
    
    // Reset extension factor for new selection
    this.currentExtensionFactor = 0;
    
    // Check if this object has a previously applied texture
    this.currentTexturePath = this.modelTextures.get(object) || null;
    
    // Update UI for the newly selected object
    this.updateSelectionUI();
  }
  
  // Clear only the current selection, not the materials
  private clearSelection(): void {
    if (this.boundingBox) {
      this.scene.remove(this.boundingBox);
      this.boundingBox = null;
    }
    
    // Reset only geometry extension, not materials
    if (this.selectedObject) {
      this.modelExtender.resetModel(this.selectedObject);
      
      // Remember texture for this object before deselecting
      if (this.currentTexturePath) {
        this.modelTextures.set(this.selectedObject, this.currentTexturePath);
      }
    }
    
    this.selectedObject = null;
    this.currentTexturePath = null;
    
    // Hide the selection panel
    const selectionPanel = document.getElementById('selection-panel');
    if (selectionPanel) {
      selectionPanel.style.display = 'none';
    }
  }
  
  private initSelectionUI(): void {
    console.log('selection ui started');
        
    // Set up the extension slider - IMPORTANT event binding
    const setupExtensionSlider = () => {
    const extensionSlider = document.getElementById('x-extension-slider') as HTMLInputElement;
    const extensionValue = document.getElementById('extension-value');
      
      if (extensionSlider && extensionValue) {
        
        // Make sure we're not double-binding the event
        extensionSlider.onchange = null;
        extensionSlider.oninput = null;
        
        // Add the event listener
        extensionSlider.oninput = (event) => {
          const value = parseFloat((event.target as HTMLInputElement).value);
          console.log(`Slider value changed: ${value}`);
          
          if (extensionValue) {
            extensionValue.textContent = value.toFixed(2);
          }
          
          // Apply the extension to the selected model
          this.applyExtension(value);
        };
        
      } else {
        console.warn('Extension slider not found!');
      }
    };
    
    // Set up texture selector
    this.setupTextureSelector();
    
    // Make sure slider is set up properly after DOM is loaded
    if (document.readyState === 'complete') {
      setupExtensionSlider();
    } else {
      window.addEventListener('DOMContentLoaded', setupExtensionSlider);
    }
  }
  
  /**
   * Set up the texture selector UI
   */
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
  
  /**
   * Apply a texture to the selected model
   */
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
  
  /**
   * Reset the texture of the selected model to its original
   */
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
      
      // Reset extension controls
      if (extensionSlider && extensionValue) {
        extensionSlider.value = '0';
        extensionValue.textContent = '0';
        this.currentExtensionFactor = 0;
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