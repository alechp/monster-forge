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

// Pose/direction options
export const POSE_OPTIONS = {
  front: { id: 'front', name: 'Front', description: 'Facing camera' },
  back: { id: 'back', name: 'Back', description: 'Facing away' },
  left: { id: 'left', name: 'Left', description: 'Side profile left' },
  right: { id: 'right', name: 'Right', description: 'Side profile right' },
  attack: { id: 'attack', name: 'Attack', description: 'Action pose' },
  hurt: { id: 'hurt', name: 'Hurt', description: 'Damage reaction' },
  idle: { id: 'idle', name: 'Idle', description: 'Resting pose' }
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
   * @param {string} customPrompt - Optional custom prompt additions
   */
  async generateWithStyle(referenceBase64, styleId = 'pixel', poseId = 'front', customPrompt = '') {
    const style = ART_STYLES[styleId] || ART_STYLES.pixel;
    const pose = POSE_OPTIONS[poseId] || POSE_OPTIONS.front;
    
    // Build prompt combining style, pose, and custom additions
    let prompt = `Generate a ${pose.name.toLowerCase()} view of this creature in ${style.name.toLowerCase()} style. `;
    prompt += `${style.prompt}. `;
    prompt += this.getPosePrompt(poseId);
    
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
   * Get pose-specific prompt additions
   */
  getPosePrompt(poseId) {
    const posePrompts = {
      front: 'Front view, facing directly at camera, symmetrical pose.',
      back: 'Back view, facing away from camera, showing back details.',
      left: 'Side profile view facing left, full body visible.',
      right: 'Side profile view facing right, full body visible.',
      attack: 'Dynamic attack pose, action stance with motion energy.',
      hurt: 'Hurt/damaged pose, recoiling or flinching, showing pain.',
      idle: 'Relaxed idle pose, natural resting stance.'
    };
    return posePrompts[poseId] || posePrompts.front;
  }

  /**
   * Batch generate multiple poses in a single style
   * Note: Gemini has strict rate limits (~10 requests/minute for free tier)
   */
  async generatePoseSet(referenceBase64, styleId, poses = ['front', 'back', 'left', 'right'], onProgress = null) {
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
        
        results[poseId] = await this.generateWithStyle(referenceBase64, styleId, poseId);
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
}

export default NanoBananaService;
