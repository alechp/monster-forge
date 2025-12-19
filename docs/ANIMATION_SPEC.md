# Animation Generation Specification

## Overview

This specification defines the animation generation system for Monster Forge. The system allows users to combine generated sprite poses into animated sequences (GIF/sprite sheets) for use in games.

## Architecture

### Forge Tab Structure

The Forge tab will be divided into two main sections:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORGE                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SPRITE GENERATION                           │   │
│  │  (Existing functionality - generate poses from source)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              ANIMATION GENERATION                        │   │
│  │  (New - combine poses into animated sequences)           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Animation Types

### Predefined Animation Presets

| Animation | Frames | Loop | Description |
|-----------|--------|------|-------------|
| `idle` | 2-4 | Yes | Subtle breathing/movement while standing |
| `walk` | 4-8 | Yes | Walking cycle (left, front, right, back) |
| `run` | 4-6 | Yes | Faster movement cycle |
| `attack` | 3-5 | No | Attack sequence with windup and follow-through |
| `hurt` | 2-3 | No | Damage reaction |
| `death` | 4-6 | No | Defeat animation |
| `cast` | 3-5 | No | Magic/ability casting |
| `jump` | 3-4 | No | Jump arc animation |
| `emote` | 2-4 | Yes | Emotional expression (happy, sad, angry) |

### Frame Mapping

Each animation type maps to specific generated poses:

```javascript
const ANIMATION_FRAME_MAPS = {
  idle: {
    frames: ['front', 'front_alt'], // Alternate between slight variations
    fps: 2,
    loop: true
  },
  walk: {
    frames: ['walk_1', 'walk_2', 'walk_3', 'walk_4'], // Or: ['left', 'front', 'right', 'back']
    fps: 8,
    loop: true
  },
  run: {
    frames: ['run_1', 'run_2', 'run_3', 'run_4'],
    fps: 12,
    loop: true
  },
  attack: {
    frames: ['front', 'attack_windup', 'attack', 'attack_follow'],
    fps: 10,
    loop: false
  },
  hurt: {
    frames: ['front', 'hurt', 'hurt'],
    fps: 6,
    loop: false
  },
  death: {
    frames: ['hurt', 'death_1', 'death_2', 'death_3'],
    fps: 4,
    loop: false
  },
  cast: {
    frames: ['front', 'cast_charge', 'cast', 'cast_release'],
    fps: 6,
    loop: false
  },
  jump: {
    frames: ['front', 'jump', 'jump', 'front'],
    fps: 8,
    loop: false
  }
};
```

## UI Components

### Animation Generation Section

```
┌─────────────────────────────────────────────────────────────────┐
│  ANIMATION GENERATION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Source Sprites:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Select from Library] or [Use Generated Sprites Above]   │   │
│  │                                                           │   │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                    │   │
│  │  │ F │ │ B │ │ L │ │ R │ │ATK│ │WLK│  ...               │   │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                    │   │
│  │  Front Back  Left Right Attack Walk                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Animation Type:                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │  Idle  │ │  Walk  │ │  Run   │ │ Attack │                   │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │  Hurt  │ │  Cast  │ │  Jump  │ │ Custom │                   │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
│                                                                  │
│  Animation Settings:                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Frame Rate: [8] fps      Duration: [0.5] sec            │   │
│  │ Loop: [✓]                Direction: [→ Forward]         │   │
│  │ Output: [○ GIF] [○ Sprite Sheet] [○ Both]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Frame Sequence:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Drag to reorder frames                                   │   │
│  │                                                           │   │
│  │  [1]──────[2]──────[3]──────[4]                         │   │
│  │  ┌───┐    ┌───┐    ┌───┐    ┌───┐                       │   │
│  │  │WK1│ →  │WK2│ →  │WK3│ →  │WK4│                       │   │
│  │  └───┘    └───┘    └───┘    └───┘                       │   │
│  │  [+ Add Frame] [Auto-fill from poses]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Preview:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            ┌─────────────┐                               │   │
│  │            │             │                               │   │
│  │            │  [ANIMATED] │                               │   │
│  │            │   PREVIEW   │                               │   │
│  │            │             │                               │   │
│  │            └─────────────┘                               │   │
│  │                                                           │   │
│  │   [▶ Play] [⏸ Pause] [⏪ Reset]  Speed: [1x ▾]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        [ Generate Animation ]    [ Save to Library ]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Custom Animation Builder

For advanced users who want full control:

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOM ANIMATION                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frame Timeline:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 0ms    100ms   200ms   300ms   400ms   500ms   600ms    │   │
│  │ |──────|───────|───────|───────|───────|───────|        │   │
│  │ [IMG1] [IMG2]  [IMG3]  [IMG2]  [IMG1]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Frame Properties (selected frame):                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Duration: [100] ms                                       │   │
│  │ Easing: [Linear ▾]                                       │   │
│  │ Transform: X[0] Y[0] Scale[1.0] Rotation[0°]            │   │
│  │ Opacity: [100%]                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structures

### Animation Definition

```typescript
interface Animation {
  id: string;
  name: string;
  type: 'idle' | 'walk' | 'run' | 'attack' | 'hurt' | 'cast' | 'jump' | 'custom';
  frames: AnimationFrame[];
  settings: AnimationSettings;
  sourceSprites: string[]; // IDs of source sprites used
  createdAt: string;
  sessionId?: string;
}

interface AnimationFrame {
  id: string;
  spriteId: string;      // Reference to sprite in library
  spriteBase64: string;  // Cached image data
  duration: number;      // Duration in ms
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
  };
}

interface AnimationSettings {
  fps: number;           // Frames per second (1-60)
  loop: boolean;         // Whether animation loops
  loopCount?: number;    // Number of loops (if not infinite)
  direction: 'forward' | 'reverse' | 'alternate';
  totalDuration: number; // Calculated total duration in ms
}
```

### Animation Output

```typescript
interface AnimationOutput {
  gif?: Blob;            // Animated GIF
  spriteSheet?: {
    image: Blob;         // PNG sprite sheet
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    columns: number;
    rows: number;
  };
  metadata: {
    name: string;
    type: string;
    fps: number;
    frameCount: number;
    duration: number;
    dimensions: { width: number; height: number };
  };
}
```

## Implementation Phases

### Phase 1: Core Animation Preview

1. Add Animation Generation section to Forge
2. Implement frame sequence builder
3. Add real-time canvas-based preview
4. Support selecting sprites from library or generated sprites

### Phase 2: Animation Export

1. Implement GIF generation using `gif.js` or similar library
2. Implement sprite sheet generation (horizontal/grid layouts)
3. Add download functionality
4. Save animations to Library

### Phase 3: Advanced Features

1. Custom frame timing per frame
2. Transform animations (position, scale, rotation)
3. Onion skinning for preview
4. Animation presets library
5. Batch animation generation

## Technical Implementation

### GIF Generation

Use `gif.js` library for client-side GIF creation:

```javascript
import GIF from 'gif.js';

async function generateGIF(frames, fps, loop) {
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: frames[0].width,
    height: frames[0].height,
    repeat: loop ? 0 : -1, // 0 = loop forever, -1 = no loop
  });

  for (const frame of frames) {
    const img = await loadImage(frame.base64);
    gif.addFrame(img, { delay: 1000 / fps });
  }

  return new Promise((resolve, reject) => {
    gif.on('finished', (blob) => resolve(blob));
    gif.on('error', reject);
    gif.render();
  });
}
```

### Sprite Sheet Generation

```javascript
function generateSpriteSheet(frames, columns = 4) {
  const frameWidth = frames[0].width;
  const frameHeight = frames[0].height;
  const rows = Math.ceil(frames.length / columns);
  
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * columns;
  canvas.height = frameHeight * rows;
  const ctx = canvas.getContext('2d');

  frames.forEach((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    ctx.drawImage(frame.image, col * frameWidth, row * frameHeight);
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    metadata: { frameWidth, frameHeight, columns, rows, frameCount: frames.length }
  };
}
```

### Animation Preview Component

```jsx
function AnimationPreview({ frames, fps, loop, playing }) {
  const canvasRef = useRef(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (!playing || frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        if (next >= frames.length) {
          return loop ? 0 : prev;
        }
        return next;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [playing, fps, loop, frames.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frame = frames[currentFrame];
    
    if (frame) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame.image, 0, 0);
    }
  }, [currentFrame, frames]);

  return <canvas ref={canvasRef} width={64} height={64} />;
}
```

## File Storage

### Library Structure

Animations will be stored alongside sprites in the Library:

```
Library
├── Originals (uploaded sprites)
├── Transformations (generated sprites)
└── Animations (generated animations)
    ├── animation_123
    │   ├── metadata.json
    │   ├── preview.gif
    │   └── spritesheet.png
    └── animation_456
        └── ...
```

### Animation Metadata

```json
{
  "id": "anim_1703012345678",
  "name": "Blastoise Walk Cycle",
  "type": "walk",
  "fps": 8,
  "loop": true,
  "frameCount": 4,
  "duration": 500,
  "frames": [
    { "spriteId": "gen_123_left", "duration": 125 },
    { "spriteId": "gen_123_front", "duration": 125 },
    { "spriteId": "gen_123_right", "duration": 125 },
    { "spriteId": "gen_123_back", "duration": 125 }
  ],
  "sourceMonster": "Blastoise",
  "createdAt": "2024-12-19T10:00:00Z"
}
```

## User Flow

### Basic Animation Creation

1. **Generate Sprites**: User generates multiple poses (walk, front, back, etc.)
2. **Select Animation Type**: Choose from presets (walk, idle, attack, etc.)
3. **Auto-fill Frames**: System suggests frames based on available poses
4. **Adjust Settings**: Modify FPS, loop, direction
5. **Preview**: Watch animation in real-time
6. **Export**: Download as GIF or sprite sheet
7. **Save**: Store in Library for later use

### Custom Animation Creation

1. **Select Sprites**: Pick specific sprites from library
2. **Build Sequence**: Drag sprites into frame timeline
3. **Adjust Timing**: Set duration for each frame
4. **Add Transforms**: Optional position/scale/rotation
5. **Preview & Export**: Same as basic flow

## Dependencies

- `gif.js` - Client-side GIF encoding
- `canvas` - For sprite sheet composition
- Existing sprite management infrastructure

## Migration Notes

- Existing generated sprites are fully compatible
- No changes to current sprite generation workflow
- Animation section is additive (optional feature)
- localStorage structure extended for animations

## Future Enhancements

1. **AI-Assisted Animation**: Generate in-between frames using AI
2. **Motion Blur**: Add blur effects for fast movements
3. **Particle Effects**: Overlay particles on animations
4. **Sound Sync**: Add audio cues to animations
5. **Animation Packs**: Export all character animations as a bundle
6. **Game Engine Export**: Direct export to Unity/Godot formats
