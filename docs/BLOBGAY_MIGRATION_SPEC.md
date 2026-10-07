# Monster Forge Migration & Enhancement Specification

## Overview

This specification documents the migration of Monster Forge to the blobgay organization and the implementation of three major enhancements:

1. **PixelLab Integration** - Alternative AI provider for asset and terrain generation
2. **Comprehensive Backup System** - Local-first with configurable storage backends
3. **User Authentication** - BetterAuth-powered user accounts for data persistence

---

## Phase 0: Repository Migration

### Objective

Replicate the monster-forge repository to a new location under the blobgay organization with proper upstream configuration.

### Steps

#### 0.1 Create New Repository Clone

```bash
# Navigate to target directory
cd ~/Code

# Create blobgay directory if it doesn't exist
mkdir -p blobgay
cd blobgay

# Clone the existing repository
cp -r /Users/alechp/Code/alechp/monster-forge ./monster-forge

# Navigate into the new repo
cd monster-forge

# Remove existing git history and reinitialize
rm -rf .git
git init

# Create initial commit on master branch
git checkout -b master
git add .
git commit -m "Initial commit: Monster Forge migration to blobgay org"
```

#### 0.2 Configure Remote and Push

```bash
# Add the new upstream remote
git remote add origin https://github.com/blobgay/monster-forge.git

# Push to master branch
git push -u origin master
```

#### 0.3 Verification Checklist

- [ ] Repository exists at `~/Code/blobgay/monster-forge`
- [ ] Git initialized with `master` branch (not `main`)
- [ ] Remote set to `https://github.com/blobgay/monster-forge`
- [ ] All files pushed successfully
- [ ] `.env` and sensitive files excluded via `.gitignore`

---

## Phase 1: PixelLab Integration

### 1.1 Overview

PixelLab provides AI-powered pixel art generation specifically designed for game assets. Unlike Gemini's general-purpose image generation, PixelLab specializes in:

- **Sprite generation** with consistent pixel density
- **Terrain tiles** with seamless tiling support
- **Animation frames** with proper timing
- **Asset variations** maintaining style consistency

### 1.2 Environment Configuration

#### Update `.env.example`

```bash
# Existing keys
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_key_here
REACT_APP_GOOGLE_API_KEY=your_google_key_here
REACT_APP_FAL_API_KEY=your_fal_key_here

# New: PixelLab API Key (use 1Password CLI for secure retrieval)
# Retrieve with: op read "op://blobgay/PixelLab/api-key"
REACT_APP_PIXELLAB_API_KEY=your_pixellab_key_here
```

#### 1Password Integration

The PixelLab API key is stored in 1Password at: `op://blobgay/PixelLab/api-key`

For local development with 1Password CLI:

```bash
# Retrieve and export the key
export REACT_APP_PIXELLAB_API_KEY=$(op read "op://blobgay/PixelLab/api-key")

# Or add to scripts/setup-env.sh
echo "REACT_APP_PIXELLAB_API_KEY=$(op read 'op://blobgay/PixelLab/api-key')" >> .env.local
```

### 1.3 Service Implementation

#### Create `/src/services/pixelLabService.js`

```javascript
/**
 * PixelLab Service
 * AI-powered pixel art generation for sprites and terrain
 * 
 * Features:
 * - Monster sprite generation
 * - Terrain tile generation with seamless tiling
 * - Animation frame generation
 * - Style-consistent variations
 */

const PIXELLAB_API_BASE = 'https://api.pixellab.ai/v1';

// Generation types supported by PixelLab
export const GENERATION_TYPES = {
  SPRITE: 'sprite',
  TERRAIN: 'terrain',
  ANIMATION: 'animation',
  TILESET: 'tileset',
  ICON: 'icon'
};

// Terrain categories
export const TERRAIN_TYPES = {
  GRASS: 'grass',
  WATER: 'water',
  SAND: 'sand',
  STONE: 'stone',
  SNOW: 'snow',
  LAVA: 'lava',
  FOREST: 'forest',
  CAVE: 'cave',
  PATH: 'path',
  CUSTOM: 'custom'
};

// Sprite sizes matching game standards
export const SPRITE_SIZES = {
  TINY: { width: 16, height: 16 },
  SMALL: { width: 32, height: 32 },
  MEDIUM: { width: 64, height: 64 },
  LARGE: { width: 128, height: 128 },
  XLARGE: { width: 256, height: 256 }
};

class PixelLabService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = PIXELLAB_API_BASE;
  }

  /**
   * Initialize the service with API key
   */
  initialize(apiKey) {
    this.apiKey = apiKey || process.env.REACT_APP_PIXELLAB_API_KEY;
    if (!this.apiKey) {
      console.warn('PixelLab: No API key provided');
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, options = {}) {
    if (!this.apiKey) {
      throw new Error('PixelLab API key not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `PixelLab API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Generate monster sprite from description
   * 
   * @param {Object} options
   * @param {string} options.description - Text description of the monster
   * @param {string} options.element - Primary element type
   * @param {Object} options.size - Sprite dimensions { width, height }
   * @param {string} options.style - Art style (pixel, pixel_hd, etc.)
   * @param {string} options.referenceImage - Base64 reference image (optional)
   * @param {number} options.creativity - Deviation from reference (0-100)
   */
  async generateSprite(options) {
    const {
      description,
      element = 'neutral',
      size = SPRITE_SIZES.MEDIUM,
      style = 'pixel',
      referenceImage = null,
      creativity = 50
    } = options;

    const payload = {
      type: GENERATION_TYPES.SPRITE,
      prompt: this.buildSpritePrompt(description, element),
      width: size.width,
      height: size.height,
      style: style,
      creativity: creativity / 100,
      transparent_background: true
    };

    if (referenceImage) {
      payload.reference_image = referenceImage;
    }

    const result = await this.apiRequest('/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      imageData: result.image,
      metadata: {
        provider: 'pixellab',
        type: 'sprite',
        size: size,
        style: style,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate terrain tile
   * 
   * @param {Object} options
   * @param {string} options.terrainType - Type of terrain from TERRAIN_TYPES
   * @param {Object} options.size - Tile dimensions
   * @param {boolean} options.seamless - Generate seamlessly tileable texture
   * @param {string} options.variant - Variation style (base, worn, lush, etc.)
   * @param {Object} options.colorPalette - Custom color constraints
   */
  async generateTerrain(options) {
    const {
      terrainType = TERRAIN_TYPES.GRASS,
      size = { width: 32, height: 32 },
      seamless = true,
      variant = 'base',
      colorPalette = null
    } = options;

    const payload = {
      type: GENERATION_TYPES.TERRAIN,
      prompt: this.buildTerrainPrompt(terrainType, variant),
      width: size.width,
      height: size.height,
      seamless: seamless,
      style: 'pixel'
    };

    if (colorPalette) {
      payload.color_constraints = colorPalette;
    }

    const result = await this.apiRequest('/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      imageData: result.image,
      metadata: {
        provider: 'pixellab',
        type: 'terrain',
        terrainType: terrainType,
        seamless: seamless,
        size: size,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate complete tileset for terrain
   * 
   * @param {Object} options
   * @param {string} options.terrainType - Base terrain type
   * @param {number} options.tileSize - Size of individual tiles
   * @param {boolean} options.includeTransitions - Generate edge transitions
   * @param {Array<string>} options.transitionTo - Terrain types to transition to
   */
  async generateTileset(options) {
    const {
      terrainType = TERRAIN_TYPES.GRASS,
      tileSize = 32,
      includeTransitions = true,
      transitionTo = []
    } = options;

    const payload = {
      type: GENERATION_TYPES.TILESET,
      terrain_type: terrainType,
      tile_size: tileSize,
      include_transitions: includeTransitions,
      transition_targets: transitionTo,
      style: 'pixel'
    };

    const result = await this.apiRequest('/generate/tileset', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      tileset: result.tileset,
      tiles: result.tiles,
      transitionMap: result.transition_map,
      metadata: {
        provider: 'pixellab',
        type: 'tileset',
        terrainType: terrainType,
        tileCount: result.tiles?.length || 0,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate animation frames for a sprite
   * 
   * @param {Object} options
   * @param {string} options.baseSprite - Base64 of the base sprite
   * @param {string} options.animationType - Type of animation (idle, walk, attack, etc.)
   * @param {number} options.frameCount - Number of frames to generate
   * @param {number} options.fps - Target frames per second
   */
  async generateAnimation(options) {
    const {
      baseSprite,
      animationType = 'idle',
      frameCount = 4,
      fps = 12
    } = options;

    const payload = {
      type: GENERATION_TYPES.ANIMATION,
      reference_image: baseSprite,
      animation_type: animationType,
      frame_count: frameCount,
      fps: fps,
      style: 'pixel'
    };

    const result = await this.apiRequest('/generate/animation', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      frames: result.frames,
      spriteSheet: result.sprite_sheet,
      metadata: {
        provider: 'pixellab',
        type: 'animation',
        animationType: animationType,
        frameCount: result.frames?.length || frameCount,
        fps: fps,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate pose variants for a monster
   * Similar to NanoBanana but through PixelLab
   */
  async generatePose(options) {
    const {
      baseSprite,
      pose = 'front',
      size = SPRITE_SIZES.MEDIUM,
      preserveStyle = true
    } = options;

    const payload = {
      type: GENERATION_TYPES.SPRITE,
      reference_image: baseSprite,
      pose: pose,
      width: size.width,
      height: size.height,
      preserve_style: preserveStyle,
      transparent_background: true
    };

    const result = await this.apiRequest('/generate/pose', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      imageData: result.image,
      metadata: {
        provider: 'pixellab',
        type: 'pose',
        pose: pose,
        size: size,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Batch generate multiple assets
   * 
   * @param {Array<Object>} requests - Array of generation requests
   * @param {Function} onProgress - Progress callback
   */
  async batchGenerate(requests, onProgress = null) {
    const results = [];
    const total = requests.length;

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      try {
        let result;
        switch (request.type) {
          case GENERATION_TYPES.SPRITE:
            result = await this.generateSprite(request);
            break;
          case GENERATION_TYPES.TERRAIN:
            result = await this.generateTerrain(request);
            break;
          case GENERATION_TYPES.ANIMATION:
            result = await this.generateAnimation(request);
            break;
          case GENERATION_TYPES.TILESET:
            result = await this.generateTileset(request);
            break;
          default:
            throw new Error(`Unknown generation type: ${request.type}`);
        }

        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ success: false, error: error.message, request });
      }

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: total,
          percent: Math.round(((i + 1) / total) * 100),
          lastResult: results[results.length - 1]
        });
      }
    }

    return results;
  }

  /**
   * Build optimized prompt for sprite generation
   */
  buildSpritePrompt(description, element) {
    const elementColors = {
      Fire: 'warm oranges, reds, and yellows',
      Water: 'cool blues and teals',
      Earth: 'browns, greens, and grays',
      Air: 'light blues, whites, and silver',
      Electric: 'bright yellows and electric blues',
      Shadow: 'deep purples and blacks',
      Light: 'golden yellows and bright whites',
      Nature: 'vibrant greens and earth tones',
      Ice: 'icy blues, whites, and pale cyans',
      Psychic: 'pinks, purples, and magentas'
    };

    const colors = elementColors[element] || 'natural colors';
    
    return `Pixel art game sprite: ${description}. ${element} element creature with ${colors}. Transparent background, clean edges, game-ready asset.`;
  }

  /**
   * Build optimized prompt for terrain generation
   */
  buildTerrainPrompt(terrainType, variant) {
    const terrainDescriptions = {
      grass: 'lush green grass tiles with subtle texture variation',
      water: 'animated water surface with gentle waves and ripples',
      sand: 'desert sand with fine grain texture and subtle dunes',
      stone: 'rough stone surface with natural cracks and texture',
      snow: 'pristine white snow with soft shadows and sparkle',
      lava: 'molten lava with glowing orange cracks and heat shimmer',
      forest: 'forest floor with leaves, twigs, and moss',
      cave: 'dark cave floor with rocky texture and shadows',
      path: 'worn dirt path with footprints and grass edges'
    };

    const baseDescription = terrainDescriptions[terrainType] || terrainType;
    const variantSuffix = variant !== 'base' ? `, ${variant} style` : '';

    return `Pixel art game terrain tile: ${baseDescription}${variantSuffix}. Top-down perspective, seamlessly tileable, 16-bit aesthetic.`;
  }
}

// Singleton export
export const pixelLabService = new PixelLabService();
export default pixelLabService;
```

### 1.4 UI Integration

#### Update Settings Store

Add PixelLab configuration to `/src/stores/useSettingsStore.js`:

```javascript
// Add to initial state
pixelLabApiKey: '',
preferredAssetProvider: 'gemini', // 'gemini' | 'pixellab'
preferredTerrainProvider: 'pixellab', // 'pixellab' is default for terrain

// Add to actions
setPixelLabApiKey: (key) => set({ pixelLabApiKey: key }),
setPreferredAssetProvider: (provider) => set({ preferredAssetProvider: provider }),
setPreferredTerrainProvider: (provider) => set({ preferredTerrainProvider: provider }),
```

#### Add Terrain Tab Component

Create `/src/components/tabs/TerrainTab.jsx`:

```javascript
/**
 * TerrainTab Component
 * Generate terrain tiles and tilesets using PixelLab
 */

import React, { useState } from 'react';
import { pixelLabService, TERRAIN_TYPES, SPRITE_SIZES } from '../../services/pixelLabService';

export default function TerrainTab({ onTerrainGenerated }) {
  const [terrainType, setTerrainType] = useState(TERRAIN_TYPES.GRASS);
  const [tileSize, setTileSize] = useState(32);
  const [seamless, setSeamless] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTerrain, setGeneratedTerrain] = useState([]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await pixelLabService.generateTerrain({
        terrainType,
        size: { width: tileSize, height: tileSize },
        seamless
      });
      
      setGeneratedTerrain(prev => [...prev, result]);
      
      if (onTerrainGenerated) {
        onTerrainGenerated(result);
      }
    } catch (error) {
      console.error('Terrain generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="terrain-tab">
      <h3>Terrain Generator</h3>
      
      <div className="terrain-controls">
        <label>
          Terrain Type:
          <select 
            value={terrainType} 
            onChange={(e) => setTerrainType(e.target.value)}
          >
            {Object.entries(TERRAIN_TYPES).map(([key, value]) => (
              <option key={key} value={value}>{key}</option>
            ))}
          </select>
        </label>

        <label>
          Tile Size:
          <select 
            value={tileSize} 
            onChange={(e) => setTileSize(Number(e.target.value))}
          >
            <option value={16}>16x16</option>
            <option value={32}>32x32</option>
            <option value={64}>64x64</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={seamless}
            onChange={(e) => setSeamless(e.target.checked)}
          />
          Seamless Tiling
        </label>

        <button 
          onClick={handleGenerate} 
          disabled={generating || !pixelLabService.isAvailable()}
        >
          {generating ? 'Generating...' : 'Generate Terrain'}
        </button>
      </div>

      <div className="generated-terrain-grid">
        {generatedTerrain.map((terrain, index) => (
          <div key={index} className="terrain-tile">
            <img 
              src={`data:image/png;base64,${terrain.imageData}`} 
              alt={`${terrain.metadata.terrainType} terrain`}
            />
            <span>{terrain.metadata.terrainType}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Update Settings Modal

Add PixelLab configuration section to `/src/components/SettingsModal.jsx`:

```javascript
// Add PixelLab settings section
<div className="settings-section">
  <h4>PixelLab Configuration</h4>
  
  <label>
    API Key:
    <input
      type="password"
      value={settings.pixelLabApiKey}
      onChange={(e) => updateSettings({ pixelLabApiKey: e.target.value })}
      placeholder="Enter PixelLab API key"
    />
  </label>

  <label>
    Preferred Asset Provider:
    <select
      value={settings.preferredAssetProvider}
      onChange={(e) => updateSettings({ preferredAssetProvider: e.target.value })}
    >
      <option value="gemini">Google Gemini</option>
      <option value="pixellab">PixelLab</option>
    </select>
  </label>

  <label>
    Preferred Terrain Provider:
    <select
      value={settings.preferredTerrainProvider}
      onChange={(e) => updateSettings({ preferredTerrainProvider: e.target.value })}
    >
      <option value="pixellab">PixelLab (Recommended)</option>
      <option value="gemini">Google Gemini</option>
    </select>
  </label>

  <button onClick={testPixelLabConnection}>
    Test PixelLab Connection
  </button>
</div>
```

### 1.5 Provider Abstraction Layer

Create `/src/services/assetProviderService.js`:

```javascript
/**
 * Asset Provider Service
 * Unified interface for asset generation across providers
 */

import { nanoBananaService } from './nanoBanana';
import { pixelLabService, GENERATION_TYPES } from './pixelLabService';

class AssetProviderService {
  constructor() {
    this.providers = {
      gemini: nanoBananaService,
      pixellab: pixelLabService
    };
  }

  /**
   * Get the appropriate provider based on settings and asset type
   */
  getProvider(assetType, preferredProvider = null) {
    // Terrain defaults to PixelLab if available
    if (assetType === 'terrain' && pixelLabService.isAvailable()) {
      return this.providers.pixellab;
    }

    // Use preferred provider if available
    if (preferredProvider && this.providers[preferredProvider]?.isAvailable()) {
      return this.providers[preferredProvider];
    }

    // Fallback chain
    if (pixelLabService.isAvailable()) return this.providers.pixellab;
    if (nanoBananaService.isAvailable()) return this.providers.gemini;

    throw new Error('No asset generation provider available');
  }

  /**
   * Generate sprite with automatic provider selection
   */
  async generateSprite(options, preferredProvider = null) {
    const provider = this.getProvider('sprite', preferredProvider);
    
    if (provider === this.providers.pixellab) {
      return pixelLabService.generateSprite(options);
    } else {
      return nanoBananaService.generateWithStyle(
        options.referenceImage,
        options.style || 'pixel',
        options
      );
    }
  }

  /**
   * Generate terrain (PixelLab exclusive, with Gemini fallback)
   */
  async generateTerrain(options) {
    if (pixelLabService.isAvailable()) {
      return pixelLabService.generateTerrain(options);
    }
    
    // Fallback: Use Gemini with terrain-specific prompt
    return nanoBananaService.generateWithStyle(null, 'pixel', {
      prompt: `Pixel art terrain tile: ${options.terrainType}`,
      size: options.size
    });
  }

  /**
   * List available providers
   */
  getAvailableProviders() {
    return Object.entries(this.providers)
      .filter(([_, provider]) => provider.isAvailable())
      .map(([name, _]) => name);
  }
}

export const assetProviderService = new AssetProviderService();
export default assetProviderService;
```

---

## Phase 2: Comprehensive Backup System

### 2.1 Overview

Implement a robust backup system that:

- Backs up ALL generated content automatically
- Supports local storage as default
- Provides extensible backend for future cloud storage options
- Maintains backup history with versioning
- Allows restoration from any backup point

### 2.2 Backup Service Implementation

Create `/src/services/backupService.js`:

```javascript
/**
 * Backup Service
 * Comprehensive backup system for Monster Forge assets
 * 
 * Storage Backends:
 * - local: Browser IndexedDB (default)
 * - filesystem: Electron/Node filesystem (future)
 * - y14d: Y14D cloud storage
 * - s3: AWS S3 compatible storage (future)
 * - custom: User-defined endpoint (future)
 */

// IndexedDB configuration
const DB_NAME = 'monster-forge-backups';
const DB_VERSION = 1;
const STORES = {
  ORIGINALS: 'originals',
  TRANSFORMATIONS: 'transformations',
  TERRAIN: 'terrain',
  SETTINGS: 'settings',
  METADATA: 'metadata'
};

class BackupService {
  constructor() {
    this.db = null;
    this.currentBackend = 'local';
    this.backendConfig = {};
    this.autoBackupEnabled = true;
    this.backupInterval = null;
  }

  /**
   * Initialize the backup service
   */
  async initialize(config = {}) {
    this.backendConfig = config;
    this.currentBackend = config.backend || 'local';
    this.autoBackupEnabled = config.autoBackup !== false;

    if (this.currentBackend === 'local') {
      await this.initializeIndexedDB();
    }

    if (this.autoBackupEnabled) {
      this.startAutoBackup(config.interval || 300000); // 5 minutes default
    }

    return true;
  }

  /**
   * Initialize IndexedDB for local storage
   */
  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        });

        // Create backup history store
        if (!db.objectStoreNames.contains('backup_history')) {
          const historyStore = db.createObjectStore('backup_history', { 
            keyPath: 'backupId',
            autoIncrement: true 
          });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Backup a single item
   * 
   * @param {string} type - Type of content (original, transformation, terrain, etc.)
   * @param {Object} data - The data to backup
   * @param {Object} options - Backup options
   */
  async backupItem(type, data, options = {}) {
    const backupRecord = {
      id: data.id || this.generateId(),
      type: type,
      data: data,
      timestamp: new Date().toISOString(),
      version: options.version || 1,
      metadata: {
        provider: data.metadata?.provider || 'unknown',
        originalId: options.originalId,
        tags: options.tags || []
      }
    };

    switch (this.currentBackend) {
      case 'local':
        return this.saveToIndexedDB(type, backupRecord);
      case 'y14d':
        return this.saveToY14D(type, backupRecord);
      case 'custom':
        return this.saveToCustomBackend(type, backupRecord);
      default:
        return this.saveToIndexedDB(type, backupRecord);
    }
  }

  /**
   * Backup all current data
   */
  async backupAll(data, options = {}) {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    
    const results = {
      backupId,
      timestamp,
      items: {
        originals: 0,
        transformations: 0,
        terrain: 0,
        settings: 0
      },
      errors: []
    };

    // Backup originals
    if (data.originals?.length) {
      for (const original of data.originals) {
        try {
          await this.backupItem(STORES.ORIGINALS, original, { backupId });
          results.items.originals++;
        } catch (error) {
          results.errors.push({ type: 'original', id: original.id, error: error.message });
        }
      }
    }

    // Backup transformations
    if (data.transformations?.length) {
      for (const transformation of data.transformations) {
        try {
          await this.backupItem(STORES.TRANSFORMATIONS, transformation, { backupId });
          results.items.transformations++;
        } catch (error) {
          results.errors.push({ type: 'transformation', id: transformation.id, error: error.message });
        }
      }
    }

    // Backup terrain
    if (data.terrain?.length) {
      for (const tile of data.terrain) {
        try {
          await this.backupItem(STORES.TERRAIN, tile, { backupId });
          results.items.terrain++;
        } catch (error) {
          results.errors.push({ type: 'terrain', id: tile.id, error: error.message });
        }
      }
    }

    // Backup settings
    if (data.settings) {
      try {
        await this.backupItem(STORES.SETTINGS, { 
          id: 'current_settings', 
          ...data.settings 
        }, { backupId });
        results.items.settings = 1;
      } catch (error) {
        results.errors.push({ type: 'settings', error: error.message });
      }
    }

    // Record backup in history
    await this.recordBackupHistory(results);

    return results;
  }

  /**
   * Save to IndexedDB
   */
  async saveToIndexedDB(storeName, record) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(record.id);
    });
  }

  /**
   * Save to Y14D cloud storage
   */
  async saveToY14D(type, record) {
    const { y14dStorage } = await import('./y14dStorage');
    
    // Map type to Y14D endpoint
    const endpointMap = {
      [STORES.ORIGINALS]: 'sprite',
      [STORES.TRANSFORMATIONS]: 'monster',
      [STORES.TERRAIN]: 'sprite',
      [STORES.SETTINGS]: 'collection'
    };

    return y14dStorage.upload(endpointMap[type] || 'sprite', record.data, record.metadata);
  }

  /**
   * Save to custom backend
   */
  async saveToCustomBackend(type, record) {
    const { endpoint, headers } = this.backendConfig.custom || {};
    
    if (!endpoint) {
      throw new Error('Custom backend endpoint not configured');
    }

    const response = await fetch(`${endpoint}/backup/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      throw new Error(`Custom backend error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Restore from backup
   */
  async restore(backupId = null, options = {}) {
    switch (this.currentBackend) {
      case 'local':
        return this.restoreFromIndexedDB(backupId, options);
      case 'y14d':
        return this.restoreFromY14D(backupId, options);
      default:
        return this.restoreFromIndexedDB(backupId, options);
    }
  }

  /**
   * Restore from IndexedDB
   */
  async restoreFromIndexedDB(backupId, options = {}) {
    const results = {
      originals: [],
      transformations: [],
      terrain: [],
      settings: null
    };

    const storeMapping = [
      [STORES.ORIGINALS, 'originals'],
      [STORES.TRANSFORMATIONS, 'transformations'],
      [STORES.TERRAIN, 'terrain'],
      [STORES.SETTINGS, 'settings']
    ];

    for (const [storeName, resultKey] of storeMapping) {
      const items = await this.getAllFromStore(storeName);
      
      if (resultKey === 'settings') {
        results[resultKey] = items.find(i => i.id === 'current_settings')?.data || null;
      } else {
        results[resultKey] = items.map(item => item.data);
      }
    }

    return results;
  }

  /**
   * Get all items from a store
   */
  async getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Record backup in history
   */
  async recordBackupHistory(results) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['backup_history'], 'readwrite');
      const store = transaction.objectStore('backup_history');
      const request = store.add({
        backupId: results.backupId,
        timestamp: results.timestamp,
        itemCounts: results.items,
        errorCount: results.errors.length,
        backend: this.currentBackend
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get backup history
   */
  async getBackupHistory(limit = 50) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['backup_history'], 'readonly');
      const store = transaction.objectStore('backup_history');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const history = [];
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && history.length < limit) {
          history.push(cursor.value);
          cursor.continue();
        } else {
          resolve(history);
        }
      };
    });
  }

  /**
   * Export backup to file
   */
  async exportToFile() {
    const data = await this.restore();
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `monster-forge-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return exportData;
  }

  /**
   * Import backup from file
   */
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          
          if (!importData.version || !importData.data) {
            throw new Error('Invalid backup file format');
          }

          const results = await this.backupAll(importData.data, { 
            imported: true,
            originalExportDate: importData.exportedAt 
          });

          resolve({ imported: true, ...results });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Start automatic backup
   */
  startAutoBackup(intervalMs = 300000) {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = setInterval(async () => {
      try {
        // Get current data from localStorage as fallback
        const originals = JSON.parse(localStorage.getItem('monster-forge-originals') || '[]');
        const transformations = JSON.parse(localStorage.getItem('monster-forge-transformations') || '[]');
        const settings = JSON.parse(localStorage.getItem('monster-forge-settings') || '{}');

        await this.backupAll({ originals, transformations, settings });
        console.log('Auto-backup completed');
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  /**
   * Set backup backend
   */
  setBackend(backend, config = {}) {
    this.currentBackend = backend;
    this.backendConfig = { ...this.backendConfig, ...config };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    if (this.currentBackend !== 'local') {
      return { backend: this.currentBackend, stats: 'N/A' };
    }

    const stats = {
      backend: 'local',
      stores: {}
    };

    for (const storeName of Object.values(STORES)) {
      const items = await this.getAllFromStore(storeName);
      stats.stores[storeName] = {
        count: items.length,
        estimatedSize: JSON.stringify(items).length
      };
    }

    return stats;
  }
}

// Singleton export
export const backupService = new BackupService();
export default backupService;
```

### 2.3 Backup Settings UI

Add to `/src/components/SettingsModal.jsx`:

```javascript
// Backup configuration section
<div className="settings-section">
  <h4>Backup Configuration</h4>

  <label>
    Storage Backend:
    <select
      value={settings.backupBackend}
      onChange={(e) => updateSettings({ backupBackend: e.target.value })}
    >
      <option value="local">Local (IndexedDB)</option>
      <option value="y14d">Y14D Cloud</option>
      <option value="custom">Custom Endpoint</option>
    </select>
  </label>

  {settings.backupBackend === 'custom' && (
    <label>
      Custom Endpoint URL:
      <input
        type="text"
        value={settings.customBackupEndpoint}
        onChange={(e) => updateSettings({ customBackupEndpoint: e.target.value })}
        placeholder="https://your-backup-server.com/api"
      />
    </label>
  )}

  <label>
    <input
      type="checkbox"
      checked={settings.autoBackupEnabled}
      onChange={(e) => updateSettings({ autoBackupEnabled: e.target.checked })}
    />
    Enable Auto-Backup
  </label>

  <label>
    Backup Interval:
    <select
      value={settings.backupInterval}
      onChange={(e) => updateSettings({ backupInterval: Number(e.target.value) })}
      disabled={!settings.autoBackupEnabled}
    >
      <option value={60000}>Every 1 minute</option>
      <option value={300000}>Every 5 minutes</option>
      <option value={900000}>Every 15 minutes</option>
      <option value={1800000}>Every 30 minutes</option>
    </select>
  </label>

  <div className="backup-actions">
    <button onClick={handleManualBackup}>
      Backup Now
    </button>
    <button onClick={handleExportBackup}>
      Export to File
    </button>
    <button onClick={handleImportBackup}>
      Import from File
    </button>
    <button onClick={handleViewBackupHistory}>
      View History
    </button>
  </div>
</div>
```

### 2.4 Integration with Generation Flow

Update `/src/App.jsx` to automatically backup generated content:

```javascript
// Import backup service
import { backupService } from './services/backupService';

// Initialize backup service on mount
useEffect(() => {
  backupService.initialize({
    backend: settings.backupBackend || 'local',
    autoBackup: settings.autoBackupEnabled,
    interval: settings.backupInterval
  });
}, []);

// After any generation completes, backup the result
const handleGenerationComplete = async (type, data) => {
  // Existing logic...
  
  // Automatic backup
  try {
    await backupService.backupItem(type, data, {
      provider: data.metadata?.provider,
      tags: [data.element, data.style].filter(Boolean)
    });
  } catch (error) {
    console.warn('Backup failed:', error);
    // Non-blocking - generation still succeeds
  }
};
```

---

## Phase 3: BetterAuth User Authentication

### 3.1 Overview

Implement user authentication using [BetterAuth](https://better-auth.com/) to:

- Allow users to create accounts
- Persist data across devices
- Enable data sharing and collaboration
- Provide secure API key storage

### 3.2 Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "better-auth": "^1.0.0",
    "@better-auth/react": "^1.0.0"
  }
}
```

### 3.3 Auth Configuration

Create `/src/auth/auth.config.js`:

```javascript
/**
 * BetterAuth Configuration
 * Authentication setup for Monster Forge
 */

import { betterAuth } from 'better-auth';

export const authConfig = {
  // Database adapter (configure based on backend)
  database: {
    // For serverless/edge deployments
    type: 'postgres', // or 'mysql', 'sqlite', 'mongodb'
    connectionString: process.env.DATABASE_URL
  },

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true for production
    minPasswordLength: 8
  },

  // OAuth providers (optional)
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET
    }
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },

  // User schema extensions
  user: {
    additionalFields: {
      displayName: {
        type: 'string',
        required: false
      },
      avatarUrl: {
        type: 'string', 
        required: false
      },
      preferences: {
        type: 'json',
        required: false,
        defaultValue: {}
      }
    }
  },

  // Callbacks
  callbacks: {
    onUserCreated: async (user) => {
      console.log('New user created:', user.id);
      // Initialize user data in database
    },
    onSessionCreated: async (session) => {
      console.log('Session created for user:', session.userId);
    }
  },

  // Security
  rateLimit: {
    window: 60, // 1 minute
    max: 10 // 10 requests per window
  },

  // Trusted origins
  trustedOrigins: [
    'http://localhost:3000',
    'https://monster-forge.blobgay.com' // Production URL
  ]
};

export const auth = betterAuth(authConfig);
```

### 3.4 Auth Client

Create `/src/auth/authClient.js`:

```javascript
/**
 * BetterAuth Client
 * React hooks and utilities for authentication
 */

import { createAuthClient } from '@better-auth/react';

const authClient = createAuthClient({
  baseURL: process.env.REACT_APP_AUTH_URL || 'http://localhost:3000/api/auth'
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient;

// Enhanced sign in with provider
export async function signInWithProvider(provider) {
  return signIn.social({
    provider,
    callbackURL: window.location.origin + '/auth/callback'
  });
}

// Sign up with email
export async function signUpWithEmail(email, password, name) {
  return signUp.email({
    email,
    password,
    name,
    callbackURL: window.location.origin + '/dashboard'
  });
}

// Sign in with email
export async function signInWithEmail(email, password) {
  return signIn.email({
    email,
    password,
    callbackURL: window.location.origin + '/dashboard'
  });
}

// Password reset
export async function resetPassword(email) {
  return authClient.forgetPassword({
    email,
    redirectTo: window.location.origin + '/auth/reset-password'
  });
}

export default authClient;
```

### 3.5 Auth Context Provider

Create `/src/auth/AuthContext.jsx`:

```javascript
/**
 * Auth Context Provider
 * Wraps the app with authentication state
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from './authClient';
import { backupService } from '../services/backupService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, isPending, error } = useSession();
  const [userPreferences, setUserPreferences] = useState(null);

  const user = session?.user || null;
  const isAuthenticated = !!user;
  const isLoading = isPending;

  // Load user preferences when authenticated
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      // Load from backend or use cached
      const prefs = user.preferences || {};
      setUserPreferences(prefs);

      // Configure backup service based on user preferences
      if (prefs.backupBackend) {
        backupService.setBackend(prefs.backupBackend, prefs.backupConfig);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      // Update on server
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      });

      setUserPreferences(prev => ({ ...prev, ...newPrefs }));
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const logout = async () => {
    // Backup before logout
    try {
      await backupService.backupAll({
        originals: JSON.parse(localStorage.getItem('monster-forge-originals') || '[]'),
        transformations: JSON.parse(localStorage.getItem('monster-forge-transformations') || '[]')
      });
    } catch (error) {
      console.warn('Pre-logout backup failed:', error);
    }

    await signOut();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    userPreferences,
    updatePreferences,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
```

### 3.6 Login Page Component

Create `/src/components/auth/LoginPage.jsx`:

```javascript
/**
 * Login Page Component
 * Dedicated authentication page for Monster Forge
 */

import React, { useState } from 'react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithProvider,
  resetPassword 
} from '../../auth/authClient';
import { useAuth } from '../../auth/AuthContext';
import { theme } from '../../styles/theme';

export default function LoginPage({ onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      switch (mode) {
        case 'login':
          await signInWithEmail(email, password);
          onSuccess?.();
          break;

        case 'register':
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
          }
          await signUpWithEmail(email, password, displayName);
          setMessage('Account created! Please check your email to verify.');
          setMode('login');
          break;

        case 'reset':
          await resetPassword(email);
          setMessage('Password reset email sent. Check your inbox.');
          setMode('login');
          break;

        default:
          break;
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Monster Forge</h1>
          <p style={styles.subtitle}>
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'register' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {message && (
          <div style={styles.messageBox}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />
          </div>

          {mode !== 'reset' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={styles.input}
              />
            </div>
          )}

          {mode === 'register' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                style={styles.input}
              />
            </div>
          )}

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Create Account' :
              'Send Reset Link'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerText}>or continue with</span>
            </div>

            <div style={styles.socialButtons}>
              <button
                onClick={() => handleSocialLogin('github')}
                style={styles.socialButton}
                disabled={loading}
              >
                GitHub
              </button>
              <button
                onClick={() => handleSocialLogin('google')}
                style={styles.socialButton}
                disabled={loading}
              >
                Google
              </button>
              <button
                onClick={() => handleSocialLogin('discord')}
                style={styles.socialButton}
                disabled={loading}
              >
                Discord
              </button>
            </div>
          </>
        )}

        <div style={styles.footer}>
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('reset')}
                style={styles.linkButton}
              >
                Forgot password?
              </button>
              <span style={styles.footerText}>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  style={styles.linkButton}
                >
                  Sign up
                </button>
              </span>
            </>
          )}

          {mode === 'register' && (
            <span style={styles.footerText}>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                style={styles.linkButton}
              >
                Sign in
              </button>
            </span>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => setMode('login')}
              style={styles.linkButton}
            >
              Back to sign in
            </button>
          )}
        </div>

        <div style={styles.guestOption}>
          <button
            onClick={onSuccess}
            style={styles.guestButton}
          >
            Continue as Guest
          </button>
          <p style={styles.guestNote}>
            Your data will only be saved locally
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
    padding: '20px'
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    color: theme.colors.text,
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    color: theme.colors.text,
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  submitButton: {
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: '12px'
  },
  dividerText: {
    color: theme.colors.textSecondary,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    flex: 1,
    textAlign: 'center'
  },
  socialButtons: {
    display: 'flex',
    gap: '12px'
  },
  socialButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: 'transparent',
    color: theme.colors.text,
    fontSize: '14px',
    cursor: 'pointer'
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: '14px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: theme.colors.primary,
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#ef4444',
    fontSize: '14px'
  },
  messageBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid #22c55e',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#22c55e',
    fontSize: '14px'
  },
  loadingSpinner: {
    color: theme.colors.text,
    fontSize: '16px'
  },
  guestOption: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: `1px solid ${theme.colors.border}`,
    textAlign: 'center'
  },
  guestButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: 'transparent',
    color: theme.colors.textSecondary,
    fontSize: '14px',
    cursor: 'pointer'
  },
  guestNote: {
    marginTop: '8px',
    color: theme.colors.textSecondary,
    fontSize: '12px'
  }
};
```

### 3.7 App Integration

Update `/src/App.jsx` to include authentication:

```javascript
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './components/auth/LoginPage';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  // Show login page if not authenticated and not in guest mode
  if (!isLoading && !isAuthenticated && !guestMode) {
    return <LoginPage onSuccess={() => setGuestMode(true)} />;
  }

  // Rest of the app...
  return (
    <div className="app">
      {/* Existing app content */}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

### 3.8 Backend API Routes (Server-side)

For a complete BetterAuth implementation, you'll need backend API routes. Here's an example using a serverless function:

Create `/api/auth/[...all].js` (for Next.js/Vercel) or equivalent:

```javascript
import { auth } from '../../src/auth/auth.config';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### 3.9 Database Schema

BetterAuth requires the following database tables (auto-created by BetterAuth):

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Accounts table (for OAuth)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Verification tokens
CREATE TABLE verification_tokens (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- User preferences (custom extension)
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  api_keys_encrypted TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 4: Environment Variables Summary

### Complete `.env.example`

```bash
# ===================
# AI Provider Keys
# ===================

# Claude Vision (sprite analysis)
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_key_here

# Google Gemini (image generation)
REACT_APP_GOOGLE_API_KEY=your_google_key_here

# fal.ai (alternative generation)
REACT_APP_FAL_API_KEY=your_fal_key_here

# PixelLab (sprites & terrain)
# Retrieve with: op read "op://blobgay/PixelLab/api-key"
REACT_APP_PIXELLAB_API_KEY=your_pixellab_key_here

# ===================
# Storage & Backup
# ===================

# Y14D Cloud Storage
REACT_APP_Y14D_BASE_URL=http://localhost:4740
REACT_APP_Y14D_API_KEY=your_y14d_key_here

# Custom backup endpoint (optional)
REACT_APP_BACKUP_ENDPOINT=

# ===================
# Authentication
# ===================

# Auth service URL
REACT_APP_AUTH_URL=http://localhost:3000/api/auth

# Database connection
DATABASE_URL=postgres://user:pass@localhost:5432/monster_forge

# OAuth Providers (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# ===================
# Development
# ===================

# Enable debug logging
REACT_APP_DEBUG=false
```

---

## Implementation Timeline

| Phase | Task | Priority | Estimated Time |
|-------|------|----------|----------------|
| 0 | Repository migration | Critical | 30 min |
| 1.1 | PixelLab service implementation | High | 2-3 hours |
| 1.2 | Provider abstraction layer | High | 1-2 hours |
| 1.3 | Terrain tab UI | Medium | 2-3 hours |
| 1.4 | Settings integration | Medium | 1 hour |
| 2.1 | Backup service core | High | 3-4 hours |
| 2.2 | IndexedDB storage | High | 2-3 hours |
| 2.3 | Export/Import functionality | Medium | 2 hours |
| 2.4 | Auto-backup integration | Medium | 1-2 hours |
| 3.1 | BetterAuth setup | High | 2-3 hours |
| 3.2 | Login page component | High | 3-4 hours |
| 3.3 | Auth context & hooks | High | 2 hours |
| 3.4 | Backend API routes | High | 2-3 hours |
| 3.5 | Database setup | High | 1-2 hours |

**Total Estimated Time: 25-35 hours**

---

## Testing Checklist

### Phase 0: Migration
- [ ] Repository cloned to `~/Code/blobgay/monster-forge`
- [ ] Git history clean with initial commit
- [ ] Remote configured to blobgay organization
- [ ] Pushed to `master` branch successfully

### Phase 1: PixelLab
- [ ] API key retrieval from 1Password works
- [ ] Sprite generation produces valid output
- [ ] Terrain generation works with all terrain types
- [ ] Animation frame generation works
- [ ] Provider fallback functions correctly
- [ ] Settings UI saves preferences

### Phase 2: Backup
- [ ] IndexedDB initialization succeeds
- [ ] Single item backup works
- [ ] Full backup captures all data
- [ ] Export to file produces valid JSON
- [ ] Import from file restores data
- [ ] Auto-backup runs on schedule
- [ ] Backup history is recorded

### Phase 3: Authentication
- [ ] Email/password registration works
- [ ] Email/password login works
- [ ] OAuth providers function
- [ ] Session persists across page refresh
- [ ] Logout clears session
- [ ] Guest mode allows app usage
- [ ] User preferences sync correctly

---

## Security Considerations

1. **API Keys**: Never commit API keys to the repository. Use environment variables or 1Password CLI.

2. **User Data**: All user data should be encrypted at rest when stored in the database.

3. **CORS**: Configure proper CORS headers for API endpoints.

4. **Rate Limiting**: Implement rate limiting on authentication endpoints to prevent brute force attacks.

5. **Input Validation**: Validate all user inputs, especially file uploads and generation prompts.

6. **Session Security**: Use secure, httpOnly cookies for session management.

---

## Future Enhancements

1. **Team/Organization Support**: Allow users to share monsters and assets within teams.

2. **Marketplace**: Enable users to publish and sell their creations.

3. **Version Control**: Implement asset versioning with diff visualization.

4. **Real-time Collaboration**: Add WebSocket support for collaborative editing.

5. **Mobile App**: React Native version for on-the-go monster creation.

6. **Plugin System**: Allow community-created extensions and providers.
