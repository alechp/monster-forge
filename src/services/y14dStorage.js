/**
 * Y14D Storage Service
 * 
 * Handles uploading sprites and monster data to Yapture Archived (Y14D).
 */

import { settingsStore } from '../stores/useSettingsStore';

/**
 * Convert base64 data URL to Blob
 */
function base64ToBlob(base64, mimeType = 'image/png') {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Y14D Storage Service
 */
export class Y14DStorageService {
  /**
   * Check if Y14D is configured
   */
  isConfigured() {
    return settingsStore.isY14DConfigured();
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return settingsStore.getY14DConfig();
  }
  
  /**
   * Upload a sprite image to Y14D
   * 
   * @param {string} base64 - Base64 encoded sprite image
   * @param {object} metadata - Sprite metadata
   * @returns {Promise<object>} Upload result with URLs
   */
  async uploadSprite(base64, metadata) {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('Y14D not configured. Please add your API key in Settings.');
    }
    
    console.log('[Y14DStorage] Uploading sprite to Y14D...');
    
    try {
      // Convert base64 to Blob
      const spriteBlob = base64ToBlob(base64, 'image/png');
      
      // Create form data
      const formData = new FormData();
      formData.append('spriteFile', spriteBlob, `sprite_${Date.now()}.png`);
      formData.append('metadata', JSON.stringify({
        source: 'monster-forge',
        type: 'sprite',
        ...metadata,
        uploadedAt: new Date().toISOString(),
      }));
      
      // Upload to Y14D
      const response = await fetch(`${config.baseUrl}/api/v1/monster-forge/sprite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Y14DStorage] Upload failed:', errorText);
        throw new Error(`Y14D upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[Y14DStorage] Sprite uploaded successfully:', result.archiveId);
      
      return {
        success: true,
        archiveId: result.archiveId,
        spriteUrl: result.spriteStorageUrl,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error('[Y14DStorage] Sprite upload error:', error);
      throw error;
    }
  }
  
  /**
   * Upload a complete monster (sprite + data) to Y14D
   * 
   * @param {object} monster - Complete monster object
   * @returns {Promise<object>} Upload result with URLs
   */
  async uploadMonster(monster) {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('Y14D not configured. Please add your API key in Settings.');
    }
    
    console.log('[Y14DStorage] Uploading monster to Y14D:', monster.name);
    
    try {
      // Convert base sprite to Blob
      const spriteBlob = base64ToBlob(monster.baseSprite, 'image/png');
      
      // Prepare monster data (without the base64 sprite to reduce size)
      const monsterData = {
        ...monster,
        baseSprite: undefined, // Will be stored as file
        assets: {
          ...monster.assets,
          // Don't include base64 data for poses/animations in JSON
        },
      };
      
      // Create form data
      const formData = new FormData();
      formData.append('spriteFile', spriteBlob, `${monster.name.toLowerCase()}_sprite.png`);
      formData.append('monsterData', JSON.stringify(monsterData));
      formData.append('metadata', JSON.stringify({
        source: 'monster-forge',
        version: '2.0.0',
        type: 'monster',
        name: monster.name,
        primaryElement: monster.primaryElement,
        secondaryElement: monster.secondaryElement,
        creatureType: monster.creatureType,
        evolutionCount: monster.evolutions?.length || 0,
        uploadedAt: new Date().toISOString(),
      }));
      
      // Upload to Y14D
      const response = await fetch(`${config.baseUrl}/api/v1/monster-forge/monster`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Y14DStorage] Upload failed:', errorText);
        throw new Error(`Y14D upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[Y14DStorage] Monster uploaded successfully:', result.archiveId);
      
      return {
        success: true,
        archiveId: result.archiveId,
        spriteUrl: result.spriteStorageUrl,
        dataUrl: result.dataStorageUrl,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error('[Y14DStorage] Monster upload error:', error);
      throw error;
    }
  }
  
  /**
   * Upload a collection of monsters to Y14D
   * 
   * @param {object[]} monsters - Array of monster objects
   * @param {string} collectionName - Name for the collection
   * @returns {Promise<object>} Upload result
   */
  async uploadCollection(monsters, collectionName) {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('Y14D not configured. Please add your API key in Settings.');
    }
    
    console.log('[Y14DStorage] Uploading collection to Y14D:', collectionName);
    
    try {
      // Prepare collection data
      const collectionData = {
        version: '2.0.0',
        generator: 'Monster Forge',
        exportDate: new Date().toISOString(),
        collection: {
          name: collectionName,
          count: monsters.length,
          monsters: monsters.map(m => ({
            ...m,
            baseSprite: undefined, // Will be stored separately
          })),
        },
      };
      
      // Create form data
      const formData = new FormData();
      
      // Add each monster's sprite
      monsters.forEach((monster, index) => {
        const spriteBlob = base64ToBlob(monster.baseSprite, 'image/png');
        formData.append(`sprite_${index}`, spriteBlob, `${monster.name.toLowerCase()}_sprite.png`);
      });
      
      formData.append('collectionData', JSON.stringify(collectionData));
      formData.append('metadata', JSON.stringify({
        source: 'monster-forge',
        version: '2.0.0',
        type: 'collection',
        name: collectionName,
        monsterCount: monsters.length,
        uploadedAt: new Date().toISOString(),
      }));
      
      // Upload to Y14D
      const response = await fetch(`${config.baseUrl}/api/v1/monster-forge/collection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Y14DStorage] Upload failed:', errorText);
        throw new Error(`Y14D upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[Y14DStorage] Collection uploaded successfully:', result.archiveId);
      
      return {
        success: true,
        archiveId: result.archiveId,
        collectionUrl: result.collectionStorageUrl,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error('[Y14DStorage] Collection upload error:', error);
      throw error;
    }
  }
  
  /**
   * List all uploads from Monster Forge
   * 
   * @returns {Promise<object[]>} List of uploads
   */
  async listUploads() {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('Y14D not configured. Please add your API key in Settings.');
    }
    
    try {
      const response = await fetch(`${config.baseUrl}/api/v1/monster-forge/uploads`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list uploads: ${response.status}`);
      }
      
      const result = await response.json();
      return result.uploads || [];
    } catch (error) {
      console.error('[Y14DStorage] List uploads error:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific upload by ID
   * 
   * @param {string} archiveId - The archive ID
   * @returns {Promise<object>} Upload details with presigned URLs
   */
  async getUpload(archiveId) {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('Y14D not configured. Please add your API key in Settings.');
    }
    
    try {
      const response = await fetch(`${config.baseUrl}/api/v1/monster-forge/uploads/${archiveId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get upload: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Y14DStorage] Get upload error:', error);
      throw error;
    }
  }
  
  /**
   * Delete an upload from Y14D
   * 
   * @param {string} archiveId - The archive ID to delete
   * @returns {Promise<void>}
   */
  async deleteUpload(archiveId) {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('Y14D not configured. Please add your API key in Settings.');
    }
    
    try {
      const response = await fetch(`${config.baseUrl}/api/v1/monster-forge/uploads/${archiveId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete upload: ${response.status}`);
      }
      
      console.log('[Y14DStorage] Upload deleted:', archiveId);
    } catch (error) {
      console.error('[Y14DStorage] Delete upload error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const y14dStorage = new Y14DStorageService();

export default y14dStorage;
