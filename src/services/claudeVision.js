/**
 * Claude Vision Analysis Service
 * 
 * Uses Anthropic's Claude API to analyze sprite images and extract:
 * - Visual description
 * - Element type classification
 * - Creature type
 * - Distinctive features
 * - Suggested names
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeVisionService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.REACT_APP_ANTHROPIC_API_KEY;
    this.model = 'claude-sonnet-4-20250514';
  }

  /**
   * Analyze a sprite image
   * @param {string} base64Image - Base64 encoded PNG image
   * @returns {Promise<SpriteAnalysis>}
   */
  async analyzeSprite(base64Image) {
    // Strip data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2024-01-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageData
              }
            },
            {
              type: 'text',
              text: this.getAnalysisPrompt()
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  /**
   * Analysis prompt for sprite interpretation
   */
  getAnalysisPrompt() {
    return `Analyze this pixel art sprite for an RPG monster-battling game. 
Return ONLY valid JSON (no markdown, no explanation) with this exact structure:

{
  "visualDescription": "detailed description of the creature's appearance",
  "creatureType": "one of: beast, dragon, elemental, spirit, construct, plant, aquatic, avian, insectoid, mythical",
  "primaryElement": "one of: Fire, Water, Earth, Air, Electric, Shadow, Light, Nature, Ice, Psychic",
  "secondaryElement": "same options or null if none apparent",
  "dominantColors": ["color1", "color2", "color3"],
  "bodyShape": "one of: bipedal, quadruped, serpentine, amorphous, winged, floating",
  "sizeClass": "one of: tiny, small, medium, large, massive",
  "distinctiveFeatures": ["feature1", "feature2", "feature3"],
  "suggestedNames": ["name1", "name2", "name3"],
  "personality": "brief personality description based on appearance",
  "habitat": "where this creature would likely live",
  "combatStyle": "how it would fight based on its form"
}`;
  }

  /**
   * Parse Claude's response into structured data
   */
  parseResponse(apiResponse) {
    const text = apiResponse.content?.[0]?.text || '{}';
    
    // Extract JSON from potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.warn('Could not parse Claude response, using defaults');
      return this.getDefaultAnalysis();
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('JSON parse error, using defaults:', e);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Default analysis when API fails
   */
  getDefaultAnalysis() {
    return {
      visualDescription: 'A mysterious creature',
      creatureType: 'beast',
      primaryElement: 'Psychic',
      secondaryElement: null,
      dominantColors: ['gray', 'white', 'black'],
      bodyShape: 'bipedal',
      sizeClass: 'medium',
      distinctiveFeatures: ['unknown form'],
      suggestedNames: ['Mysteon', 'Enigmax', 'Voidling'],
      personality: 'mysterious and unpredictable',
      habitat: 'unknown regions',
      combatStyle: 'versatile'
    };
  }
}

export default ClaudeVisionService;
