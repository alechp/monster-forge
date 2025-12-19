/**
 * Sprite Extraction Service
 * 
 * Handles:
 * - Smart detection of single sprites vs sprite sheets
 * - Individual sprite extraction via Canvas
 * - Support for both transparent and solid backgrounds
 * - Base64 conversion for API calls
 */

export class SpriteExtractor {
  constructor(options = {}) {
    this.cellSize = options.cellSize || 64;
    this.minPixelThreshold = options.minPixelThreshold || 500;
    this.maxSprites = options.maxSprites || 64;
  }

  /**
   * Extract sprites from an image file
   * @param {File} file - Image file from input/drop
   * @returns {Promise<Array<{base64: string, index: number}>>}
   */
  async extractFromFile(file) {
    console.log('[SpriteExtractor] Processing file:', file.name, file.type, file.size);
    const img = await this.loadImage(file);
    console.log('[SpriteExtractor] Image loaded:', img.width, 'x', img.height);
    return this.extractFromImage(img);
  }

  /**
   * Load image file into Image element
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Analyze image to determine if it's a single sprite or sprite sheet
   */
  analyzeImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // Analyze the image characteristics
    let transparentPixels = 0;
    let opaquePixels = 0;
    let edgeTransparent = 0;
    let totalEdgePixels = 0;
    
    // Sample corners and edges to detect background type
    const width = img.width;
    const height = img.height;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        
        if (alpha < 128) {
          transparentPixels++;
        } else {
          opaquePixels++;
        }
        
        // Check edges (first/last 5 pixels on each side)
        const isEdge = x < 5 || x >= width - 5 || y < 5 || y >= height - 5;
        if (isEdge) {
          totalEdgePixels++;
          if (alpha < 128) {
            edgeTransparent++;
          }
        }
      }
    }
    
    const totalPixels = width * height;
    const transparentRatio = transparentPixels / totalPixels;
    const edgeTransparentRatio = totalEdgePixels > 0 ? edgeTransparent / totalEdgePixels : 0;
    
    console.log('[SpriteExtractor] Image analysis:', {
      dimensions: `${width}x${height}`,
      transparentRatio: (transparentRatio * 100).toFixed(1) + '%',
      edgeTransparentRatio: (edgeTransparentRatio * 100).toFixed(1) + '%'
    });
    
    return {
      hasTransparency: transparentRatio > 0.05,
      hasTransparentEdges: edgeTransparentRatio > 0.5,
      transparentRatio,
      edgeTransparentRatio,
      imageData,
      canvas,
      ctx
    };
  }

  /**
   * Detect if image is a sprite sheet and calculate grid
   */
  detectSpriteType(img, analysis) {
    const { hasTransparency, hasTransparentEdges, imageData } = analysis;
    const width = img.width;
    const height = img.height;
    
    // Case 1: Small image (< 200x200) - treat as single sprite
    if (width < 200 && height < 200) {
      console.log('[SpriteExtractor] Small image - treating as single sprite');
      return { type: 'single' };
    }
    
    // Case 2: Image with transparent background - try to find sprite regions
    if (hasTransparency && hasTransparentEdges) {
      console.log('[SpriteExtractor] Transparent background detected - looking for sprite regions');
      
      const regions = this.findSpriteRegions(imageData, width, height);
      
      if (regions.length > 0 && regions.length <= 20) {
        console.log('[SpriteExtractor] Found', regions.length, 'distinct sprite regions');
        return { 
          type: 'regions', 
          regions,
          width,
          height
        };
      }
      
      // Check for grid-based sprite sheet
      const gridInfo = this.detectGrid(width, height);
      if (gridInfo) {
        console.log('[SpriteExtractor] Detected grid layout:', gridInfo);
        return { type: 'grid', ...gridInfo };
      }
    }
    
    // Case 3: Large image with solid/white background - likely a single sprite
    // This is the key fix for the Bulbasaur case
    if (!hasTransparentEdges) {
      console.log('[SpriteExtractor] Solid background detected - treating as single sprite');
      return { type: 'single' };
    }
    
    // Case 4: Fallback to treating as single sprite for ambiguous cases
    console.log('[SpriteExtractor] Ambiguous image - treating as single sprite');
    return { type: 'single' };
  }

  /**
   * Detect grid dimensions for sprite sheets
   */
  detectGrid(width, height) {
    // Only use grid detection for images that are exact multiples of common sprite sizes
    const possibleSizes = [128, 96, 64, 48, 32, 16];
    
    for (const size of possibleSizes) {
      if (width % size === 0 && height % size === 0) {
        const cols = width / size;
        const rows = height / size;
        
        // Only accept grids with reasonable dimensions (2+ cells and not too many)
        if (cols >= 2 && rows >= 1 && cols * rows >= 2 && cols * rows <= 64) {
          return { cols, rows, cellSize: size };
        }
      }
    }
    
    return null;
  }

  /**
   * Find distinct sprite regions using transparent gap detection
   */
  findSpriteRegions(imageData, width, height) {
    const data = imageData.data;
    const regions = [];
    
    // Find horizontal and vertical gaps
    const horizontalGaps = this.findGaps(data, width, height, 'horizontal');
    const verticalGaps = this.findGaps(data, width, height, 'vertical');
    
    console.log('[SpriteExtractor] Found gaps - H:', horizontalGaps.length, 'V:', verticalGaps.length);
    
    // If no gaps found, can't segment
    if (horizontalGaps.length === 0 && verticalGaps.length === 0) {
      return [];
    }
    
    // Create grid from gaps
    const xBoundaries = [0, ...verticalGaps, width];
    const yBoundaries = [0, ...horizontalGaps, height];
    
    for (let yi = 0; yi < yBoundaries.length - 1; yi++) {
      for (let xi = 0; xi < xBoundaries.length - 1; xi++) {
        const region = {
          x: xBoundaries[xi],
          y: yBoundaries[yi],
          width: xBoundaries[xi + 1] - xBoundaries[xi],
          height: yBoundaries[yi + 1] - yBoundaries[yi]
        };
        
        // Check if region has actual content
        if (this.regionHasContent(data, width, region)) {
          const trimmed = this.trimRegion(data, width, height, region);
          if (trimmed && trimmed.width > 10 && trimmed.height > 10) {
            regions.push(trimmed);
          }
        }
      }
    }
    
    return regions;
  }

  /**
   * Find transparent gaps in the image
   */
  findGaps(data, width, height, direction) {
    const gaps = [];
    const minGapSize = 8;
    
    if (direction === 'horizontal') {
      let gapStart = -1;
      
      for (let y = 0; y < height; y++) {
        let rowEmpty = true;
        
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 50) {
            rowEmpty = false;
            break;
          }
        }
        
        if (rowEmpty) {
          if (gapStart === -1) gapStart = y;
        } else {
          if (gapStart !== -1 && y - gapStart >= minGapSize) {
            gaps.push(Math.floor((gapStart + y) / 2));
          }
          gapStart = -1;
        }
      }
    } else {
      let gapStart = -1;
      
      for (let x = 0; x < width; x++) {
        let colEmpty = true;
        
        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 50) {
            colEmpty = false;
            break;
          }
        }
        
        if (colEmpty) {
          if (gapStart === -1) gapStart = x;
        } else {
          if (gapStart !== -1 && x - gapStart >= minGapSize) {
            gaps.push(Math.floor((gapStart + x) / 2));
          }
          gapStart = -1;
        }
      }
    }
    
    return gaps;
  }

  /**
   * Check if a region has visible content
   */
  regionHasContent(data, imgWidth, region) {
    let count = 0;
    
    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        const idx = (y * imgWidth + x) * 4;
        if (data[idx + 3] > 50) {
          count++;
          if (count > 100) return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Trim a region to its actual content bounds
   */
  trimRegion(data, imgWidth, imgHeight, region) {
    let minX = region.x + region.width;
    let minY = region.y + region.height;
    let maxX = region.x;
    let maxY = region.y;
    
    for (let y = region.y; y < Math.min(region.y + region.height, imgHeight); y++) {
      for (let x = region.x; x < Math.min(region.x + region.width, imgWidth); x++) {
        const idx = (y * imgWidth + x) * 4;
        if (data[idx + 3] > 50) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (maxX < minX || maxY < minY) return null;
    
    const padding = 2;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(imgWidth - minX + padding, maxX - minX + 1 + padding * 2),
      height: Math.min(imgHeight - minY + padding, maxY - minY + 1 + padding * 2)
    };
  }

  /**
   * Extract all sprites from image
   */
  extractFromImage(img) {
    const analysis = this.analyzeImage(img);
    const detection = this.detectSpriteType(img, analysis);
    const sprites = [];

    if (detection.type === 'single') {
      // Single sprite - use the whole image
      console.log('[SpriteExtractor] Extracting single sprite');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      
      sprites.push({
        base64: canvas.toDataURL('image/png'),
        imageData: imageData,
        index: 0,
        type: 'single'
      });
      
    } else if (detection.type === 'regions') {
      // Extract individual regions
      console.log('[SpriteExtractor] Extracting', detection.regions.length, 'regions');
      
      for (const region of detection.regions) {
        const spriteCanvas = document.createElement('canvas');
        const spriteCtx = spriteCanvas.getContext('2d', { willReadFrequently: true });
        
        const size = Math.max(region.width, region.height);
        spriteCanvas.width = size;
        spriteCanvas.height = size;
        
        const offsetX = Math.floor((size - region.width) / 2);
        const offsetY = Math.floor((size - region.height) / 2);
        
        spriteCtx.drawImage(
          img,
          region.x, region.y, region.width, region.height,
          offsetX, offsetY, region.width, region.height
        );
        
        const imageData = spriteCtx.getImageData(0, 0, size, size);
        
        sprites.push({
          base64: spriteCanvas.toDataURL('image/png'),
          imageData: imageData,
          index: sprites.length,
          region: region
        });
      }
      
    } else if (detection.type === 'grid') {
      // Grid-based extraction
      console.log('[SpriteExtractor] Extracting grid:', detection.cols, 'x', detection.rows);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      for (let row = 0; row < detection.rows; row++) {
        for (let col = 0; col < detection.cols; col++) {
          if (sprites.length >= this.maxSprites) break;

          canvas.width = detection.cellSize;
          canvas.height = detection.cellSize;
          ctx.clearRect(0, 0, detection.cellSize, detection.cellSize);
          
          ctx.drawImage(
            img,
            col * detection.cellSize,
            row * detection.cellSize,
            detection.cellSize,
            detection.cellSize,
            0, 0,
            detection.cellSize,
            detection.cellSize
          );

          const imageData = ctx.getImageData(0, 0, detection.cellSize, detection.cellSize);
          
          if (this.hasContent(imageData)) {
            sprites.push({
              base64: canvas.toDataURL('image/png'),
              imageData: imageData,
              index: sprites.length,
              gridPosition: { row, col }
            });
          }
        }
      }
    }

    console.log('[SpriteExtractor] Extracted', sprites.length, 'sprite(s)');
    return sprites;
  }

  /**
   * Check if sprite cell has visible non-background content
   */
  hasContent(imageData) {
    let visiblePixels = 0;
    let coloredPixels = 0;
    const data = imageData.data;
    const totalPixels = imageData.width * imageData.height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      
      if (a > 50) {
        visiblePixels++;
        if (!((r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15))) {
          coloredPixels++;
        }
      }
    }

    const hasEnoughPixels = visiblePixels > this.minPixelThreshold;
    const hasEnoughColor = coloredPixels > 50;
    
    return hasEnoughPixels && hasEnoughColor;
  }

  /**
   * Analyze dominant colors in sprite
   */
  analyzeColors(imageData) {
    const colorCounts = {
      red: 0, orange: 0, yellow: 0, green: 0, 
      cyan: 0, blue: 0, purple: 0, pink: 0,
      brown: 0, white: 0, gray: 0, black: 0
    };

    const data = imageData.data;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      
      // Skip near-white pixels (background)
      if (r > 240 && g > 240 && b > 240) continue;
      
      totalPixels++;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness / 255 - 1));
      
      // Grayscale detection
      if (saturation < 0.15 || max - min < 30) {
        if (lightness > 200) colorCounts.white++;
        else if (lightness > 100) colorCounts.gray++;
        else colorCounts.black++;
        continue;
      }
      
      // Color detection
      if (r >= g && r >= b) {
        if (g > b + 50) {
          if (r > 200 && g > 150) colorCounts.yellow++;
          else colorCounts.orange++;
        } else if (b > g + 30) {
          colorCounts.pink++;
        } else {
          if (lightness < 100) colorCounts.brown++;
          else colorCounts.red++;
        }
      } else if (g >= r && g >= b) {
        if (b > r + 30) colorCounts.cyan++;
        else colorCounts.green++;
      } else {
        if (r > g + 30) colorCounts.purple++;
        else colorCounts.blue++;
      }
    }

    const sorted = Object.entries(colorCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color, count]) => ({ color, percentage: totalPixels > 0 ? Math.round(count / totalPixels * 100) : 0 }));
    
    console.log('[SpriteExtractor] Color analysis:', sorted);
    
    return sorted.map(c => c.color);
  }
}

export default new SpriteExtractor();
