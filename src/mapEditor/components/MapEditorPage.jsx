/**
 * Map Editor - Main Page Component
 * 
 * Battle.net style map editor for creating game maps with:
 * - Terrain painting with tile palette
 * - Object/unit placement from monster library
 * - Region definition for triggers
 * - Trigger system (Events -> Conditions -> Actions)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/theme';
import { 
  Pencil, 
  PaintBucket, 
  Eraser, 
  Square, 
  Minus, 
  Pipette, 
  SquareDashedMousePointer, 
  Hand,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';

// Terrain tile types with colors
const TERRAIN_TILES = [
  { id: 'grass', name: 'Grass', color: '#4a7c23' },
  { id: 'grass_dark', name: 'Dark Grass', color: '#3d6b1c' },
  { id: 'dirt', name: 'Dirt', color: '#8b7355' },
  { id: 'sand', name: 'Sand', color: '#d4b896' },
  { id: 'water', name: 'Water', color: '#4a90d9' },
  { id: 'water_deep', name: 'Deep Water', color: '#2563eb' },
  { id: 'stone', name: 'Stone', color: '#6b7280' },
  { id: 'snow', name: 'Snow', color: '#e5e7eb' },
  { id: 'lava', name: 'Lava', color: '#dc2626' },
  { id: 'swamp', name: 'Swamp', color: '#5c4827' },
  { id: 'forest', name: 'Forest', color: '#166534' },
  { id: 'mountain', name: 'Mountain', color: '#78716c' },
];

// Tool definitions with Lucide icons
const TOOLS = [
  { id: 'pencil', name: 'Pencil', tooltip: 'Draw single tiles (P)', Icon: Pencil },
  { id: 'fill', name: 'Fill Bucket', tooltip: 'Fill connected area with selected tile (F)', Icon: PaintBucket },
  { id: 'eraser', name: 'Eraser', tooltip: 'Erase tiles back to default grass (E)', Icon: Eraser },
  { id: 'rectangle', name: 'Rectangle', tooltip: 'Draw filled rectangle (R)', Icon: Square },
  { id: 'line', name: 'Line', tooltip: 'Draw a line between two points (L)', Icon: Minus },
  { id: 'eyedropper', name: 'Eyedropper', tooltip: 'Pick tile color from map (I)', Icon: Pipette },
  { id: 'select', name: 'Select', tooltip: 'Select and move regions (S)', Icon: SquareDashedMousePointer },
  { id: 'pan', name: 'Pan', tooltip: 'Pan the map view (Space + drag)', Icon: Hand },
];

// Layer definitions
const LAYERS = [
  { id: 'units', name: 'Units', color: '#e94560' },
  { id: 'doodads', name: 'Doodads', color: '#4ade80' },
  { id: 'regions', name: 'Regions', color: '#60a5fa' },
  { id: 'terrain', name: 'Terrain', color: '#fbbf24' },
];

// Editor tabs
const EDITOR_TABS = ['TERRAIN', 'OBJECTS', 'REGIONS', 'TRIGGERS'];

// Default monster sprite (cute Pikachu-inspired yellow creature) - 32x32 SVG pixel art
// This ensures there's always at least one monster available for testing
const DEFAULT_MONSTER_SPRITE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KPHJlY3QgZmlsbD0iI0ZGRDkzRCIgeD0iOCIgeT0iMTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNCIvPgo8cmVjdCBmaWxsPSIjRkZEOTNEIiB4PSI2IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI4Ii8+CjxyZWN0IGZpbGw9IiNGRkQ5M0QiIHg9IjIyIiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI4Ii8+CjxyZWN0IGZpbGw9IiMxQTFBMkUiIHg9IjYiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjMiLz4KPHJlY3QgZmlsbD0iIzFBMUEyRSIgeD0iMjIiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjMiLz4KPHJlY3QgZmlsbD0iIzFBMUEyRSIgeD0iMTEiIHk9IjE0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIi8+CjxyZWN0IGZpbGw9IiMxQTFBMkUiIHg9IjE4IiB5PSIxNCIgd2lkdGg9IjMiIGhlaWdodD0iMyIvPgo8cmVjdCBmaWxsPSIjRkZGRkZGIiB4PSIxMiIgeT0iMTQiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4KPHJlY3QgZmlsbD0iI0ZGRkZGRiIgeD0iMTkiIHk9IjE0IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+CjxyZWN0IGZpbGw9IiNGRjZCNkIiIHg9IjgiIHk9IjE3IiB3aWR0aD0iMyIgaGVpZ2h0PSIyIi8+CjxyZWN0IGZpbGw9IiNGRjZCNkIiIHg9IjIxIiB5PSIxNyIgd2lkdGg9IjMiIGhlaWdodD0iMiIvPgo8cmVjdCBmaWxsPSIjMUExQTJFIiB4PSIxNCIgeT0iMjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjEiLz4KPHJlY3QgZmlsbD0iI0ZGRDkzRCIgeD0iMjQiIHk9IjEyIiB3aWR0aD0iNCIgaGVpZ2h0PSIyIi8+CjxyZWN0IGZpbGw9IiNGRkQ5M0QiIHg9IjI2IiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMiIvPgo8cmVjdCBmaWxsPSIjRkZEOTNEIiB4PSIyOCIgeT0iOCIgd2lkdGg9IjIiIGhlaWdodD0iMiIvPgo8L3N2Zz4K';

const DEFAULT_MONSTERS = [
  {
    id: 'default_sparky',
    name: 'Sparky',
    base64: DEFAULT_MONSTER_SPRITE,
    primaryElement: 'Electric',
    isDefault: true,
  }
];

// Pixel density presets
const PIXEL_DENSITY_PRESETS = [
  { id: 'tiny', name: 'Tiny (8px)', tileSize: 8 },
  { id: 'small', name: 'Small (16px)', tileSize: 16 },
  { id: 'medium', name: 'Medium (24px)', tileSize: 24 },
  { id: 'large', name: 'Large (32px)', tileSize: 32 },
  { id: 'huge', name: 'Huge (48px)', tileSize: 48 },
];

// Default map settings - smaller tiles for better density
const DEFAULT_MAP = {
  name: 'Untitled Map',
  width: 48,
  height: 32,
  tileSize: 16, // Smaller default for better pixel density
  description: '',
  terrain: null, // Will be 2D array
  objects: [],
  regions: [],
  triggers: [],
};

export default function MapEditorPage({ monsters = [], onSave }) {
  // Combine user monsters with default monsters (default always available)
  const allMonsters = [...DEFAULT_MONSTERS, ...monsters];
  
  // Editor state
  const [activeTab, setActiveTab] = useState('TERRAIN');
  const [editMode, setEditMode] = useState(true); // true = edit, false = play
  const [selectedTool, setSelectedTool] = useState('pencil');
  const [selectedTile, setSelectedTile] = useState(TERRAIN_TILES[0]);
  const [brushSize, setBrushSize] = useState(1);
  
  // Layer visibility and lock state
  const [layerVisibility, setLayerVisibility] = useState({
    units: true, doodads: true, regions: true, terrain: true
  });
  const [layerLock, setLayerLock] = useState({
    units: false, doodads: false, regions: false, terrain: false
  });
  
  // Map data
  const [mapData, setMapData] = useState(() => {
    const terrain = Array(DEFAULT_MAP.height).fill(null)
      .map(() => Array(DEFAULT_MAP.width).fill('grass'));
    return { ...DEFAULT_MAP, terrain };
  });
  
  // Pixel density preset
  const [pixelDensity, setPixelDensity] = useState('small'); // Default to 16px tiles
  
  // Canvas state
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(100); // Start at 100% with smaller tiles (16px default)
  const [panOffset, setPanOffset] = useState({ x: 20, y: 20 }); // Slight offset from edge
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredTile, setHoveredTile] = useState({ x: 0, y: 0 });
  
  // Right panel tab state
  const [rightPanelTab, setRightPanelTab] = useState('PROPERTIES');
  
  // Trigger editor state
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [triggers, setTriggers] = useState([
    {
      id: 'welcome',
      name: 'Welcome Message',
      events: [{ type: 'game_start', description: 'Fires when the game starts' }],
      conditions: [{ type: 'always', description: 'Always passes' }],
      actions: [{ type: 'display_message', message: 'Welcome to the game!', duration: 3 }],
    }
  ]);
  
  // Region drawing state
  const [isDrawingRegion, setIsDrawingRegion] = useState(false);
  const [regionStart, setRegionStart] = useState(null);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // Unit/Object placement state
  const [selectedObject, setSelectedObject] = useState(null); // Monster from library to place
  const [placedObjects, setPlacedObjects] = useState([]); // Objects placed on map
  const [selectedPlacedObject, setSelectedPlacedObject] = useState(null); // Currently selected placed object
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Get tile color by id
  const getTileColor = (tileId) => {
    const tile = TERRAIN_TILES.find(t => t.id === tileId);
    return tile ? tile.color : '#4a7c23';
  };

  // Draw the map canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const scale = zoom / 100;
    const tileSize = mapData.tileSize * scale;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw terrain layer
    if (layerVisibility.terrain && mapData.terrain) {
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          const tileId = mapData.terrain[y][x];
          ctx.fillStyle = getTileColor(tileId);
          ctx.fillRect(
            x * tileSize + panOffset.x,
            y * tileSize + panOffset.y,
            tileSize,
            tileSize
          );
        }
      }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= mapData.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize + panOffset.x, panOffset.y);
      ctx.lineTo(x * tileSize + panOffset.x, mapData.height * tileSize + panOffset.y);
      ctx.stroke();
    }
    for (let y = 0; y <= mapData.height; y++) {
      ctx.beginPath();
      ctx.moveTo(panOffset.x, y * tileSize + panOffset.y);
      ctx.lineTo(mapData.width * tileSize + panOffset.x, y * tileSize + panOffset.y);
      ctx.stroke();
    }
    
    // Draw regions
    if (layerVisibility.regions) {
      regions.forEach((region, idx) => {
        ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.fillRect(
          region.x * tileSize + panOffset.x,
          region.y * tileSize + panOffset.y,
          region.width * tileSize,
          region.height * tileSize
        );
        ctx.strokeRect(
          region.x * tileSize + panOffset.x,
          region.y * tileSize + panOffset.y,
          region.width * tileSize,
          region.height * tileSize
        );
        // Draw region label
        ctx.fillStyle = '#60a5fa';
        ctx.font = `${12 * scale}px sans-serif`;
        ctx.fillText(
          region.name || `Region ${idx + 1}`,
          region.x * tileSize + panOffset.x + 4,
          region.y * tileSize + panOffset.y + 14 * scale
        );
      });
    }
    
    // Draw hover tile highlight
    if (editMode && selectedTool !== 'pan') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredTile.x * tileSize + panOffset.x,
        hoveredTile.y * tileSize + panOffset.y,
        tileSize * brushSize,
        tileSize * brushSize
      );
    }
    
    // Draw region being created
    if (isDrawingRegion && regionStart) {
      const startX = Math.min(regionStart.x, hoveredTile.x);
      const startY = Math.min(regionStart.y, hoveredTile.y);
      const width = Math.abs(hoveredTile.x - regionStart.x) + 1;
      const height = Math.abs(hoveredTile.y - regionStart.y) + 1;
      
      ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.fillRect(
        startX * tileSize + panOffset.x,
        startY * tileSize + panOffset.y,
        width * tileSize,
        height * tileSize
      );
      ctx.strokeRect(
        startX * tileSize + panOffset.x,
        startY * tileSize + panOffset.y,
        width * tileSize,
        height * tileSize
      );
    }
    
    // Draw placed objects/units
    if (layerVisibility.units) {
      placedObjects.forEach((obj, idx) => {
        const objSize = tileSize * (obj.size || 1);
        const objX = obj.x * tileSize + panOffset.x;
        const objY = obj.y * tileSize + panOffset.y;
        
        // Draw sprite if available
        if (obj.image) {
          const img = new Image();
          img.src = obj.image;
          ctx.drawImage(img, objX, objY, objSize, objSize);
        } else {
          // Fallback: draw colored rectangle
          ctx.fillStyle = '#e94560';
          ctx.fillRect(objX + 2, objY + 2, objSize - 4, objSize - 4);
        }
        
        // Draw selection highlight
        if (selectedPlacedObject?.id === obj.id) {
          ctx.strokeStyle = '#00d4ff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(objX, objY, objSize, objSize);
          ctx.setLineDash([]);
        }
        
        // Draw object label
        ctx.fillStyle = '#fff';
        ctx.font = `${10 * scale}px sans-serif`;
        ctx.fillText(
          obj.name?.split(' ')[0] || `Unit ${idx + 1}`,
          objX + 2,
          objY + objSize - 4
        );
      });
    }
    
    // Draw ghost preview when placing an object
    if (editMode && selectedObject && activeTab === 'OBJECTS') {
      const ghostX = hoveredTile.x * tileSize + panOffset.x;
      const ghostY = hoveredTile.y * tileSize + panOffset.y;
      const ghostSize = tileSize;
      
      ctx.globalAlpha = 0.6;
      if (selectedObject.base64 || selectedObject.baseSprite) {
        const img = new Image();
        img.src = selectedObject.base64 || selectedObject.baseSprite;
        ctx.drawImage(img, ghostX, ghostY, ghostSize, ghostSize);
      } else {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(ghostX + 2, ghostY + 2, ghostSize - 4, ghostSize - 4);
      }
      ctx.globalAlpha = 1.0;
      
      // Draw placement cursor
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(ghostX, ghostY, ghostSize, ghostSize);
    }
  }, [mapData, zoom, panOffset, layerVisibility, hoveredTile, selectedTool, brushSize, editMode, regions, isDrawingRegion, regionStart, placedObjects, selectedPlacedObject, selectedObject, activeTab]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Resize canvas to fit container
  // Track canvas dimensions for resize
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      // Use getBoundingClientRect for accurate dimensions
      const rect = container.getBoundingClientRect();
      const containerWidth = Math.floor(rect.width);
      const containerHeight = Math.floor(rect.height);
      
      if (containerWidth > 0 && containerHeight > 0) {
        // Only update if dimensions actually changed
        if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
          canvas.width = containerWidth;
          canvas.height = containerHeight;
          // Trigger re-render by updating state
          setCanvasDimensions({ width: containerWidth, height: containerHeight });
        }
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Use ResizeObserver for better resize detection
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to batch resize updates
      requestAnimationFrame(resizeCanvas);
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    // Also listen to window resize and fullscreen changes
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', resizeCanvas);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('fullscreenchange', resizeCanvas);
    };
  }, []);

  // Redraw canvas when dimensions or map data changes
  useEffect(() => {
    if (canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      drawCanvas();
    }
  }, [canvasDimensions, drawCanvas]);

  // Center the map when canvas dimensions change
  useEffect(() => {
    if (canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      const scale = zoom / 100;
      const mapPixelWidth = mapData.width * mapData.tileSize * scale;
      const mapPixelHeight = mapData.height * mapData.tileSize * scale;
      
      // Center the map in the canvas
      const centerX = Math.max(20, (canvasDimensions.width - mapPixelWidth) / 2);
      const centerY = Math.max(20, (canvasDimensions.height - mapPixelHeight) / 2);
      
      setPanOffset({ x: centerX, y: centerY });
    }
  }, [canvasDimensions.width, canvasDimensions.height, mapData.width, mapData.height, mapData.tileSize, zoom]);

  // Convert mouse position to tile coordinates
  const getTileFromMouse = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    const tileSize = mapData.tileSize * scale;
    
    const x = Math.floor((e.clientX - rect.left - panOffset.x) / tileSize);
    const y = Math.floor((e.clientY - rect.top - panOffset.y) / tileSize);
    
    return {
      x: Math.max(0, Math.min(mapData.width - 1, x)),
      y: Math.max(0, Math.min(mapData.height - 1, y))
    };
  };

  // Paint tile at position
  const paintTile = (x, y) => {
    if (!editMode || layerLock.terrain) return;
    if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) return;
    
    setMapData(prev => {
      const newTerrain = prev.terrain.map(row => [...row]);
      
      // Apply brush size
      for (let dy = 0; dy < brushSize; dy++) {
        for (let dx = 0; dx < brushSize; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx >= 0 && tx < prev.width && ty >= 0 && ty < prev.height) {
            if (selectedTool === 'eraser') {
              newTerrain[ty][tx] = 'grass'; // Default tile
            } else {
              newTerrain[ty][tx] = selectedTile.id;
            }
          }
        }
      }
      
      return { ...prev, terrain: newTerrain };
    });
  };

  // Flood fill algorithm
  const floodFill = (startX, startY) => {
    if (!editMode || layerLock.terrain) return;
    
    const targetTile = mapData.terrain[startY][startX];
    if (targetTile === selectedTile.id) return;
    
    setMapData(prev => {
      const newTerrain = prev.terrain.map(row => [...row]);
      const stack = [[startX, startY]];
      const visited = new Set();
      
      while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        if (x < 0 || x >= prev.width || y < 0 || y >= prev.height) continue;
        if (newTerrain[y][x] !== targetTile) continue;
        
        visited.add(key);
        newTerrain[y][x] = selectedTile.id;
        
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      
      return { ...prev, terrain: newTerrain };
    });
  };

  // Place object at position
  const placeObject = (x, y) => {
    if (!selectedObject || !editMode || layerLock.units) return;
    
    const newObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      monsterId: selectedObject.id,
      name: selectedObject.name || 'Unit',
      image: selectedObject.base64 || selectedObject.baseSprite,
      x,
      y,
      size: 1, // 1 tile by default
      properties: {
        health: 100,
        team: 1,
      },
    };
    
    setPlacedObjects(prev => [...prev, newObject]);
    setSelectedPlacedObject(newObject);
  };

  // Delete placed object
  const deleteSelectedObject = () => {
    if (!selectedPlacedObject) return;
    setPlacedObjects(prev => prev.filter(obj => obj.id !== selectedPlacedObject.id));
    setSelectedPlacedObject(null);
  };

  // Handle mouse events
  const handleMouseDown = (e) => {
    const tile = getTileFromMouse(e);
    
    if (selectedTool === 'pan' || e.button === 1) { // Middle mouse or pan tool
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (activeTab === 'REGIONS' && selectedTool === 'rectangle') {
      setIsDrawingRegion(true);
      setRegionStart(tile);
      return;
    }
    
    // Object placement mode
    if (activeTab === 'OBJECTS') {
      // Check if clicking on existing object
      const clickedObj = placedObjects.find(obj => 
        tile.x >= obj.x && tile.x < obj.x + (obj.size || 1) &&
        tile.y >= obj.y && tile.y < obj.y + (obj.size || 1)
      );
      
      if (clickedObj) {
        // Select existing object
        setSelectedPlacedObject(clickedObj);
        setSelectedObject(null); // Deselect object to place
      } else if (selectedObject) {
        // Place new object
        placeObject(tile.x, tile.y);
      } else {
        // Deselect
        setSelectedPlacedObject(null);
      }
      return;
    }
    
    if (activeTab === 'TERRAIN') {
      if (selectedTool === 'fill') {
        floodFill(tile.x, tile.y);
      } else if (selectedTool === 'eyedropper') {
        const tileId = mapData.terrain[tile.y][tile.x];
        const tile_obj = TERRAIN_TILES.find(t => t.id === tileId);
        if (tile_obj) setSelectedTile(tile_obj);
      } else if (selectedTool === 'pencil' || selectedTool === 'eraser') {
        setIsDrawing(true);
        paintTile(tile.x, tile.y);
      }
    }
  };

  const handleMouseMove = (e) => {
    const tile = getTileFromMouse(e);
    setHoveredTile(tile);
    
    if (isPanning) {
      const dx = e.clientX - lastPanPos.x;
      const dy = e.clientY - lastPanPos.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (isDrawing && (selectedTool === 'pencil' || selectedTool === 'eraser')) {
      paintTile(tile.x, tile.y);
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawingRegion && regionStart) {
      const tile = getTileFromMouse(e);
      const startX = Math.min(regionStart.x, tile.x);
      const startY = Math.min(regionStart.y, tile.y);
      const width = Math.abs(tile.x - regionStart.x) + 1;
      const height = Math.abs(tile.y - regionStart.y) + 1;
      
      const newRegion = {
        id: `region_${Date.now()}`,
        name: `Region ${regions.length + 1}`,
        x: startX,
        y: startY,
        width,
        height,
      };
      
      setRegions(prev => [...prev, newRegion]);
      setIsDrawingRegion(false);
      setRegionStart(null);
    }
    
    setIsDrawing(false);
  };

  // Handle wheel for zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom(prev => Math.max(25, Math.min(400, prev + delta)));
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId) => {
    setLayerVisibility(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  // Toggle layer lock
  const toggleLayerLock = (layerId) => {
    setLayerLock(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  // Update map properties
  const updateMapProperty = (property, value) => {
    setMapData(prev => ({ ...prev, [property]: value }));
  };

  // Resize map
  const resizeMap = (newWidth, newHeight) => {
    setMapData(prev => {
      const newTerrain = Array(newHeight).fill(null).map((_, y) =>
        Array(newWidth).fill(null).map((_, x) =>
          prev.terrain[y]?.[x] || 'grass'
        )
      );
      return { ...prev, width: newWidth, height: newHeight, terrain: newTerrain };
    });
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: COLORS.background.primary,
      color: COLORS.text.primary,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderBottom: `1px solid ${COLORS.ui.border}`,
      backgroundColor: COLORS.background.secondary,
    },
    title: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.lg,
      color: COLORS.ui.active,
    },
    tabs: {
      display: 'flex',
      gap: SPACING.xs,
    },
    tab: (isActive) => ({
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: isActive ? COLORS.ui.active : 'transparent',
      border: `1px solid ${isActive ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: isActive ? '#000' : COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      cursor: 'pointer',
    }),
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md,
    },
    modeButton: (isEdit) => ({
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: isEdit ? 'transparent' : COLORS.ui.success,
      border: `1px solid ${isEdit ? COLORS.ui.border : COLORS.ui.success}`,
      borderRadius: BORDER_RADIUS.sm,
      color: isEdit ? COLORS.text.secondary : '#000',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
    }),
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    leftPanel: {
      width: '240px',
      borderRight: `1px solid ${COLORS.ui.border}`,
      backgroundColor: COLORS.background.secondary,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    panelSection: {
      padding: SPACING.md,
      borderBottom: `1px solid ${COLORS.ui.border}`,
    },
    panelTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: SPACING.sm,
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    toolsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: SPACING.xs,
    },
    toolButton: (isActive) => ({
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isActive ? COLORS.ui.active : COLORS.background.card,
      border: `1px solid ${isActive ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      cursor: 'pointer',
      color: isActive ? '#000' : COLORS.text.secondary,
    }),
    tilesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: SPACING.xs,
    },
    tileButton: (isActive, color) => ({
      width: '40px',
      height: '40px',
      backgroundColor: color,
      border: isActive ? `3px solid ${COLORS.ui.active}` : `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      cursor: 'pointer',
    }),
    layersList: {
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.xs,
    },
    layerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.sm,
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid ${COLORS.ui.border}`,
    },
    layerVisibility: {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: COLORS.text.secondary,
      padding: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    layerName: {
      flex: 1,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
    },
    layerLock: {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: COLORS.text.muted,
      padding: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    canvasContainer: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: COLORS.background.primary,
    },
    canvas: {
      width: '100%',
      height: '100%',
      cursor: selectedTool === 'pan' ? 'grab' : 'crosshair',
    },
    canvasFooter: {
      position: 'absolute',
      bottom: SPACING.md,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md,
      padding: `${SPACING.xs} ${SPACING.md}`,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: BORDER_RADIUS.md,
    },
    zoomControls: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    zoomButton: {
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.secondary,
      cursor: 'pointer',
      fontSize: TYPOGRAPHY.fontSize.md,
    },
    zoomLabel: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      minWidth: '50px',
      textAlign: 'center',
    },
    tileInfo: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.muted,
      fontFamily: 'monospace',
    },
    rightPanel: {
      width: '280px',
      borderLeft: `1px solid ${COLORS.ui.border}`,
      backgroundColor: COLORS.background.secondary,
      display: 'flex',
      flexDirection: 'column',
    },
    rightPanelTabs: {
      display: 'flex',
      borderBottom: `1px solid ${COLORS.ui.border}`,
    },
    rightPanelTab: (isActive) => ({
      flex: 1,
      padding: `${SPACING.sm} ${SPACING.xs}`,
      backgroundColor: isActive ? COLORS.ui.active : 'transparent',
      border: 'none',
      color: isActive ? '#000' : COLORS.text.secondary,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      cursor: 'pointer',
    }),
    rightPanelContent: {
      flex: 1,
      padding: SPACING.md,
      overflow: 'auto',
    },
    propertyGroup: {
      marginBottom: SPACING.md,
    },
    propertyLabel: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      textTransform: 'uppercase',
      marginBottom: SPACING.xs,
    },
    propertyInput: {
      width: '100%',
      padding: SPACING.sm,
      backgroundColor: COLORS.background.card,
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.primary,
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontFamily: TYPOGRAPHY.fontFamily.system,
    },
    propertyRow: {
      display: 'flex',
      gap: SPACING.sm,
    },
    triggerPanel: {
      borderTop: `1px solid ${COLORS.ui.border}`,
      backgroundColor: COLORS.background.secondary,
    },
    triggerHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md,
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderBottom: `1px solid ${COLORS.ui.border}`,
    },
    triggerTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.ui.active,
    },
    triggerName: {
      flex: 1,
      padding: `${SPACING.xs} ${SPACING.sm}`,
      backgroundColor: COLORS.background.card,
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.primary,
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    triggerBody: {
      display: 'flex',
      padding: SPACING.md,
      gap: SPACING.md,
    },
    triggerColumn: {
      flex: 1,
      minWidth: 0,
    },
    triggerColumnTitle: (color) => ({
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: color,
      textTransform: 'uppercase',
      marginBottom: SPACING.sm,
      display: 'flex',
      justifyContent: 'space-between',
    }),
    triggerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.sm,
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.xs,
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    triggerItemIcon: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: COLORS.background.tertiary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
    },
    addTriggerButton: {
      width: '100%',
      padding: SPACING.sm,
      backgroundColor: 'transparent',
      border: `1px dashed ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.muted,
      fontSize: TYPOGRAPHY.fontSize.sm,
      cursor: 'pointer',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header - just tabs and mode buttons, no title */}
      <div style={styles.header}>
        <div style={styles.tabs}>
          {EDITOR_TABS.map(tab => (
            <button
              key={tab}
              style={styles.tab(activeTab === tab)}
              onClick={() => setActiveTab(tab)}
              title={`Switch to ${tab.toLowerCase()} editing mode`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.modeButton(editMode)}
            onClick={() => setEditMode(false)}
            title="Preview and test your map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            PLAY
          </button>
          <button
            style={styles.modeButton(!editMode)}
            onClick={() => setEditMode(true)}
            title="Edit the map"
          >
            EDIT MODE
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {/* Left Panel - Tools & Tiles */}
        <div style={styles.leftPanel}>
          <div style={styles.panelSection}>
            <div style={styles.panelTitle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3zm0 10h8v8H3zm10 0h8v8h-8zm0-10h8v8h-8z"/>
              </svg>
              TOOLS & TILES
            </div>
          </div>

          {/* Tools */}
          <div style={styles.panelSection}>
            <div style={styles.panelTitle}>TOOLS</div>
            <div style={styles.toolsGrid}>
              {TOOLS.map(tool => {
                const IconComponent = tool.Icon;
                return (
                  <button
                    key={tool.id}
                    style={styles.toolButton(selectedTool === tool.id)}
                    onClick={() => setSelectedTool(tool.id)}
                    title={tool.tooltip}
                  >
                    <IconComponent size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terrain Tiles */}
          <div style={styles.panelSection}>
            <div style={styles.panelTitle}>TERRAIN TILES</div>
            <div style={styles.tilesGrid}>
              {TERRAIN_TILES.map(tile => (
                <button
                  key={tile.id}
                  style={styles.tileButton(selectedTile.id === tile.id, tile.color)}
                  onClick={() => setSelectedTile(tile)}
                  title={tile.name}
                />
              ))}
            </div>
          </div>

          {/* Layers */}
          <div style={styles.panelSection}>
            <div style={styles.panelTitle}>LAYERS</div>
            <div style={styles.layersList}>
              {LAYERS.map(layer => (
                <div key={layer.id} style={styles.layerItem}>
                  <button
                    style={styles.layerVisibility}
                    onClick={() => toggleLayerVisibility(layer.id)}
                    title={layerVisibility[layer.id] ? 'Hide layer' : 'Show layer'}
                  >
                    {layerVisibility[layer.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <span style={styles.layerName}>{layer.name}</span>
                  <button
                    style={styles.layerLock}
                    onClick={() => toggleLayerLock(layer.id)}
                    title={layerLock[layer.id] ? 'Unlock layer for editing' : 'Lock layer to prevent edits'}
                  >
                    {layerLock[layer.id] ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Monster Library - Always visible for object placement */}
          <div style={{ ...styles.panelSection, flex: 1, overflow: 'auto' }}>
            <div style={styles.panelTitle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              MONSTER LIBRARY ({allMonsters.length})
            </div>
            {allMonsters.length === 0 ? (
              <div style={{ 
                padding: SPACING.md, 
                textAlign: 'center',
                color: COLORS.text.muted,
                fontSize: TYPOGRAPHY.fontSize.xs,
              }}>
                No monsters yet.
                <br />
                Create some in the Monsters tab!
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '4px',
              }}>
                {allMonsters.map(monster => (
                  <div
                    key={monster.id}
                    onClick={() => {
                      setSelectedObject(monster);
                      setSelectedPlacedObject(null);
                      setActiveTab('OBJECTS'); // Switch to OBJECTS mode
                    }}
                    style={{
                      padding: '4px',
                      backgroundColor: selectedObject?.id === monster.id ? COLORS.ui.active : COLORS.background.card,
                      borderRadius: BORDER_RADIUS.sm,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `2px solid ${selectedObject?.id === monster.id ? COLORS.ui.active : 'transparent'}`,
                      transition: 'all 0.15s ease',
                    }}
                    title={monster.name || 'Monster'}
                  >
                    <img
                      src={monster.base64 || monster.baseSprite}
                      alt={monster.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {selectedObject && (
              <div style={{
                marginTop: SPACING.sm,
                padding: SPACING.sm,
                backgroundColor: `${COLORS.ui.active}20`,
                borderRadius: BORDER_RADIUS.sm,
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.ui.active,
                textAlign: 'center',
              }}>
                Click on map to place "{selectedObject.name?.split(' ')[0] || 'unit'}"
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* Footer with zoom and tile info */}
          <div style={styles.canvasFooter}>
            <div style={styles.zoomControls}>
              <button
                style={styles.zoomButton}
                onClick={() => setZoom(prev => Math.max(25, prev - 25))}
              >
                -
              </button>
              <span style={styles.zoomLabel}>{zoom}%</span>
              <button
                style={styles.zoomButton}
                onClick={() => setZoom(prev => Math.min(400, prev + 25))}
              >
                +
              </button>
            </div>
            <span style={styles.tileInfo}>
              Tile: {hoveredTile.x}, {hoveredTile.y} | Pixel: {hoveredTile.x * mapData.tileSize}, {hoveredTile.y * mapData.tileSize}
            </span>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div style={styles.rightPanel}>
          <div style={styles.rightPanelTabs}>
            {['PROPERTIES', 'TRIGGERS', 'OBJECTS'].map(tab => (
              <button
                key={tab}
                style={styles.rightPanelTab(rightPanelTab === tab)}
                onClick={() => setRightPanelTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div style={styles.rightPanelContent}>
            {rightPanelTab === 'PROPERTIES' && (
              <>
                <div style={styles.propertyGroup}>
                  <label style={styles.propertyLabel}>MAP NAME</label>
                  <input
                    style={styles.propertyInput}
                    value={mapData.name}
                    onChange={(e) => updateMapProperty('name', e.target.value)}
                  />
                </div>
                
                <div style={styles.propertyGroup}>
                  <label style={styles.propertyLabel}>MAP SIZE</label>
                  <div style={styles.propertyRow}>
                    <input
                      style={styles.propertyInput}
                      type="number"
                      value={mapData.width}
                      onChange={(e) => resizeMap(parseInt(e.target.value) || 32, mapData.height)}
                      min="8"
                      max="256"
                    />
                    <input
                      style={styles.propertyInput}
                      type="number"
                      value={mapData.height}
                      onChange={(e) => resizeMap(mapData.width, parseInt(e.target.value) || 32)}
                      min="8"
                      max="256"
                    />
                  </div>
                </div>
                
                <div style={styles.propertyGroup}>
                  <label style={styles.propertyLabel}>PIXEL DENSITY</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm }}>
                    {PIXEL_DENSITY_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setPixelDensity(preset.id);
                          updateMapProperty('tileSize', preset.tileSize);
                        }}
                        style={{
                          padding: `${SPACING.xs} ${SPACING.sm}`,
                          backgroundColor: mapData.tileSize === preset.tileSize ? COLORS.ui.active : COLORS.background.card,
                          border: `1px solid ${mapData.tileSize === preset.tileSize ? COLORS.ui.active : COLORS.ui.border}`,
                          borderRadius: BORDER_RADIUS.sm,
                          color: mapData.tileSize === preset.tileSize ? '#000' : COLORS.text.secondary,
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          cursor: 'pointer',
                        }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                    <label style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>Custom:</label>
                    <input
                      style={{ ...styles.propertyInput, width: '80px' }}
                      type="number"
                      value={mapData.tileSize}
                      onChange={(e) => updateMapProperty('tileSize', parseInt(e.target.value) || 16)}
                      min="4"
                      max="128"
                    />
                    <span style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>px</span>
                  </div>
                </div>
                
                <div style={styles.propertyGroup}>
                  <label style={styles.propertyLabel}>DESCRIPTION</label>
                  <textarea
                    style={{ ...styles.propertyInput, minHeight: '80px', resize: 'vertical' }}
                    value={mapData.description}
                    onChange={(e) => updateMapProperty('description', e.target.value)}
                    placeholder="Enter map description..."
                  />
                </div>
                
                <div style={styles.propertyGroup}>
                  <label style={styles.propertyLabel}>SELECTED OBJECT</label>
                  {selectedPlacedObject ? (
                    <div style={{ 
                      padding: SPACING.md, 
                      backgroundColor: COLORS.background.card, 
                      borderRadius: BORDER_RADIUS.sm,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                        <img
                          src={selectedPlacedObject.image}
                          alt={selectedPlacedObject.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'contain',
                            imageRendering: 'pixelated',
                            backgroundColor: COLORS.background.primary,
                            borderRadius: BORDER_RADIUS.sm,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
                            {selectedPlacedObject.name}
                          </div>
                          <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>
                            ID: {selectedPlacedObject.id.substring(0, 12)}...
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.secondary }}>
                        Position: ({selectedPlacedObject.x}, {selectedPlacedObject.y})
                      </div>
                      <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.secondary }}>
                        Team: {selectedPlacedObject.properties?.team || 1}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: SPACING.md, 
                      backgroundColor: COLORS.background.card, 
                      borderRadius: BORDER_RADIUS.sm,
                      color: COLORS.text.muted,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                    }}>
                      No object selected
                    </div>
                  )}
                </div>
              </>
            )}
            
            {rightPanelTab === 'TRIGGERS' && (
              <div>
                {triggers.map(trigger => (
                  <div
                    key={trigger.id}
                    style={{
                      padding: SPACING.sm,
                      backgroundColor: selectedTrigger?.id === trigger.id ? COLORS.background.tertiary : COLORS.background.card,
                      borderRadius: BORDER_RADIUS.sm,
                      marginBottom: SPACING.xs,
                      cursor: 'pointer',
                      border: `1px solid ${selectedTrigger?.id === trigger.id ? COLORS.ui.active : COLORS.ui.border}`,
                    }}
                    onClick={() => setSelectedTrigger(trigger)}
                  >
                    <div style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
                      {trigger.name}
                    </div>
                    <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>
                      {trigger.events.length} events, {trigger.actions.length} actions
                    </div>
                  </div>
                ))}
                <button
                  style={styles.addTriggerButton}
                  onClick={() => {
                    const newTrigger = {
                      id: `trigger_${Date.now()}`,
                      name: 'New Trigger',
                      events: [],
                      conditions: [],
                      actions: [],
                    };
                    setTriggers(prev => [...prev, newTrigger]);
                    setSelectedTrigger(newTrigger);
                  }}
                >
                  + Add Trigger
                </button>
              </div>
            )}
            
            {rightPanelTab === 'OBJECTS' && (
              <div>
                {/* Selected object to place indicator */}
                {selectedObject && (
                  <div style={{
                    marginBottom: SPACING.md,
                    padding: SPACING.sm,
                    backgroundColor: `${COLORS.ui.active}20`,
                    borderRadius: BORDER_RADIUS.sm,
                    border: `1px solid ${COLORS.ui.active}`,
                  }}>
                    <div style={{ 
                      fontSize: TYPOGRAPHY.fontSize.xs, 
                      color: COLORS.ui.active,
                      marginBottom: SPACING.xs,
                      fontWeight: 'bold',
                    }}>
                      PLACING:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                      <img
                        src={selectedObject.base64 || selectedObject.baseSprite}
                        alt={selectedObject.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                        }}
                      />
                      <span style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary, flex: 1 }}>
                        {selectedObject.name?.split(' ')[0] || 'Unit'}
                      </span>
                      <button
                        onClick={() => setSelectedObject(null)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${COLORS.ui.border}`,
                          borderRadius: BORDER_RADIUS.sm,
                          color: COLORS.text.secondary,
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={{ 
                      fontSize: TYPOGRAPHY.fontSize.xs, 
                      color: COLORS.text.muted,
                      marginTop: SPACING.xs,
                    }}>
                      Click on the map to place
                    </div>
                  </div>
                )}

                {/* Selected placed object properties */}
                {selectedPlacedObject && !selectedObject && (
                  <div style={{
                    marginBottom: SPACING.md,
                    padding: SPACING.sm,
                    backgroundColor: COLORS.background.card,
                    borderRadius: BORDER_RADIUS.sm,
                    border: `1px solid ${COLORS.ui.info}`,
                  }}>
                    <div style={{ 
                      fontSize: TYPOGRAPHY.fontSize.xs, 
                      color: COLORS.ui.info,
                      marginBottom: SPACING.xs,
                      fontWeight: 'bold',
                    }}>
                      SELECTED UNIT:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                      <img
                        src={selectedPlacedObject.image}
                        alt={selectedPlacedObject.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
                          {selectedPlacedObject.name}
                        </div>
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>
                          Position: ({selectedPlacedObject.x}, {selectedPlacedObject.y})
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={deleteSelectedObject}
                      style={{
                        width: '100%',
                        padding: `${SPACING.xs} ${SPACING.sm}`,
                        backgroundColor: COLORS.ui.error,
                        border: 'none',
                        borderRadius: BORDER_RADIUS.sm,
                        color: '#fff',
                        fontSize: TYPOGRAPHY.fontSize.xs,
                        cursor: 'pointer',
                      }}
                    >
                      Delete Unit
                    </button>
                  </div>
                )}

                {/* Placed objects count */}
                {placedObjects.length > 0 && (
                  <div style={{
                    marginBottom: SPACING.md,
                    padding: SPACING.sm,
                    backgroundColor: COLORS.background.tertiary,
                    borderRadius: BORDER_RADIUS.sm,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: COLORS.text.secondary,
                  }}>
                    {placedObjects.length} unit(s) placed on map
                  </div>
                )}

                <div style={styles.propertyLabel}>MONSTERS FROM LIBRARY</div>
                {allMonsters.length === 0 ? (
                  <div style={{ 
                    padding: SPACING.md, 
                    textAlign: 'center',
                    color: COLORS.text.muted,
                    fontSize: TYPOGRAPHY.fontSize.sm,
                  }}>
                    No monsters in library.
                    <br />
                    Create some in the Monsters tab first!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SPACING.xs }}>
                    {allMonsters.map(monster => (
                      <div
                        key={monster.id}
                        onClick={() => {
                          setSelectedObject(monster);
                          setSelectedPlacedObject(null);
                        }}
                        style={{
                          padding: SPACING.xs,
                          backgroundColor: selectedObject?.id === monster.id ? COLORS.ui.active : COLORS.background.card,
                          borderRadius: BORDER_RADIUS.sm,
                          textAlign: 'center',
                          cursor: 'pointer',
                          border: `2px solid ${selectedObject?.id === monster.id ? COLORS.ui.active : COLORS.ui.border}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <img
                          src={monster.base64 || monster.baseSprite}
                          alt={monster.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'contain',
                            imageRendering: 'pixelated',
                          }}
                        />
                        <div style={{ 
                          fontSize: TYPOGRAPHY.fontSize.xs, 
                          color: selectedObject?.id === monster.id ? '#000' : COLORS.text.secondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {monster.name?.split(' ')[0] || 'Sprite'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trigger Editor Panel (bottom) */}
      <div style={styles.triggerPanel}>
        <div style={styles.triggerHeader}>
          <span style={styles.triggerTitle}>TRIGGER EDITOR</span>
          <input
            style={styles.triggerName}
            value={selectedTrigger?.name || 'Welcome Message'}
            onChange={(e) => {
              if (selectedTrigger) {
                setTriggers(prev => prev.map(t => 
                  t.id === selectedTrigger.id ? { ...t, name: e.target.value } : t
                ));
                setSelectedTrigger(prev => ({ ...prev, name: e.target.value }));
              }
            }}
          />
        </div>
        
        <div style={styles.triggerBody}>
          {/* Events Column */}
          <div style={styles.triggerColumn}>
            <div style={styles.triggerColumnTitle(COLORS.ui.error)}>
              <span>EVENTS</span>
              <span style={{ color: COLORS.text.muted }}>
                {selectedTrigger?.events.length || 1}
              </span>
            </div>
            {(selectedTrigger?.events || triggers[0]?.events)?.map((event, idx) => (
              <div key={idx} style={styles.triggerItem}>
                <div style={styles.triggerItemIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={COLORS.ui.warning}>
                    <path d="M12 2L1 21h22L12 2z"/>
                  </svg>
                </div>
                <span>{event.description}</span>
              </div>
            ))}
            <button style={styles.addTriggerButton}>+ ADD EVENT</button>
          </div>
          
          {/* Conditions Column */}
          <div style={styles.triggerColumn}>
            <div style={styles.triggerColumnTitle(COLORS.ui.success)}>
              <span>CONDITIONS</span>
              <span style={{ color: COLORS.text.muted }}>
                {selectedTrigger?.conditions.length || 1}
              </span>
            </div>
            {(selectedTrigger?.conditions || triggers[0]?.conditions)?.map((condition, idx) => (
              <div key={idx} style={styles.triggerItem}>
                <div style={styles.triggerItemIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={COLORS.ui.success}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span>{condition.description}</span>
              </div>
            ))}
            <button style={styles.addTriggerButton}>+ ADD CONDITION</button>
          </div>
          
          {/* Actions Column */}
          <div style={styles.triggerColumn}>
            <div style={styles.triggerColumnTitle(COLORS.ui.info)}>
              <span>ACTIONS</span>
              <span style={{ color: COLORS.text.muted }}>
                {selectedTrigger?.actions.length || 1}
              </span>
            </div>
            {(selectedTrigger?.actions || triggers[0]?.actions)?.map((action, idx) => (
              <div key={idx} style={styles.triggerItem}>
                <div style={styles.triggerItemIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={COLORS.ui.info}>
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
                </div>
                <span>
                  Display '<strong style={{ color: COLORS.ui.active }}>{action.message}</strong>' for <strong style={{ color: COLORS.ui.active }}>{action.duration}</strong> seconds
                </span>
              </div>
            ))}
            <button style={styles.addTriggerButton}>+ ADD ACTION</button>
          </div>
        </div>
      </div>
    </div>
  );
}
