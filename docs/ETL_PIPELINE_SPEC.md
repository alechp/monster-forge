# Monster Forge: ETL Pipeline Specification

## Overview

Monster Forge implements an ETL (Extract, Transform, Load) pipeline for converting sprite images into game-ready monster data. The architecture separates concerns into three distinct layers:

1. **Originals** - Raw uploaded assets (Extract)
2. **Forge** - Transformation engine (Transform)
3. **Transformations** - Generated outputs (Load)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MONSTER FORGE ETL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐      ┌──────────────────┐      ┌───────────────────┐     │
│  │   ORIGINALS  │      │      FORGE       │      │  TRANSFORMATIONS  │     │
│  │   (Extract)  │ ───▶ │   (Transform)    │ ───▶ │      (Load)       │     │
│  └──────────────┘      └──────────────────┘      └───────────────────┘     │
│                                                                              │
│  • Raw uploads         • AI Analysis           • Generated sprites          │
│  • Source sprites      • Text generation       • Monster data JSON          │
│  • Sprite sheets       • Image generation      • Evolution chains           │
│  • Reference images    • Stat calculation      • Animation frames           │
│                        • Name generation       • Pose variants              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Originals (Extract Layer)

The Originals layer stores all raw, unmodified uploads from users.

### Data Model

```typescript
interface Original {
  id: string;                    // Unique identifier (UUID)
  filename: string;              // Original filename
  uploadedAt: string;            // ISO timestamp
  mimeType: string;              // image/png, image/jpeg, image/gif
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;              // Bytes
  base64: string;                // Full image data
  metadata: {
    source: 'upload' | 'paste' | 'url';
    userAgent?: string;
    tags?: string[];
  };
  extractionResult: {
    type: 'single' | 'regions' | 'grid';
    spriteCount: number;
    sprites: ExtractedSprite[];
  };
}

interface ExtractedSprite {
  id: string;
  originalId: string;            // Reference to parent Original
  index: number;                 // Position in extraction order
  base64: string;                // Extracted sprite data
  bounds?: {                     // For region/grid extractions
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### Storage Strategy

```
originals/
├── {original_id}/
│   ├── source.png              # Original uploaded file
│   ├── metadata.json           # Upload metadata
│   └── sprites/
│       ├── sprite_0.png        # Extracted sprite 0
│       ├── sprite_1.png        # Extracted sprite 1
│       └── ...
```

### Extraction Pipeline

1. **Upload Reception** - Accept image file via drag-drop, file picker, or paste
2. **Validation** - Check file type, size limits, dimensions
3. **Storage** - Store original unchanged
4. **Analysis** - Determine if single sprite, sprite sheet, or multi-sprite image
5. **Extraction** - Split into individual sprites if needed
6. **Indexing** - Create searchable metadata

---

## 2. Forge (Transform Layer)

The Forge is the transformation engine that processes originals and generates new content.

### Transformation Types

#### 2.1 Text Transformations

Text transformations generate or modify textual/data content.

```typescript
interface TextTransformation {
  type: 'text';
  category: 
    | 'analysis'      // AI vision analysis of sprite
    | 'naming'        // Name generation
    | 'stats'         // Stat block generation
    | 'abilities'     // Ability/move generation
    | 'lore'          // Description/lore text
    | 'classification'; // Element/type classification
  
  input: {
    spriteId: string;
    context?: Record<string, any>;
  };
  
  output: {
    data: any;
    confidence?: number;
    alternatives?: any[];
  };
  
  provider: 'claude-vision' | 'local-color' | 'local-algorithm';
}
```

**Available Text Transformations:**

| Transformation | Input | Output | Provider |
|---------------|-------|--------|----------|
| `analyze-sprite` | Sprite image | Visual description, features | Claude Vision |
| `classify-element` | Sprite image or colors | Element type (Fire, Water, etc.) | Claude Vision / Local |
| `classify-creature` | Sprite image | Creature type (beast, dragon, etc.) | Claude Vision |
| `generate-name` | Element + features | Monster name | Local algorithm |
| `generate-stats` | Creature type + size + evolution | Stat block | Local algorithm |
| `generate-abilities` | Element + evolution level | Ability list | Local algorithm |
| `generate-lore` | Name + analysis + element | Lore text | Local algorithm |

#### 2.2 Image Transformations

Image transformations generate new visual assets.

```typescript
interface ImageTransformation {
  type: 'image';
  category:
    | 'pose'          // Directional variants (front, back, left, right)
    | 'animation'     // Animation frames (idle, walk, attack, hurt)
    | 'evolution'     // Evolution stage variants
    | 'variant'       // Color/shiny variants
    | 'upscale'       // Resolution enhancement
    | 'cleanup';      // Background removal, artifact cleanup
  
  input: {
    spriteId: string;
    referenceImage: string;      // Base64
    prompt?: string;             // For AI generation
    parameters?: Record<string, any>;
  };
  
  output: {
    images: GeneratedImage[];
  };
  
  provider: 'nano-banana' | 'gemini-pro' | 'local-canvas';
}

interface GeneratedImage {
  id: string;
  base64: string;
  variant: string;               // e.g., 'front', 'idle_frame_1', 'evolution_2'
  metadata: {
    prompt?: string;
    seed?: number;
    model?: string;
  };
}
```

**Available Image Transformations:**

| Transformation | Input | Output | Provider |
|---------------|-------|--------|----------|
| `generate-poses` | Base sprite | 4 directional poses | Nano Banana |
| `generate-animation` | Base sprite + type | Animation frames | Nano Banana |
| `generate-evolution` | Base sprite + level | Evolution variant | Nano Banana |
| `generate-shiny` | Base sprite | Alternate color palette | Nano Banana |
| `remove-background` | Any image | Transparent background | Local Canvas |
| `upscale-2x` | Low-res sprite | 2x resolution | Nano Banana |

### Forge Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORGE PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Original Sprite                                                 │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                │
│  │  Analyze    │──▶ Visual description, colors, features        │
│  └─────────────┘                                                │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                │
│  │  Classify   │──▶ Element type, creature type, size           │
│  └─────────────┘                                                │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                │
│  │  Generate   │──▶ Name, stats, abilities, lore                │
│  │  (Text)     │                                                │
│  └─────────────┘                                                │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                │
│  │  Generate   │──▶ Poses, animations, evolutions               │
│  │  (Image)    │    (Optional - user triggered)                 │
│  └─────────────┘                                                │
│       │                                                          │
│       ▼                                                          │
│  Transformation Record                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Forge Configuration

```typescript
interface ForgeConfig {
  // Text transformation settings
  text: {
    visionProvider: 'claude-vision' | 'local-fallback';
    nameStyle: 'pokemon' | 'fantasy' | 'scientific';
    statBalance: 'balanced' | 'min-max' | 'random';
    loreLength: 'short' | 'medium' | 'long';
  };
  
  // Image transformation settings
  image: {
    provider: 'nano-banana' | 'gemini-pro';
    quality: 'fast' | 'balanced' | 'high';
    style: 'pixel-art' | 'smooth' | 'preserve';
    outputSize: 64 | 96 | 128 | 256;
  };
  
  // Pipeline settings
  pipeline: {
    autoAnalyze: boolean;        // Auto-run analysis on upload
    autoGenerate: boolean;       // Auto-generate all text data
    batchSize: number;           // Max concurrent API calls
    retryAttempts: number;
  };
}
```

---

## 3. Transformations (Load Layer)

The Transformations layer stores all generated outputs.

### Data Model

```typescript
interface Monster {
  id: string;
  
  // References
  originalId: string;            // Link to Original
  spriteId: string;              // Link to ExtractedSprite
  
  // Core identity
  name: string;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  creatureType: CreatureType;
  sizeClass: SizeClass;
  
  // Generated text data
  analysis: SpriteAnalysis;
  
  // Evolution chain
  evolutions: Evolution[];
  
  // Generated image assets
  assets: {
    baseSprite: string;          // Original extracted sprite
    poses: PoseSet;
    animations: AnimationSet;
    shinyVariant?: string;
  };
  
  // Game mechanics
  catchRate: number;
  baseExp: number;
  genderRatio: GenderRatio;
  eggGroups: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  transformationHistory: TransformationRecord[];
}

interface TransformationRecord {
  id: string;
  type: 'text' | 'image';
  category: string;
  provider: string;
  input: any;
  output: any;
  timestamp: string;
  duration: number;              // ms
  success: boolean;
  error?: string;
}
```

### Storage Strategy

```
transformations/
├── {monster_id}/
│   ├── monster.json            # Complete monster data
│   ├── history.json            # Transformation history
│   └── assets/
│       ├── base.png            # Base sprite
│       ├── poses/
│       │   ├── front.png
│       │   ├── back.png
│       │   ├── left.png
│       │   └── right.png
│       ├── animations/
│       │   ├── idle/
│       │   ├── walk/
│       │   ├── attack/
│       │   └── hurt/
│       ├── evolutions/
│       │   ├── stage_1.png
│       │   ├── stage_2.png
│       │   └── stage_3.png
│       └── variants/
│           └── shiny.png
```

---

## 4. Export Formats

### 4.1 Single Monster Export

```json
{
  "version": "2.0.0",
  "generator": "Monster Forge",
  "exportDate": "2025-12-18T00:00:00Z",
  "monster": { ... }
}
```

### 4.2 Collection Export

```json
{
  "version": "2.0.0",
  "generator": "Monster Forge",
  "exportDate": "2025-12-18T00:00:00Z",
  "collection": {
    "name": "My Monsters",
    "count": 10,
    "monsters": [ ... ]
  }
}
```

### 4.3 Sprite Sheet Export

```json
{
  "version": "2.0.0",
  "spriteSheet": {
    "image": "base64...",
    "format": "png",
    "dimensions": { "width": 512, "height": 512 },
    "tileSize": 64,
    "mapping": {
      "monster_1_front": { "x": 0, "y": 0 },
      "monster_1_back": { "x": 64, "y": 0 },
      ...
    }
  }
}
```

---

## 5. UI Structure

### Current Tabs → New Organization

| Current | New | Purpose |
|---------|-----|---------|
| Overview | Overview | Display monster summary |
| Abilities | Abilities | Show/edit abilities |
| Evolutions | Evolutions | Evolution chain view |
| Poses | Assets | All generated images |
| Generate | Forge | Transformation controls |
| Export | Export | Export options |

### New: Originals Panel

Add a collapsible "Originals" section showing:
- Upload history
- Source image preview
- Extraction details
- Re-extract options

### New: Forge Panel (Enhanced)

The Forge tab becomes the transformation control center:

```
┌─────────────────────────────────────────────────────────────┐
│  FORGE                                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TEXT TRANSFORMATIONS                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Re-analyze with Claude Vision    [Run]            │   │
│  │ ☑ Regenerate name                  [Run]            │   │
│  │ ☑ Regenerate stats                 [Run]            │   │
│  │ ☑ Regenerate abilities             [Run]            │   │
│  │ ☑ Regenerate lore                  [Run]            │   │
│  │                                                      │   │
│  │ [Run Selected]  [Run All Text]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  IMAGE TRANSFORMATIONS                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Generate poses (4 directions)    [Run]            │   │
│  │ ☑ Generate evolutions (3 stages)   [Run]            │   │
│  │ ☐ Generate animations              [Run]            │   │
│  │ ☐ Generate shiny variant           [Run]            │   │
│  │                                                      │   │
│  │ [Run Selected]  [Run All Images]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  TRANSFORMATION HISTORY                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 12:05:32  analyze-sprite    claude-vision  ✓  1.2s  │   │
│  │ 12:05:34  generate-name     local          ✓  0.1s  │   │
│  │ 12:05:34  generate-stats    local          ✓  0.1s  │   │
│  │ 12:05:35  generate-poses    nano-banana    ✓  4.5s  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Current)
- [x] Sprite extraction (single/sheet detection)
- [x] Color-based element classification
- [x] Local text generation (names, stats, abilities, lore)
- [x] Basic UI with tabs

### Phase 2: ETL Structure
- [ ] Implement Originals data layer
- [ ] Add transformation history tracking
- [ ] Separate Forge controls from display
- [ ] Add transformation queue

### Phase 3: AI Integration
- [ ] Add backend proxy for Claude Vision (bypass CORS)
- [ ] Integrate Nano Banana for image generation
- [ ] Add confidence scores to analysis
- [ ] Implement retry logic

### Phase 4: Advanced Features
- [ ] Batch processing multiple sprites
- [ ] Custom transformation pipelines
- [ ] Sprite sheet export
- [ ] Animation preview
- [ ] Undo/redo for transformations

---

## 7. API Requirements

### Backend Proxy (Required for Claude Vision)

Since browser cannot directly call Anthropic API due to CORS, need a simple proxy:

```
POST /api/analyze-sprite
Body: { image: base64, prompt: string }
Response: { analysis: SpriteAnalysis }
```

### Environment Variables

```env
# Required
REACT_APP_ANTHROPIC_API_KEY=sk-ant-...
REACT_APP_GOOGLE_API_KEY=AIza...

# Optional - for backend proxy
API_PROXY_URL=https://your-proxy.com/api
```

---

## Appendix: Type Definitions

```typescript
type ElementType = 
  | 'Fire' | 'Water' | 'Earth' | 'Air' | 'Electric'
  | 'Shadow' | 'Light' | 'Nature' | 'Ice' | 'Psychic';

type CreatureType = 
  | 'beast' | 'dragon' | 'elemental' | 'spirit' | 'construct'
  | 'plant' | 'aquatic' | 'avian' | 'insectoid' | 'mythical';

type SizeClass = 'tiny' | 'small' | 'medium' | 'large' | 'massive';

interface SpriteAnalysis {
  visualDescription: string;
  creatureType: CreatureType;
  primaryElement: ElementType;
  secondaryElement: ElementType | null;
  dominantColors: string[];
  bodyShape: string;
  sizeClass: SizeClass;
  distinctiveFeatures: string[];
  suggestedNames: string[];
  personality: string;
  habitat: string;
  combatStyle: string;
}

interface Evolution {
  level: number;
  name: string;
  sprite: string | null;
  stats: Stats;
  abilities: Ability[];
  lore: string;
}

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  special: number;
  speed: number;
}

interface Ability {
  name: string;
  type: ElementType;
  power: number;
  accuracy: number;
  pp: number;
  priority: number;
  effect: string | null;
}
```
