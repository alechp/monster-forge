/**
 * Nano Banana (Google Gemini) Image Generation Service
 * 
 * Supports:
 * - Gemini 2.5 Flash Image (Nano Banana) - Fast generation
 * - Gemini 3 Pro Image (Nano Banana Pro) - High quality
 * 
 * NO OPENAI COMPONENTS
 */

// Available art styles for sprite generation
export const ART_STYLES = {
  pixel: {
    id: 'pixel',
    name: 'Pixel Art',
    description: '16-bit retro game style',
    prompt: 'pixel art sprite, 64x64 pixels, clean pixel art style, video game character sprite, retro 16-bit aesthetic'
  },
  pixel_hd: {
    id: 'pixel_hd',
    name: 'HD Pixel Art',
    description: 'High-res pixel art (128x128)',
    prompt: 'high resolution pixel art sprite, 128x128 pixels, detailed pixel art style, modern indie game aesthetic'
  },
  anime: {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style',
    prompt: 'anime style character art, cel shaded, vibrant colors, clean lines, Japanese RPG style'
  },
  chibi: {
    id: 'chibi',
    name: 'Chibi',
    description: 'Cute super-deformed style',
    prompt: 'chibi style character, super deformed, big head small body, cute kawaii aesthetic, rounded features'
  },
  watercolor: {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft painted look',
    prompt: 'watercolor painting style, soft edges, flowing colors, painterly texture, artistic illustration'
  },
  comic: {
    id: 'comic',
    name: 'Comic Book',
    description: 'Bold western comic style',
    prompt: 'comic book style, bold outlines, dynamic shading, halftone dots, superhero comic aesthetic'
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple flat design',
    prompt: 'minimalist flat design, simple shapes, limited color palette, clean vector style, modern icon aesthetic'
  },
  realistic: {
    id: 'realistic',
    name: 'Semi-Realistic',
    description: 'Detailed painterly style',
    prompt: 'semi-realistic digital painting, detailed rendering, painterly brushstrokes, fantasy creature art'
  }
};

// Pose/direction options - organized by category
export const POSE_OPTIONS = {
  // Directional
  front: { id: 'front', name: 'Front', description: 'Facing camera', category: 'direction' },
  back: { id: 'back', name: 'Back', description: 'Facing away', category: 'direction' },
  left: { id: 'left', name: 'Left', description: 'Side profile left', category: 'direction' },
  right: { id: 'right', name: 'Right', description: 'Side profile right', category: 'direction' },
  // Combat
  attack: { id: 'attack', name: 'Attack', description: 'Combat strike', category: 'combat' },
  hurt: { id: 'hurt', name: 'Hurt', description: 'Taking damage', category: 'combat' },
  defend: { id: 'defend', name: 'Defend', description: 'Blocking stance', category: 'combat' },
  cast: { id: 'cast', name: 'Cast', description: 'Magic/ability use', category: 'combat' },
  // Movement
  idle: { id: 'idle', name: 'Idle', description: 'Standing still', category: 'movement' },
  walk: { id: 'walk', name: 'Walk', description: 'Walking motion', category: 'movement' },
  run: { id: 'run', name: 'Run', description: 'Running fast', category: 'movement' },
  jump: { id: 'jump', name: 'Jump', description: 'Mid-air jump', category: 'movement' },
  fly: { id: 'fly', name: 'Fly', description: 'Flying/hovering', category: 'movement' },
  swim: { id: 'swim', name: 'Swim', description: 'Swimming motion', category: 'movement' },
  // Emotes
  happy: { id: 'happy', name: 'Happy', description: 'Joyful expression', category: 'emote' },
  sad: { id: 'sad', name: 'Sad', description: 'Sad expression', category: 'emote' },
  angry: { id: 'angry', name: 'Angry', description: 'Angry expression', category: 'emote' },
  sleep: { id: 'sleep', name: 'Sleep', description: 'Sleeping/resting', category: 'emote' },
};

// Group poses by category for UI
export const POSE_CATEGORIES = {
  direction: { name: 'Directional', poses: ['front', 'back', 'left', 'right'] },
  combat: { name: 'Combat', poses: ['attack', 'hurt', 'defend', 'cast'] },
  movement: { name: 'Movement', poses: ['idle', 'walk', 'run', 'jump', 'fly', 'swim'] },
  emote: { name: 'Emotes', poses: ['happy', 'sad', 'angry', 'sleep'] },
};

// Color palette presets
export const COLOR_PALETTES = {
  original: { id: 'original', name: 'Original', description: 'Keep original colors' },
  warm: { id: 'warm', name: 'Warm', description: 'Reds, oranges, yellows' },
  cool: { id: 'cool', name: 'Cool', description: 'Blues, teals, purples' },
  neon: { id: 'neon', name: 'Neon', description: 'Vibrant electric colors' },
  pastel: { id: 'pastel', name: 'Pastel', description: 'Soft, light colors' },
  dark: { id: 'dark', name: 'Dark', description: 'Moody, deep colors' },
  earth: { id: 'earth', name: 'Earth', description: 'Natural browns & greens' },
  monochrome: { id: 'monochrome', name: 'Monochrome', description: 'Single color shades' },
  retro: { id: 'retro', name: 'Retro', description: 'Limited 8-bit palette' },
  custom: { id: 'custom', name: 'Custom', description: 'Pick your own colors' }
};

export class NanoBananaService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.REACT_APP_GOOGLE_API_KEY;
    this.useFal = options.useFal || false;
    this.falApiKey = options.falApiKey || process.env.REACT_APP_FAL_API_KEY;
  }

  /**
   * Generate a sprite variant
   * @param {string} description - Visual description of the monster
   * @param {string} variantType - Type of variant to generate
   * @param {string} referenceBase64 - Optional reference image
   */
  async generateSprite(description, variantType, referenceBase64 = null) {
    const prompt = this.buildPrompt(description, variantType);

    if (this.useFal) {
      return this.generateViaFal(prompt, referenceBase64);
    }

    return this.generateViaGoogleAPI(prompt, referenceBase64);
  }

  /**
   * Generate sprite with custom style and pose
   * @param {string} referenceBase64 - Reference image (required)
   * @param {string} styleId - Art style ID from ART_STYLES
   * @param {string} poseId - Pose ID from POSE_OPTIONS
   * @param {object} options - Additional generation options
   * @param {string} options.customPrompt - Optional custom prompt additions
   * @param {number} options.creativity - 0-100 scale for deviation from original (0=exact, 100=wild)
   * @param {string} options.colorPalette - 'original', 'custom', or preset name
   * @param {string[]} options.customColors - Array of hex colors for custom palette
   */
  async generateWithStyle(referenceBase64, styleId = 'pixel', poseId = 'front', options = {}) {
    const { 
      customPrompt = '', 
      creativity = 50, 
      colorPalette = 'original', 
      customColors = [] 
    } = options;
    
    const style = ART_STYLES[styleId] || ART_STYLES.pixel;
    const pose = POSE_OPTIONS[poseId] || POSE_OPTIONS.front;
    
    // Build prompt combining style, pose, and custom additions
    let prompt = `Generate a ${pose.name.toLowerCase()} view of this creature in ${style.name.toLowerCase()} style. `;
    prompt += `${style.prompt}. `;
    prompt += this.getPosePrompt(poseId);
    
    // Add creativity/deviation instructions
    prompt += ' ' + this.getCreativityPrompt(creativity);
    
    // Add color palette instructions
    prompt += ' ' + this.getColorPalettePrompt(colorPalette, customColors);
    
    if (customPrompt) {
      prompt += ` Additional details: ${customPrompt}`;
    }
    
    prompt += ' Transparent or simple solid color background. Centered composition.';
    
    console.log('[NanoBanana] Generating with prompt:', prompt);
    
    if (this.useFal) {
      return this.generateViaFal(prompt, referenceBase64);
    }
    
    return this.generateViaGoogleAPI(prompt, referenceBase64);
  }

  /**
   * Get creativity/deviation prompt based on slider value
   */
  getCreativityPrompt(creativity) {
    if (creativity <= 10) {
      return 'CRITICAL: Match the reference image as closely as possible. Same exact colors, proportions, and details. Only change the pose/angle.';
    } else if (creativity <= 30) {
      return 'Stay very close to the reference image. Maintain the same colors and overall design. Minor artistic interpretation allowed.';
    } else if (creativity <= 50) {
      return 'Use the reference as strong inspiration. Keep the same general design and color scheme but allow moderate artistic freedom.';
    } else if (creativity <= 70) {
      return 'Use the reference as loose inspiration. Feel free to reinterpret colors, proportions, and details while keeping the essence.';
    } else if (creativity <= 90) {
      return 'Treat the reference as a starting point only. Reimagine the creature with significant creative freedom in style, colors, and design.';
    } else {
      return 'Create a wild reinterpretation. Only use the general concept of the creature. Feel free to dramatically change everything.';
    }
  }

  /**
   * Get color palette prompt
   */
  getColorPalettePrompt(paletteType, customColors = []) {
    const palettes = {
      original: 'Use the same color palette as the reference image.',
      warm: 'Use a warm color palette: reds, oranges, yellows, warm browns.',
      cool: 'Use a cool color palette: blues, teals, purples, cool grays.',
      neon: 'Use vibrant neon colors: electric pink, cyan, lime green, bright purple.',
      pastel: 'Use soft pastel colors: light pink, baby blue, mint, lavender, cream.',
      dark: 'Use a dark, moody palette: deep purples, dark blues, black, crimson.',
      earth: 'Use earthy natural colors: browns, greens, tans, forest colors.',
      monochrome: 'Use a monochromatic color scheme with shades of a single color.',
      retro: 'Use retro game palette: limited colors like NES/SNES era games.',
      custom: customColors.length > 0 
        ? `Use ONLY these specific colors: ${customColors.join(', ')}. Mix and shade these colors only.`
        : 'Use the same color palette as the reference image.'
    };
    
    return palettes[paletteType] || palettes.original;
  }

  /**
   * Get pose-specific prompt additions
   */
  getPosePrompt(poseId) {
    const posePrompts = {
      // Directional
      front: 'Front view, facing directly at camera, symmetrical pose.',
      back: 'Back view, facing away from camera, showing back details.',
      left: 'Side profile view facing left, full body visible.',
      right: 'Side profile view facing right, full body visible.',
      // Combat
      attack: 'Dynamic attack pose, striking or slashing with weapon or claws, action lines showing motion.',
      hurt: 'Hurt/damaged pose, recoiling or flinching, showing pain expression.',
      defend: 'Defensive blocking stance, arms raised or shield up, braced for impact.',
      cast: 'Casting magic or using special ability, hands glowing, mystical energy around them.',
      // Movement
      idle: 'Relaxed idle pose, natural resting stance, breathing animation ready.',
      walk: 'Mid-walk pose, one foot forward, arms in walking motion, slight lean forward.',
      run: 'Running pose, dynamic stride, arms pumping, hair/clothes flowing back.',
      jump: 'Mid-jump pose, legs bent, arms up, defying gravity, airborne.',
      fly: 'Flying/hovering pose, wings spread (if applicable), floating gracefully.',
      swim: 'Swimming pose, horizontal body, arms and legs in swim stroke.',
      // Emotes
      happy: 'Happy joyful expression, smiling, maybe jumping or arms raised in celebration.',
      sad: 'Sad melancholy pose, head down, shoulders slumped, tearful expression.',
      angry: 'Angry furious pose, fists clenched, aggressive stance, fierce expression.',
      sleep: 'Sleeping pose, eyes closed, peaceful, curled up or lying down.',
    };
    return posePrompts[poseId] || posePrompts.front;
  }

  /**
   * Batch generate multiple poses in a single style
   * Note: Gemini has strict rate limits (~10 requests/minute for free tier)
   * @param {string} referenceBase64 - Reference image
   * @param {string} styleId - Art style ID
   * @param {string[]} poses - Array of pose IDs to generate
   * @param {object} options - Generation options
   * @param {function} onProgress - Progress callback
   */
  async generatePoseSet(referenceBase64, styleId, poses = ['front', 'back', 'left', 'right'], options = {}, onProgress = null) {
    const results = {};
    let completed = 0;
    let failed = 0;
    
    for (const poseId of poses) {
      try {
        if (onProgress) {
          onProgress({ 
            current: completed, 
            total: poses.length, 
            currentPose: poseId,
            message: `Generating ${poseId}...`
          });
        }
        
        results[poseId] = await this.generateWithStyle(referenceBase64, styleId, poseId, options);
        completed++;
        
        // Longer delay between requests to avoid rate limits (6 seconds)
        if (completed < poses.length) {
          if (onProgress) {
            onProgress({ 
              current: completed, 
              total: poses.length, 
              currentPose: poseId,
              message: `Waiting before next request...`
            });
          }
          await this.delay(6000);
        }
      } catch (error) {
        console.error(`Failed to generate ${poseId} pose:`, error);
        results[poseId] = null;
        failed++;
        
        // If we hit rate limit, inform user and stop
        if (error.message.includes('Rate limit')) {
          if (onProgress) {
            onProgress({ 
              current: completed, 
              total: poses.length, 
              error: error.message,
              done: true 
            });
          }
          break;
        }
      }
    }
    
    if (onProgress) {
      onProgress({ 
        current: completed, 
        total: poses.length, 
        failed,
        done: true 
      });
    }
    
    return results;
  }

  /**
   * Build generation prompt for variant type
   */
  buildPrompt(description, variantType) {
    const prompts = {
      // Directional poses
      front: `Pixel art sprite, front view, facing camera: ${description}. 64x64 pixels, transparent background, video game character sprite, clean pixel art style, centered composition`,
      
      back: `Pixel art sprite, back view, facing away from camera: ${description}. 64x64 pixels, transparent background, video game character sprite, clean pixel art style`,
      
      left: `Pixel art sprite, side profile view, facing left: ${description}. 64x64 pixels, transparent background, video game character sprite, clean pixel art style`,
      
      right: `Pixel art sprite, side profile view, facing right: ${description}. 64x64 pixels, transparent background, video game character sprite, clean pixel art style`,

      // Animation poses
      attack: `Pixel art sprite, dynamic attack pose, action stance: ${description}. 64x64 pixels, transparent background, video game character sprite, energetic pose with motion blur effect`,
      
      hurt: `Pixel art sprite, hurt/damaged pose, recoiling: ${description}. 64x64 pixels, transparent background, video game character sprite, pained expression, slightly tilted`,
      
      idle1: `Pixel art sprite, idle breathing pose: ${description}. 64x64 pixels, transparent background, video game character sprite, relaxed stance`,
      
      idle2: `Pixel art sprite, subtle idle movement: ${description}. 64x64 pixels, transparent background, video game character sprite, slight variation from rest pose`,

      // Evolution variants
      evolution1: `Pixel art sprite, baby/juvenile form: smaller, cuter, rounder version of ${description}. 48x48 pixels, transparent background, less detailed features, bigger eyes proportionally`,
      
      evolution2: `Pixel art sprite, adult form: ${description}. 64x64 pixels, transparent background, fully detailed, mature proportions`,
      
      evolution3: `Pixel art sprite, final powerful evolution: larger, more majestic version of ${description} with additional features like wings, armor, or elemental aura. 80x80 pixels, transparent background, highly detailed, imposing presence`,

      // Special variants
      shiny: `Pixel art sprite, alternate color palette version: ${description} but with shifted hue, more saturated colors, subtle sparkle effect. 64x64 pixels, transparent background, same pose as original but different coloring`
    };

    return prompts[variantType] || prompts.front;
  }

  /**
   * Generate via Google's direct API with retry logic
   * Uses gemini-2.0-flash-exp for image generation
   */
  async generateViaGoogleAPI(prompt, referenceBase64, retryCount = 0) {
    // Use the imagen-capable model
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    };

    // Add reference image if provided
    if (referenceBase64) {
      requestBody.contents[0].parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: referenceBase64.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }

    try {
      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retryCount < 3) {
          const waitTime = Math.pow(2, retryCount + 1) * 5000; // 10s, 20s, 40s
          console.log(`[NanoBanana] Rate limited, waiting ${waitTime/1000}s before retry ${retryCount + 1}/3...`);
          await this.delay(waitTime);
          return this.generateViaGoogleAPI(prompt, referenceBase64, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Please wait a few minutes and try again with fewer poses.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NanoBanana] API Error:', response.status, errorText);
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const data = await response.json();
      return this.extractImageFromResponse(data);
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        throw error;
      }
      console.error('[NanoBanana] Request failed:', error);
      throw error;
    }
  }

  /**
   * Generate via fal.ai hosted API
   * (Alternative endpoint for Nano Banana)
   */
  async generateViaFal(prompt, referenceBase64) {
    const endpoint = 'https://fal.run/fal-ai/nano-banana';

    const requestBody = {
      prompt: prompt,
      num_images: 1,
      aspect_ratio: '1:1',
      output_format: 'png'
    };

    if (referenceBase64) {
      requestBody.image_urls = [referenceBase64];
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${this.falApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`fal.ai API error: ${response.status}`);
    }

    const data = await response.json();
    return data.images?.[0]?.url || null;
  }

  /**
   * Extract image data from Google API response
   */
  extractImageFromResponse(response) {
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  }

  /**
   * Batch generate all poses for a monster
   */
  async generateAllPoses(description, referenceBase64) {
    const poses = ['front', 'back', 'left', 'right'];
    const results = {};

    for (const pose of poses) {
      try {
        results[pose] = await this.generateSprite(description, pose, referenceBase64);
        // Rate limiting - wait between requests
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to generate ${pose} pose:`, error);
        results[pose] = null;
      }
    }

    return results;
  }

  /**
   * Batch generate evolution sprites
   */
  async generateEvolutions(description, referenceBase64) {
    const evolutions = ['evolution1', 'evolution2', 'evolution3'];
    const results = [];

    for (const evo of evolutions) {
      try {
        const sprite = await this.generateSprite(description, evo, referenceBase64);
        results.push(sprite);
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to generate ${evo}:`, error);
        results.push(null);
      }
    }

    return results;
  }

  /**
   * Utility: delay for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze a sprite sheet to count unique sprites/characters
   * Uses Gemini's vision capabilities for analysis
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<{spriteCount: number, description: string, sprites: Array, gridInfo: object}>}
   */
  async analyzeSpriteSheet(imageBase64) {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

    const prompt = `Analyze this sprite sheet image carefully.

Return ONLY valid JSON with this structure:
{
  "spriteCount": <number of UNIQUE characters/creatures>,
  "description": "<brief description of what you see>",
  "isGrid": <true if sprites are arranged in a regular grid pattern>,
  "gridInfo": {
    "rows": <number of rows if grid, null otherwise>,
    "cols": <number of columns if grid, null otherwise>,
    "cellWidth": <estimated pixel width of each cell if grid>,
    "cellHeight": <estimated pixel height of each cell if grid>
  },
  "sprites": [
    {"name": "<descriptive name>", "row": <row index 0-based>, "col": <col index 0-based>, "description": "<brief description>"},
    ...
  ]
}

Guidelines:
- Count UNIQUE characters only (same character in different poses = 1 unique)
- If it's a grid, provide grid dimensions and approximate cell size
- For sprites array, list each unique character with its approximate grid position
- If not a grid (scattered sprites), set isGrid to false and gridInfo values to null`;

    const requestBody = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1, // Low temperature for more consistent counting
      }
    };

    try {
      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          spriteCount: result.spriteCount || 1,
          description: result.description || 'Sprite sheet analyzed',
          sprites: result.sprites || [],
          isGrid: result.isGrid || false,
          gridInfo: result.gridInfo || null
        };
      }
      
      return { spriteCount: 1, description: 'Could not analyze', sprites: [], isGrid: false, gridInfo: null };
    } catch (error) {
      console.error('[NanoBanana] Sprite sheet analysis failed:', error);
      return { spriteCount: 1, description: 'Analysis failed', sprites: [], isGrid: false, gridInfo: null };
    }
  }

  /**
   * Extract individual sprites from a sprite sheet using grid info
   * @param {string} imageBase64 - Base64 encoded sprite sheet
   * @param {object} gridInfo - Grid information from analyzeSpriteSheet
   * @param {Array} sprites - Sprite info array from analyzeSpriteSheet
   * @param {number} spriteCount - Expected number of sprites (for fallback estimation)
   * @returns {Promise<Array<{base64: string, name: string, index: number}>>}
   */
  async extractSpritesFromSheet(imageBase64, gridInfo, sprites = [], spriteCount = 0) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const extractedSprites = [];
        
        // Try to get or estimate grid dimensions
        let rows, cols, cellWidth, cellHeight;
        
        if (gridInfo && gridInfo.rows && gridInfo.cols) {
          rows = gridInfo.rows;
          cols = gridInfo.cols;
          cellWidth = gridInfo.cellWidth || Math.floor(img.width / cols);
          cellHeight = gridInfo.cellHeight || Math.floor(img.height / rows);
          console.log('[NanoBanana] Using provided gridInfo:', rows, 'x', cols);
        } else if (spriteCount > 1) {
          // Estimate grid from sprite count and image dimensions
          const estimated = this.estimateGridFromCount(img.width, img.height, spriteCount);
          rows = estimated.rows;
          cols = estimated.cols;
          cellWidth = estimated.cellWidth;
          cellHeight = estimated.cellHeight;
          console.log('[NanoBanana] Estimated grid from count:', rows, 'x', cols, 'cells:', cellWidth, 'x', cellHeight);
        } else {
          // Try to auto-detect grid from image
          const detected = this.detectGridFromImage(img);
          if (detected) {
            rows = detected.rows;
            cols = detected.cols;
            cellWidth = detected.cellWidth;
            cellHeight = detected.cellHeight;
            console.log('[NanoBanana] Auto-detected grid:', rows, 'x', cols);
          }
        }
        
        if (rows && cols) {
          console.log('[NanoBanana] Extracting grid:', rows, 'x', cols, 'cells:', cellWidth, 'x', cellHeight);
          
          // If we have sprite positions, extract only those
          if (sprites.length > 0) {
            for (const sprite of sprites) {
              if (sprite.row !== undefined && sprite.col !== undefined) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = cellWidth;
                canvas.height = cellHeight;
                
                ctx.drawImage(
                  img,
                  sprite.col * cellWidth,
                  sprite.row * cellHeight,
                  cellWidth,
                  cellHeight,
                  0, 0,
                  cellWidth,
                  cellHeight
                );
                
                // Check if cell has content
                const imageData = ctx.getImageData(0, 0, cellWidth, cellHeight);
                if (this.cellHasContent(imageData)) {
                  extractedSprites.push({
                    base64: canvas.toDataURL('image/png'),
                    name: sprite.name || `Sprite ${extractedSprites.length + 1}`,
                    description: sprite.description || '',
                    index: extractedSprites.length,
                    gridPosition: { row: sprite.row, col: sprite.col }
                  });
                }
              }
            }
          } else {
            // Extract all cells that have content
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = cellWidth;
                canvas.height = cellHeight;
                
                ctx.drawImage(
                  img,
                  c * cellWidth,
                  r * cellHeight,
                  cellWidth,
                  cellHeight,
                  0, 0,
                  cellWidth,
                  cellHeight
                );
                
                const imageData = ctx.getImageData(0, 0, cellWidth, cellHeight);
                if (this.cellHasContent(imageData)) {
                  extractedSprites.push({
                    base64: canvas.toDataURL('image/png'),
                    name: `Sprite ${extractedSprites.length + 1}`,
                    description: '',
                    index: extractedSprites.length,
                    gridPosition: { row: r, col: c }
                  });
                }
              }
            }
          }
        } else {
          // No grid - return the whole image as single sprite
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          extractedSprites.push({
            base64: canvas.toDataURL('image/png'),
            name: 'Sprite',
            description: '',
            index: 0
          });
        }
        
        console.log('[NanoBanana] Extracted', extractedSprites.length, 'sprites from sheet');
        resolve(extractedSprites);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for extraction'));
      img.src = imageBase64;
    });
  }

  /**
   * Check if a cell has meaningful content (not empty/transparent/white)
   */
  cellHasContent(imageData) {
    const data = imageData.data;
    let coloredPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      
      // Count pixels that are not white/near-white and not transparent
      if (a > 50 && !(r > 245 && g > 245 && b > 245)) {
        coloredPixels++;
      }
    }
    
    const totalPixels = imageData.width * imageData.height;
    // Need at least 1% non-white pixels (lowered threshold for small sprites)
    return coloredPixels > totalPixels * 0.01 && coloredPixels > 20;
  }

  /**
   * Estimate grid dimensions from sprite count and image size
   */
  estimateGridFromCount(width, height, spriteCount) {
    // Common grid layouts for sprite sheets
    const aspectRatio = width / height;
    
    // Try to find a grid that fits the sprite count
    // Prefer wider grids (more columns than rows) for horizontal sheets
    let bestCols = Math.ceil(Math.sqrt(spriteCount * aspectRatio));
    let bestRows = Math.ceil(spriteCount / bestCols);
    
    // Ensure we have enough cells
    while (bestCols * bestRows < spriteCount) {
      if (bestCols < bestRows) {
        bestCols++;
      } else {
        bestRows++;
      }
    }
    
    // For Pokemon-style sheets (151 sprites), try common layouts
    if (spriteCount === 151) {
      // 14 columns x 11 rows = 154 cells (fits 151)
      bestCols = 14;
      bestRows = 11;
    } else if (spriteCount >= 100 && spriteCount <= 160) {
      // Try to find a nice grid
      for (let cols = 10; cols <= 20; cols++) {
        const rows = Math.ceil(spriteCount / cols);
        if (cols * rows >= spriteCount && cols * rows < spriteCount + cols) {
          bestCols = cols;
          bestRows = rows;
          break;
        }
      }
    }
    
    const cellWidth = Math.floor(width / bestCols);
    const cellHeight = Math.floor(height / bestRows);
    
    console.log('[NanoBanana] Estimated grid for', spriteCount, 'sprites:', bestCols, 'x', bestRows);
    
    return {
      rows: bestRows,
      cols: bestCols,
      cellWidth,
      cellHeight
    };
  }

  /**
   * Try to detect grid from image by looking for repeating patterns
   */
  detectGridFromImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Sample common cell sizes
    const possibleSizes = [96, 80, 72, 64, 56, 48, 40, 32];
    
    for (const size of possibleSizes) {
      const cols = Math.floor(img.width / size);
      const rows = Math.floor(img.height / size);
      
      if (cols >= 2 && rows >= 2 && cols * rows >= 4 && cols * rows <= 300) {
        // Check if this grid makes sense by sampling cells
        let filledCells = 0;
        const sampleCount = Math.min(20, cols * rows);
        
        for (let i = 0; i < sampleCount; i++) {
          const row = Math.floor(Math.random() * rows);
          const col = Math.floor(Math.random() * cols);
          
          const cellCanvas = document.createElement('canvas');
          const cellCtx = cellCanvas.getContext('2d');
          cellCanvas.width = size;
          cellCanvas.height = size;
          
          cellCtx.drawImage(
            img,
            col * size, row * size, size, size,
            0, 0, size, size
          );
          
          const imageData = cellCtx.getImageData(0, 0, size, size);
          if (this.cellHasContent(imageData)) {
            filledCells++;
          }
        }
        
        // If most sampled cells have content, this is probably a good grid
        if (filledCells >= sampleCount * 0.5) {
          return {
            rows,
            cols,
            cellWidth: size,
            cellHeight: size
          };
        }
      }
    }
    
    return null;
  }
}

export default NanoBananaService;
