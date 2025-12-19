/**
 * Monster Forge - Main Application
 * 
 * Sprite ETL Pipeline for Monster-Battling RPG
 * 
 * Main Navigation:
 * - Library: View Originals and Transformations
 * - Forge: Transform sprites into new variations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SpriteExtractor } from './services/spriteExtractor';
import ClaudeVisionService from './services/claudeVision';
import { DataGenerator } from './services/dataGenerator';
import { NanoBananaService, ART_STYLES, POSE_OPTIONS, POSE_CATEGORIES, COLOR_PALETTES } from './services/nanoBanana';
import { colorToElement } from './data/elements';
import { settingsStore } from './stores/useSettingsStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from './styles/theme';

// Components
import UploadZone from './components/UploadZone';
import MonsterDetail from './components/MonsterDetail';
import SettingsModal from './components/SettingsModal';
import UploadModal from './components/UploadModal';
import { 
  LibraryIcon, 
  ForgeIcon, 
  SettingsIcon, 
  DeleteIcon, 
  RefreshIcon, 
  SaveIcon,
  ImageIcon,
  MonsterIcon,
  SparkleIcon,
  UploadIcon,
  GroupIcon
} from './components/Icons';

// Main navigation tabs
const MAIN_TABS = [
  { id: 'library', label: 'Library', Icon: LibraryIcon },
  { id: 'forge', label: 'Forge', Icon: ForgeIcon },
];

// Library sub-tabs
const LIBRARY_TABS = [
  { id: 'originals', label: 'Originals' },
  { id: 'transformations', label: 'Transformations' },
];

export default function App() {
  // Navigation state
  const [activeMainTab, setActiveMainTab] = useState('library');
  const [activeLibraryTab, setActiveLibraryTab] = useState('originals');
  
  // Data state
  const [originals, setOriginals] = useState([]); // Raw uploaded sprites
  const [transformations, setTransformations] = useState([]); // Generated monsters
  const [selectedItem, setSelectedItem] = useState(null);
  
  // UI state
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Forge state
  const [selectedStyle, setSelectedStyle] = useState('pixel');
  const [selectedPoses, setSelectedPoses] = useState(['front', 'back', 'left', 'right']);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedSprites, setGeneratedSprites] = useState({}); // { poseId: base64 }
  const [creativity, setCreativity] = useState(50); // 0-100: 0=exact copy, 100=wild reinterpretation
  const [colorPalette, setColorPalette] = useState('original'); // original, custom, or preset name
  const [customColors, setCustomColors] = useState(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']); // 5 color palette
  const [forgeDragOver, setForgeDragOver] = useState(false); // Drag-drop state for Forge
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null); // { file, preview }
  
  // Batch generation state (for sprite sheets)
  const [batchQueue, setBatchQueue] = useState([]); // Array of sprites to process
  const [batchProgress, setBatchProgress] = useState(null); // { current, total, currentSprite, results }
  
  // Two-phase generation state
  const [generationPhase, setGenerationPhase] = useState('idle'); // 'idle' | 'base' | 'approval' | 'variants'
  const [baseGenerations, setBaseGenerations] = useState([]); // Array of { spriteIndex, spriteName, base64, approved: null|true|false, generating: bool }
  const [streamingResults, setStreamingResults] = useState({}); // Real-time results as they complete
  
  // Extracted sprites state (for sprite sheet processing)
  const [extractedSprites, setExtractedSprites] = useState([]); // Array of extracted sprite images
  const [selectedExtractedSprites, setSelectedExtractedSprites] = useState([]); // IDs of selected sprites for generation
  
  // Hover state for sprite cards
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [extracting, setExtracting] = useState(false);
  
  // Resizable UI state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [extractedSpritesHeight, setExtractedSpritesHeight] = useState(200);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingExtracted, setIsResizingExtracted] = useState(false);
  
  // Carousel modal state
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselSprites, setCarouselSprites] = useState([]);
  
  // Library picker modal state
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState(null); // { message, type, action?, actionLabel? }

  // Services
  const extractor = new SpriteExtractor();
  const vision = new ClaudeVisionService();
  const generator = new DataGenerator();
  const nanoBanana = new NanoBananaService();

  // Load data from localStorage on mount
  useEffect(() => {
    const storedOriginals = settingsStore.loadOriginals();
    const storedTransformations = settingsStore.loadTransformations();
    
    if (storedOriginals.length > 0) {
      console.log('[App] Loaded', storedOriginals.length, 'originals from localStorage');
      setOriginals(storedOriginals);
    }
    if (storedTransformations.length > 0) {
      console.log('[App] Loaded', storedTransformations.length, 'transformations from localStorage');
      setTransformations(storedTransformations);
    }
  }, []);

  // Save originals to localStorage when changed (exclude extracted sprites to avoid quota issues)
  useEffect(() => {
    if (originals.length > 0) {
      // Don't save extracted sprites - they're too large and cause quota errors
      const originalsToSave = originals.filter(o => !o.parentSheetId);
      if (originalsToSave.length > 0) {
        settingsStore.saveOriginals(originalsToSave);
      }
    }
  }, [originals]);

  // Save transformations to localStorage when changed
  useEffect(() => {
    if (transformations.length > 0) {
      settingsStore.saveTransformations(transformations);
    }
  }, [transformations]);

  // Load extracted sprites when selecting a sprite sheet that has them
  useEffect(() => {
    if (selectedItem?.isSpriteSheet && selectedItem?.hasExtractedSprites) {
      const childSprites = originals.filter(o => o.parentSheetId === selectedItem.id);
      if (childSprites.length > 0) {
        // Convert back to the format expected by extractedSprites state
        const extracted = childSprites
          .sort((a, b) => (a.extractedIndex || 0) - (b.extractedIndex || 0))
          .map((sprite, idx) => ({
            base64: sprite.base64,
            name: sprite.name || sprite.filename,
            index: sprite.extractedIndex ?? idx,
            gridPosition: sprite.gridPosition,
          }));
        setExtractedSprites(extracted);
        setSelectedExtractedSprites(extracted.map(s => s.index));
      }
    } else if (!selectedItem?.isSpriteSheet) {
      // Clear extracted sprites when selecting a non-sheet item
      setExtractedSprites([]);
      setSelectedExtractedSprites([]);
    }
  }, [selectedItem?.id, selectedItem?.isSpriteSheet, selectedItem?.hasExtractedSprites, originals]);

  // Show upload modal when file is selected
  const handleFileUpload = useCallback(async (file) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingUpload({
        file,
        preview: e.target.result,
        filename: file.name
      });
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Analyze sprite sheet for count
  const analyzeUploadedImage = useCallback(async () => {
    if (!pendingUpload?.preview) return null;
    return await nanoBanana.analyzeSpriteSheet(pendingUpload.preview);
  }, [pendingUpload, nanoBanana]);

  // Process upload after modal confirmation
  const processUpload = useCallback(async (isSpriteSheet = false, spriteCount = 1, analysisResult = null) => {
    if (!pendingUpload) return;
    
    setProcessing(true);
    console.log('[App] Processing upload:', pendingUpload.filename, 'isSpriteSheet:', isSpriteSheet, 'count:', spriteCount, 'analysis:', analysisResult);
    
    try {
      // For single sprites, just store the whole image
      if (!isSpriteSheet || spriteCount === 1) {
        setProcessingStage('Storing sprite...');
        
        const newOriginal = {
          id: `orig_${Date.now()}`,
          filename: pendingUpload.filename,
          uploadedAt: new Date().toISOString(),
          base64: pendingUpload.preview,
          isSpriteSheet: false,
          spriteCount: 1,
        };
        
        setOriginals(prev => [...prev, newOriginal]);
        setSelectedItem(newOriginal);
        setActiveLibraryTab('originals');
        setProcessingStage('Uploaded 1 sprite');
      } else {
        // For sprite sheets, store with metadata including grid info for extraction
        setProcessingStage('Storing sprite sheet...');
        
        const newOriginal = {
          id: `orig_${Date.now()}`,
          filename: pendingUpload.filename,
          uploadedAt: new Date().toISOString(),
          base64: pendingUpload.preview,
          isSpriteSheet: true,
          spriteCount: spriteCount,
          // Store analysis data for later extraction
          analysisResult: analysisResult,
          gridInfo: analysisResult?.gridInfo || null,
          spriteList: analysisResult?.sprites || [],
          extractedSprites: null, // Will be populated when user extracts
        };
        
        setOriginals(prev => [...prev, newOriginal]);
        setSelectedItem(newOriginal);
        setActiveLibraryTab('originals');
        setProcessingStage(`Uploaded sprite sheet (${spriteCount} sprites)`);
      }

    } catch (error) {
      console.error('[App] Processing failed:', error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
      setPendingUpload(null);
    }
  }, [pendingUpload]);

  // Extract individual sprites from a sprite sheet
  const extractSpritesFromSheet = useCallback(async () => {
    if (!selectedItem?.isSpriteSheet) return;
    
    setExtracting(true);
    setProcessingStage('Extracting sprites from sheet...');
    
    try {
      const gridInfo = selectedItem.gridInfo;
      const spriteList = selectedItem.spriteList || [];
      const spriteCount = selectedItem.spriteCount || 0;
      
      console.log('[App] Extracting from sheet with gridInfo:', gridInfo, 'spriteList:', spriteList.length, 'count:', spriteCount);
      
      const extracted = await nanoBanana.extractSpritesFromSheet(
        selectedItem.base64,
        gridInfo,
        spriteList,
        spriteCount
      );
      
      setExtractedSprites(extracted);
      // Select all by default
      setSelectedExtractedSprites(extracted.map(s => s.index));
      setProcessingStage(`Extracted ${extracted.length} sprites`);
      
      // Create individual sprite entries linked to parent sheet
      const timestamp = Date.now();
      const newSprites = extracted.map((sprite, idx) => ({
        id: `extracted_${selectedItem.id}_${idx}_${timestamp}`,
        filename: sprite.name || `Sprite ${idx + 1}`,
        name: sprite.name || `Sprite ${idx + 1}`,
        uploadedAt: new Date().toISOString(),
        base64: sprite.base64,
        isSpriteSheet: false,
        spriteCount: 1,
        // Link back to parent sprite sheet
        parentSheetId: selectedItem.id,
        parentSheetName: selectedItem.filename || selectedItem.name,
        extractedIndex: idx,
        gridPosition: sprite.gridPosition,
      }));
      
      // Remove any previously extracted sprites from this sheet, then add new ones
      setOriginals(prev => {
        const withoutOldExtracted = prev.filter(orig => orig.parentSheetId !== selectedItem.id);
        // Update the parent sheet to mark it as having extracted sprites
        const updated = withoutOldExtracted.map(orig => 
          orig.id === selectedItem.id 
            ? { ...orig, hasExtractedSprites: true, extractedCount: extracted.length }
            : orig
        );
        return [...updated, ...newSprites];
      });
      
      console.log('[App] Saved', newSprites.length, 'extracted sprites to library');
      
    } catch (error) {
      console.error('[App] Extraction failed:', error);
      setProcessingStage(`Extraction failed: ${error.message}`);
    } finally {
      setExtracting(false);
    }
  }, [selectedItem, nanoBanana]);

  // Toggle extracted sprite selection
  const toggleExtractedSprite = useCallback((index) => {
    setSelectedExtractedSprites(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }, []);

  // Open a sprite in the Forge
  const openInForge = useCallback((item, e) => {
    if (e) e.stopPropagation();
    setSelectedItem(item);
    setActiveMainTab('forge');
    
    // If it's a sprite sheet with previously extracted sprites, load them
    if (item?.isSpriteSheet && item?.hasExtractedSprites) {
      const childSprites = originals.filter(o => o.parentSheetId === item.id);
      if (childSprites.length > 0) {
        // Convert back to the format expected by extractedSprites
        const extracted = childSprites.map((sprite, idx) => ({
          base64: sprite.base64,
          name: sprite.name || sprite.filename,
          index: sprite.extractedIndex ?? idx,
          gridPosition: sprite.gridPosition,
        }));
        setExtractedSprites(extracted);
        setSelectedExtractedSprites(extracted.map(s => s.index));
        return;
      }
    }
    
    // Clear any previous extracted sprites when switching to a new item
    setExtractedSprites([]);
    setSelectedExtractedSprites([]);
  }, [originals]);

  // Open carousel to view sprites
  const openCarousel = useCallback((sprites, startIndex = 0) => {
    setCarouselSprites(sprites);
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  }, []);

  // Sidebar resize handlers
  const handleSidebarResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  // Extracted sprites container resize handlers  
  const handleExtractedResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingExtracted(true);
  }, []);

  // Mouse move handler for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingExtracted) {
        // Calculate relative to the container
        const container = document.getElementById('extracted-sprites-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newHeight = Math.max(100, Math.min(600, e.clientY - rect.top));
          setExtractedSpritesHeight(newHeight);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingExtracted(false);
    };
    
    if (isResizingSidebar || isResizingExtracted) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingSidebar ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSidebar, isResizingExtracted]);

  // Legacy process for backward compatibility
  const processUploadLegacy = useCallback(async (file) => {
    setProcessing(true);
    console.log('[App] Starting upload processing for:', file.name);
    
    try {
      // Step 1: Extract sprites
      setProcessingStage('Extracting sprites...');
      const sprites = await extractor.extractFromFile(file);
      console.log('[App] Extracted', sprites.length, 'sprites');

      if (sprites.length === 0) {
        setProcessingStage('No sprites found in image');
        setProcessing(false);
        return;
      }

      // Store originals
      const newOriginals = sprites.map((sprite, index) => ({
        id: `orig_${Date.now()}_${index}`,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        base64: sprite.base64,
        imageData: sprite.imageData,
        dimensions: {
          width: sprite.width || sprite.imageData?.width,
          height: sprite.height || sprite.imageData?.height,
        },
      }));
      
      setOriginals(prev => [...prev, ...newOriginals]);
      setProcessingStage(`Uploaded ${newOriginals.length} sprite(s)`);
      
      // Select first new original
      if (newOriginals.length > 0) {
        setSelectedItem(newOriginals[0]);
        setActiveLibraryTab('originals');
      }

    } catch (error) {
      console.error('[App] Processing failed:', error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }, [extractor]);

  // Transform an original into a monster
  const transformOriginal = useCallback(async (original) => {
    setProcessing(true);
    setProcessingStage('Analyzing sprite...');
    
    try {
      let analysis;
      try {
        analysis = await vision.analyzeSprite(original.base64);
      } catch (error) {
        console.log('[App] Vision analysis failed, using color fallback');
        const colors = extractor.analyzeColors(original.imageData);
        const primaryElement = colorToElement(colors);
        
        analysis = {
          primaryElement,
          secondaryElement: null,
          creatureType: 'beast',
          sizeClass: 'medium',
          visualDescription: 'A mysterious creature',
          suggestedNames: [],
          dominantColors: colors,
          bodyShape: 'bipedal',
          distinctiveFeatures: [],
          personality: 'unknown',
          habitat: 'unknown',
          combatStyle: 'versatile'
        };
      }

      setProcessingStage('Generating monster data...');
      const monster = generator.generateMonster(original.base64, analysis, transformations.length);
      monster.originalId = original.id; // Link to original
      
      setTransformations(prev => [...prev, monster]);
      setSelectedItem(monster);
      setActiveLibraryTab('transformations');
      setProcessingStage(`Created ${monster.name}!`);
      
    } catch (error) {
      console.error('[App] Transform failed:', error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }, [vision, extractor, generator, transformations.length]);

  // Update monster data
  const handleMonsterUpdate = useCallback((updatedMonster) => {
    setTransformations(prev => prev.map(m => 
      m.id === updatedMonster.id ? updatedMonster : m
    ));
    setSelectedItem(updatedMonster);
  }, []);

  // Delete original sprite
  const deleteOriginal = useCallback((id, e) => {
    e.stopPropagation(); // Prevent selecting the item
    setOriginals(prev => prev.filter(o => o.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  }, [selectedItem]);

  // Delete transformation
  const deleteTransformation = useCallback((id, e) => {
    e.stopPropagation(); // Prevent selecting the item
    setTransformations(prev => prev.filter(t => t.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  }, [selectedItem]);

  // Get current library items based on active tab
  const currentLibraryItems = activeLibraryTab === 'originals' ? originals : transformations;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: COLORS.background.primary,
      color: COLORS.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.system
    },
    header: {
      padding: SPACING.md,
      borderBottom: `1px solid ${COLORS.ui.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.lg
    },
    title: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xl,
      color: COLORS.ui.active
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
    },
    mainNav: {
      display: 'flex',
      gap: SPACING.sm,
    },
    mainNavButton: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: isActive ? COLORS.ui.active : 'transparent',
      border: `1px solid ${isActive ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.md,
      color: isActive ? '#000' : COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }),
    settingsButton: {
      backgroundColor: 'transparent',
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      color: COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
      transition: 'all 0.2s ease'
    },
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    sidebar: {
      width: sidebarWidth,
      minWidth: '200px',
      maxWidth: '500px',
      borderRight: `1px solid ${COLORS.ui.border}`,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.background.secondary,
      position: 'relative',
    },
    sidebarResizeHandle: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '6px',
      height: '100%',
      cursor: 'ew-resize',
      backgroundColor: 'transparent',
      transition: 'background-color 0.2s ease',
      zIndex: 10,
      '&:hover': {
        backgroundColor: COLORS.ui.active,
      },
    },
    sidebarTabs: {
      display: 'flex',
      borderBottom: `1px solid ${COLORS.ui.border}`,
    },
    sidebarTab: (isActive) => ({
      flex: 1,
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: isActive ? COLORS.background.tertiary : 'transparent',
      border: 'none',
      borderBottom: isActive ? `2px solid ${COLORS.ui.active}` : '2px solid transparent',
      color: isActive ? COLORS.text.primary : COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }),
    sidebarContent: {
      flex: 1,
      overflow: 'auto',
      padding: SPACING.md,
    },
    sidebarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    sidebarTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
    },
    itemCount: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.muted,
    },
    itemGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: SPACING.sm,
    },
    itemCard: (isSelected) => ({
      position: 'relative',
      backgroundColor: isSelected ? COLORS.background.tertiary : COLORS.background.card,
      border: `2px solid ${isSelected ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
    }),
    itemDeleteButton: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.ui.error,
      border: 'none',
      borderRadius: '50%',
      color: '#fff',
      fontSize: '14px',
      cursor: 'pointer',
      opacity: 0.8,
      transition: 'all 0.2s ease',
      zIndex: 10,
    },
    itemForgeButton: {
      position: 'absolute',
      bottom: '4px',
      right: '4px',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.ui.active,
      border: 'none',
      borderRadius: BORDER_RADIUS.sm,
      color: '#000',
      cursor: 'pointer',
      opacity: 0,
      transition: 'all 0.2s ease',
      zIndex: 10,
    },
    itemSprite: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'contain',
      imageRendering: 'pixelated',
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.xs,
    },
    itemName: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    emptyState: {
      textAlign: 'center',
      padding: SPACING.xl,
      color: COLORS.text.muted,
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: SPACING.md,
    },
    emptyText: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      marginBottom: SPACING.sm,
    },
    emptyHint: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.muted,
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    uploadSection: {
      padding: SPACING.md,
      borderBottom: `1px solid ${COLORS.ui.border}`
    },
    status: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.secondary,
      marginTop: SPACING.sm,
      textAlign: 'center'
    },
    forgePanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: SPACING.lg,
      overflow: 'auto',
    },
    forgeTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.lg,
      color: COLORS.text.primary,
      marginBottom: SPACING.md,
    },
    forgeDescription: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.secondary,
      marginBottom: SPACING.lg,
    },
    forgeSection: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      border: `1px solid ${COLORS.ui.border}`,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    forgeSectionTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.ui.active,
      marginBottom: SPACING.md,
    },
    forgeButton: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: `${SPACING.md} ${SPACING.lg}`,
      backgroundColor: COLORS.ui.active,
      border: 'none',
      borderRadius: BORDER_RADIUS.md,
      color: '#000',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    forgeButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    selectedPreview: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md,
      padding: SPACING.md,
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.md,
    },
    selectedSprite: {
      width: '80px',
      height: '80px',
      objectFit: 'contain',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: COLORS.background.secondary,
    },
    selectedInfo: {
      flex: 1,
    },
    selectedName: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.primary,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    selectedType: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.muted,
    },
  };

  // Render Library view
  const renderLibrary = () => (
    <>
      {/* Sidebar with Originals/Transformations */}
      <div style={styles.sidebar}>
        {/* Resize handle */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '6px',
            height: '100%',
            cursor: 'ew-resize',
            backgroundColor: isResizingSidebar ? COLORS.ui.active : 'transparent',
            zIndex: 10,
          }}
          onMouseDown={handleSidebarResizeStart}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${COLORS.ui.active}50`}
          onMouseLeave={(e) => !isResizingSidebar && (e.currentTarget.style.backgroundColor = 'transparent')}
        />
        <div style={styles.sidebarTabs}>
          {LIBRARY_TABS.map(tab => (
            <button
              key={tab.id}
              style={styles.sidebarTab(activeLibraryTab === tab.id)}
              onClick={() => setActiveLibraryTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={styles.sidebarContent}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>
              {activeLibraryTab === 'originals' ? 'Uploaded Sprites' : 'Generated Monsters'}
            </span>
            <span style={styles.itemCount}>({currentLibraryItems.length})</span>
          </div>
          
          {currentLibraryItems.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                {activeLibraryTab === 'originals' ? <ImageIcon size={48} /> : <MonsterIcon size={48} />}
              </div>
              <div style={styles.emptyText}>
                {activeLibraryTab === 'originals' 
                  ? 'No sprites yet' 
                  : 'No transformations yet'}
              </div>
              <div style={styles.emptyHint}>
                {activeLibraryTab === 'originals' 
                  ? 'Upload a sprite to get started' 
                  : 'Use the Forge to create monsters'}
              </div>
            </div>
          ) : activeLibraryTab === 'originals' ? (
            // Originals: separated by type (sprites vs sprite sheets)
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              {(() => {
                const sprites = originals.filter(o => !o.isSpriteSheet);
                const sheets = originals.filter(o => o.isSpriteSheet);
                
                return (
                  <>
                    {/* Sprite Sheets */}
                    {sheets.length > 0 && (
                      <div>
                        <div style={{
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          color: COLORS.text.muted,
                          marginBottom: SPACING.xs,
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING.xs
                        }}>
                          <GroupIcon size={14} /> Sprite Sheets ({sheets.length})
                        </div>
                        <div style={styles.itemGrid}>
                          {sheets.map(item => (
                            <div
                              key={item.id}
                              style={{
                                ...styles.itemCard(selectedItem?.id === item.id),
                                border: `2px solid ${selectedItem?.id === item.id ? COLORS.ui.active : COLORS.ui.info}40`,
                              }}
                              onClick={() => setSelectedItem(item)}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                            >
                              <button
                                style={styles.itemDeleteButton}
                                onClick={(e) => deleteOriginal(item.id, e)}
                                title="Delete"
                              >
                                <DeleteIcon size={12} color="#fff" />
                              </button>
                              <button
                                style={{
                                  ...styles.itemForgeButton,
                                  opacity: hoveredItemId === item.id ? 1 : 0,
                                }}
                                onClick={(e) => openInForge(item, e)}
                                title="Open in Forge"
                              >
                                <ForgeIcon size={16} color="#000" />
                              </button>
                              <img
                                src={item.base64 || item.baseSprite}
                                alt={item.name || item.filename}
                                style={styles.itemSprite}
                              />
                              <div style={styles.itemName}>
                                {item.name || item.filename || 'Sheet'}
                              </div>
                              <div style={{
                                fontSize: TYPOGRAPHY.fontSize.xs,
                                color: COLORS.ui.info,
                                marginTop: '2px'
                              }}>
                                {item.spriteCount} sprites
                                {item.hasExtractedSprites && (
                                  <span style={{ color: COLORS.ui.success, marginLeft: '4px' }}>
                                    (extracted)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Single Sprites - Group by parent sheet */}
                    {sprites.length > 0 && (() => {
                      // Separate uploaded sprites from extracted sprites
                      const uploadedSprites = sprites.filter(s => !s.parentSheetId);
                      const extractedSprites = sprites.filter(s => s.parentSheetId);
                      
                      // Group extracted sprites by parent sheet
                      const extractedBySheet = {};
                      extractedSprites.forEach(sprite => {
                        if (!extractedBySheet[sprite.parentSheetId]) {
                          extractedBySheet[sprite.parentSheetId] = {
                            parentName: sprite.parentSheetName,
                            parentId: sprite.parentSheetId,
                            sprites: []
                          };
                        }
                        extractedBySheet[sprite.parentSheetId].sprites.push(sprite);
                      });
                      
                      return (
                        <div>
                          <div style={{
                            fontSize: TYPOGRAPHY.fontSize.xs,
                            color: COLORS.text.muted,
                            marginBottom: SPACING.xs,
                            display: 'flex',
                            alignItems: 'center',
                            gap: SPACING.xs
                          }}>
                            <ImageIcon size={14} /> Sprites ({sprites.length})
                          </div>
                          
                          {/* Uploaded sprites (not from extraction) */}
                          {uploadedSprites.length > 0 && (
                            <div style={styles.itemGrid}>
                              {uploadedSprites.map(item => (
                                <div
                                  key={item.id}
                                  style={styles.itemCard(selectedItem?.id === item.id)}
                                  onClick={() => setSelectedItem(item)}
                                  onMouseEnter={() => setHoveredItemId(item.id)}
                                  onMouseLeave={() => setHoveredItemId(null)}
                                >
                                  <button
                                    style={styles.itemDeleteButton}
                                    onClick={(e) => deleteOriginal(item.id, e)}
                                    title="Delete"
                                  >
                                    <DeleteIcon size={12} color="#fff" />
                                  </button>
                                  <button
                                    style={{
                                      ...styles.itemForgeButton,
                                      opacity: hoveredItemId === item.id ? 1 : 0,
                                    }}
                                    onClick={(e) => openInForge(item, e)}
                                    title="Open in Forge"
                                  >
                                    <ForgeIcon size={16} color="#000" />
                                  </button>
                                  <img
                                    src={item.base64 || item.baseSprite}
                                    alt={item.name || item.filename}
                                    style={styles.itemSprite}
                                  />
                                  <div style={styles.itemName}>
                                    {item.name || item.filename || 'Sprite'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Extracted sprites grouped by parent sheet */}
                          {Object.values(extractedBySheet).map(group => (
                            <div key={group.parentId} style={{ marginTop: SPACING.md }}>
                              <div style={{
                                fontSize: TYPOGRAPHY.fontSize.xs,
                                color: COLORS.ui.info,
                                marginBottom: SPACING.xs,
                                padding: `${SPACING.xs} ${SPACING.sm}`,
                                backgroundColor: `${COLORS.ui.info}15`,
                                borderRadius: BORDER_RADIUS.sm,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}>
                                <span>From: {group.parentName}</span>
                                <span>({group.sprites.length})</span>
                              </div>
                              <div style={styles.itemGrid}>
                                {group.sprites.map(item => (
                                  <div
                                    key={item.id}
                                    style={{
                                      ...styles.itemCard(selectedItem?.id === item.id),
                                      border: `2px solid ${selectedItem?.id === item.id ? COLORS.ui.active : COLORS.ui.info}30`,
                                    }}
                                    onClick={() => setSelectedItem(item)}
                                    onMouseEnter={() => setHoveredItemId(item.id)}
                                    onMouseLeave={() => setHoveredItemId(null)}
                                  >
                                    <button
                                      style={styles.itemDeleteButton}
                                      onClick={(e) => deleteOriginal(item.id, e)}
                                      title="Delete"
                                    >
                                      <DeleteIcon size={12} color="#fff" />
                                    </button>
                                    <button
                                      style={{
                                        ...styles.itemForgeButton,
                                        opacity: hoveredItemId === item.id ? 1 : 0,
                                      }}
                                      onClick={(e) => openInForge(item, e)}
                                      title="Open in Forge"
                                    >
                                      <ForgeIcon size={16} color="#000" />
                                    </button>
                                    <img
                                      src={item.base64 || item.baseSprite}
                                      alt={item.name || item.filename}
                                      style={styles.itemSprite}
                                    />
                                    <div style={styles.itemName}>
                                      {item.name || item.filename || 'Sprite'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>
          ) : (
            // Transformations: grouped by session
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              {(() => {
                // Group by sessionId
                const groups = {};
                const ungrouped = [];
                
                transformations.forEach(item => {
                  if (item.sessionId) {
                    if (!groups[item.sessionId]) {
                      groups[item.sessionId] = {
                        sessionId: item.sessionId,
                        sessionName: item.sessionName || 'Generated Set',
                        items: []
                      };
                    }
                    groups[item.sessionId].items.push(item);
                  } else {
                    ungrouped.push(item);
                  }
                });
                
                const groupList = Object.values(groups);
                
                return (
                  <>
                    {/* Grouped items */}
                    {groupList.map(group => (
                      <div key={group.sessionId} style={{
                        backgroundColor: COLORS.background.card,
                        borderRadius: BORDER_RADIUS.md,
                        border: `1px solid ${COLORS.ui.border}`,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: `${SPACING.xs} ${SPACING.sm}`,
                          backgroundColor: COLORS.background.tertiary,
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          color: COLORS.text.secondary,
                          fontWeight: TYPOGRAPHY.fontWeight.medium,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{group.sessionName}</span>
                          <span style={{ color: COLORS.text.muted }}>({group.items.length})</span>
                        </div>
                        <div style={{ ...styles.itemGrid, padding: SPACING.sm, gap: SPACING.xs }}>
                          {group.items.map(item => (
                            <div
                              key={item.id}
                              style={{
                                ...styles.itemCard(selectedItem?.id === item.id),
                                padding: SPACING.xs
                              }}
                              onClick={() => setSelectedItem(item)}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                            >
                              <button
                                style={styles.itemDeleteButton}
                                onClick={(e) => deleteTransformation(item.id, e)}
                                title="Delete"
                              >
                                <DeleteIcon size={10} color="#fff" />
                              </button>
                              <button
                                style={{
                                  ...styles.itemForgeButton,
                                  opacity: hoveredItemId === item.id ? 1 : 0,
                                  width: '24px',
                                  height: '24px',
                                }}
                                onClick={(e) => openInForge(item, e)}
                                title="Open in Forge"
                              >
                                <ForgeIcon size={14} color="#000" />
                              </button>
                              <img
                                src={item.base64 || item.baseSprite}
                                alt={item.name}
                                style={{ ...styles.itemSprite, marginBottom: 0 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Ungrouped items */}
                    {ungrouped.length > 0 && (
                      <div>
                        {groupList.length > 0 && (
                          <div style={{
                            fontSize: TYPOGRAPHY.fontSize.xs,
                            color: COLORS.text.muted,
                            marginBottom: SPACING.xs
                          }}>
                            Other
                          </div>
                        )}
                        <div style={styles.itemGrid}>
                          {ungrouped.map(item => (
                            <div
                              key={item.id}
                              style={styles.itemCard(selectedItem?.id === item.id)}
                              onClick={() => setSelectedItem(item)}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                            >
                              <button
                                style={styles.itemDeleteButton}
                                onClick={(e) => deleteTransformation(item.id, e)}
                                title="Delete"
                              >
                                <DeleteIcon size={12} color="#fff" />
                              </button>
                              <button
                                style={{
                                  ...styles.itemForgeButton,
                                  opacity: hoveredItemId === item.id ? 1 : 0,
                                }}
                                onClick={(e) => openInForge(item, e)}
                                title="Open in Forge"
                              >
                                <ForgeIcon size={16} color="#000" />
                              </button>
                              <img
                                src={item.base64 || item.baseSprite}
                                alt={item.name}
                                style={styles.itemSprite}
                              />
                              <div style={styles.itemName}>
                                {item.name || 'Sprite'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={styles.content}>
        <div style={styles.uploadSection}>
          <UploadZone onUpload={handleFileUpload} processing={processing} />
          {processingStage && <div style={styles.status}>{processingStage}</div>}
        </div>

        {selectedItem && activeLibraryTab === 'transformations' && (
          <MonsterDetail monster={selectedItem} onUpdate={handleMonsterUpdate} />
        )}
        
        {selectedItem && activeLibraryTab === 'originals' && (
          <div style={{ padding: SPACING.lg, textAlign: 'center' }}>
            <img
              src={selectedItem.base64}
              alt="Selected sprite"
              style={{
                maxWidth: '400px',
                maxHeight: '400px',
                imageRendering: 'pixelated',
                border: `2px solid ${COLORS.ui.border}`,
                borderRadius: BORDER_RADIUS.md,
              }}
            />
            {selectedItem.isSpriteSheet && (
              <div style={{ 
                marginTop: SPACING.sm, 
                padding: SPACING.sm,
                backgroundColor: `${COLORS.ui.info}20`,
                borderRadius: BORDER_RADIUS.sm,
                border: `1px solid ${COLORS.ui.info}40`,
                display: 'inline-block'
              }}>
                <span style={{ color: COLORS.ui.info, fontSize: TYPOGRAPHY.fontSize.sm }}>
                  Sprite Sheet - {selectedItem.spriteCount} characters detected
                </span>
              </div>
            )}
            <div style={{ marginTop: SPACING.md, color: COLORS.text.secondary }}>
              Select this sprite and go to <strong>Forge</strong> to transform it
              {selectedItem.isSpriteSheet && ` (will generate poses for all ${selectedItem.spriteCount} characters)`}
            </div>
            <button
              style={{
                marginTop: SPACING.lg,
                padding: `${SPACING.sm} ${SPACING.xl}`,
                backgroundColor: COLORS.ui.active,
                border: 'none',
                borderRadius: BORDER_RADIUS.md,
                color: '#000',
                fontFamily: TYPOGRAPHY.fontFamily.system,
                fontSize: TYPOGRAPHY.fontSize.md,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: SPACING.sm,
              }}
              onClick={() => openInForge(selectedItem)}
            >
              <ForgeIcon size={20} color="#000" /> Open in Forge
            </button>
          </div>
        )}
        
        {!selectedItem && (
          <div style={{ ...styles.emptyState, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={styles.emptyIcon}>👆</div>
            <div style={styles.emptyText}>Select an item from the library</div>
            <div style={styles.emptyHint}>Or upload a new sprite above</div>
          </div>
        )}
      </div>
    </>
  );

  // Toggle pose selection
  const togglePose = (poseId) => {
    setSelectedPoses(prev => 
      prev.includes(poseId) 
        ? prev.filter(p => p !== poseId)
        : [...prev, poseId]
    );
  };

  // Regenerate a single pose
  const regenerateSingle = async (poseId) => {
    if (!selectedItem) return;
    
    setProcessing(true);
    setProcessingStage(`Regenerating ${poseId}...`);
    
    const sourceImage = selectedItem.base64 || selectedItem.baseSprite;
    
    try {
      const genOptions = {
        customPrompt,
        creativity,
        colorPalette,
        customColors: colorPalette === 'custom' ? customColors : []
      };
      
      const newSprite = await nanoBanana.generateWithStyle(sourceImage, selectedStyle, poseId, genOptions);
      
      if (newSprite) {
        setGeneratedSprites(prev => ({ ...prev, [poseId]: newSprite }));
        setProcessingStage(`Regenerated ${poseId}!`);
      } else {
        setProcessingStage(`Failed to regenerate ${poseId}`);
      }
    } catch (error) {
      console.error(`[App] Regenerate ${poseId} failed:`, error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle drag-drop on Forge area
  const handleForgeDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setForgeDragOver(true);
  };

  const handleForgeDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setForgeDragOver(false);
  };

  const handleForgeDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setForgeDragOver(false);
    
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setProcessingStage('Please drop an image file');
      return;
    }
    
    // Show upload modal for the dropped file
    handleFileUpload(file);
  };

  // Save generated sprites to library
  const saveGeneratedSprites = () => {
    if (Object.keys(generatedSprites).length === 0) return;
    
    const sessionId = `session_${Date.now()}`;
    const sessionName = `${selectedItem?.name || selectedItem?.filename || 'Sprite'} - ${ART_STYLES[selectedStyle].name}`;
    
    const newTransformations = Object.entries(generatedSprites)
      .filter(([_, result]) => {
        // Handle both single sprite format (string) and batch format (object with sprite)
        if (typeof result === 'object' && result?.sprite) return result.sprite !== null;
        return result !== null;
      })
      .map(([key, result]) => {
        // Handle both formats
        const isBatchResult = typeof result === 'object' && result?.sprite;
        const spriteImage = isBatchResult ? result.sprite : result;
        const poseId = isBatchResult ? result.poseId : key;
        const spriteName = isBatchResult ? result.spriteName : (selectedItem?.name || 'Sprite');
        
        return {
          id: `gen_${Date.now()}_${key}`,
          name: `${spriteName} (${ART_STYLES[selectedStyle].name} - ${poseId})`,
          baseSprite: spriteImage,
          base64: spriteImage,
          originalId: selectedItem?.id,
          style: selectedStyle,
          pose: poseId,
          createdAt: new Date().toISOString(),
          primaryElement: selectedItem?.primaryElement || 'Unknown',
          sessionId,
          sessionName,
          genOptions: { creativity, colorPalette, customColors, customPrompt },
          // For batch results, also store source sprite info
          ...(isBatchResult && {
            sourceSpriteName: result.spriteName,
            sourceSpriteIndex: result.spriteIndex,
          })
        };
      });
    
    if (newTransformations.length > 0) {
      setTransformations(prev => [...prev, ...newTransformations]);
      
      // Show prominent toast with link to Library
      setToast({
        message: `Saved ${newTransformations.length} sprite(s) to Library!`,
        type: 'success',
        action: () => {
          setActiveMainTab('library');
          setToast(null);
        },
        actionLabel: 'View in Library'
      });
      
      // Auto-dismiss after 8 seconds
      setTimeout(() => setToast(null), 8000);
    }
  };

  // Generate sprites with selected style and poses
  const generateSprites = async () => {
    if (!selectedItem || selectedPoses.length === 0) return;
    
    // Check if we're in batch mode (sprite sheet with extracted sprites)
    const isBatchMode = selectedItem?.isSpriteSheet && 
                        extractedSprites.length > 0 && 
                        selectedExtractedSprites.length > 0;
    
    if (isBatchMode) {
      return generateBatchSprites();
    }
    
    setProcessing(true);
    setGeneratedSprites({});
    
    const sourceImage = selectedItem.base64 || selectedItem.baseSprite;
    
    try {
      // Build generation options
      const genOptions = {
        customPrompt,
        creativity,
        colorPalette,
        customColors: colorPalette === 'custom' ? customColors : []
      };
      
      // Generate poses one at a time with real-time updates
      const results = {};
      let completed = 0;
      let failed = 0;
      
      for (const poseId of selectedPoses) {
        setProcessingStage(`Generating ${poseId}... (${completed + 1}/${selectedPoses.length})`);
        
        try {
          const result = await nanoBanana.generateWithStyle(
            sourceImage,
            selectedStyle,
            poseId,
            genOptions
          );
          
          results[poseId] = result;
          completed++;
          
          // Update UI immediately with each result (real-time preview)
          setGeneratedSprites({ ...results });
          
          // Delay between requests to avoid rate limits
          if (completed < selectedPoses.length) {
            setProcessingStage(`Generated ${poseId}! Waiting before next... (${completed}/${selectedPoses.length})`);
            await nanoBanana.delay(3000);
          }
          
        } catch (error) {
          console.error(`Failed to generate ${poseId}:`, error);
          results[poseId] = null;
          failed++;
          
          // If rate limited, wait longer and retry once
          if (error.message.includes('Rate limit') || error.message.includes('429')) {
            setProcessingStage(`Rate limited on ${poseId}, waiting 15s...`);
            await nanoBanana.delay(15000);
            
            // Retry once
            try {
              const retryResult = await nanoBanana.generateWithStyle(
                sourceImage,
                selectedStyle,
                poseId,
                genOptions
              );
              results[poseId] = retryResult;
              failed--;
              completed++;
              setGeneratedSprites({ ...results });
            } catch (retryError) {
              console.error(`Retry failed for ${poseId}:`, retryError);
            }
          }
        }
      }
      
      if (failed > 0) {
        setProcessingStage(`Generated ${completed} sprite(s), ${failed} failed`);
      } else {
        setProcessingStage(`Successfully generated ${completed} sprite(s)!`);
      }
      
    } catch (error) {
      console.error('[App] Sprite generation failed:', error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Batch generate poses for multiple extracted sprites
  const generateBatchSprites = async () => {
    const spritesToProcess = extractedSprites.filter(s => 
      selectedExtractedSprites.includes(s.index)
    );
    
    if (spritesToProcess.length === 0) return;
    
    setProcessing(true);
    setGeneratedSprites({});
    setBatchProgress({ current: 0, total: spritesToProcess.length, results: {} });
    
    const genOptions = {
      customPrompt,
      creativity,
      colorPalette,
      customColors: colorPalette === 'custom' ? customColors : []
    };
    
    const allResults = {};
    let completed = 0;
    let failed = 0;
    
    try {
      for (const sprite of spritesToProcess) {
        const spriteName = sprite.name || `Sprite ${sprite.index + 1}`;
        setProcessingStage(`Processing ${spriteName} (${completed + 1}/${spritesToProcess.length})...`);
        
        try {
          const results = await nanoBanana.generatePoseSet(
            sprite.base64,
            selectedStyle,
            selectedPoses,
            genOptions,
            (progress) => {
              if (progress.done) {
                // Individual sprite done
              } else if (progress.message) {
                setProcessingStage(`${spriteName}: ${progress.message} (${completed + 1}/${spritesToProcess.length})`);
              } else {
                setProcessingStage(`${spriteName}: ${progress.currentPose}... (${completed + 1}/${spritesToProcess.length})`);
              }
            }
          );
          
          // Store results keyed by sprite index + pose
          Object.entries(results).forEach(([poseId, result]) => {
            allResults[`${sprite.index}_${poseId}`] = {
              sprite: result,
              spriteName,
              spriteIndex: sprite.index,
              poseId,
              originalBase64: sprite.base64
            };
          });
          
          completed++;
          setBatchProgress(prev => ({ 
            ...prev, 
            current: completed,
            results: { ...allResults }
          }));
          
        } catch (error) {
          console.error(`[App] Failed to process ${spriteName}:`, error);
          failed++;
          
          // If rate limited, stop batch
          if (error.message.includes('Rate limit')) {
            setProcessingStage(`Rate limited after ${completed} sprites. Try again later.`);
            break;
          }
        }
      }
      
      setGeneratedSprites(allResults);
      
      if (failed > 0) {
        setProcessingStage(`Completed ${completed}/${spritesToProcess.length} sprites (${failed} failed)`);
      } else {
        setProcessingStage(`Successfully generated poses for ${completed} sprites!`);
      }
      
    } catch (error) {
      console.error('[App] Batch generation failed:', error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
      setBatchProgress(null);
    }
  };

  // ===== NEW TWO-PHASE GENERATION WORKFLOW =====
  
  // Phase 1: Generate base sprites (front pose) for each selected sprite with real-time preview
  const startBaseGeneration = async () => {
    const spritesToProcess = extractedSprites.filter(s => 
      selectedExtractedSprites.includes(s.index)
    );
    
    if (spritesToProcess.length === 0) return;
    
    setGenerationPhase('base');
    setProcessing(true);
    setStreamingResults({});
    
    // Initialize base generations array with pending state
    const initialBases = spritesToProcess.map(sprite => ({
      spriteIndex: sprite.index,
      spriteName: sprite.name || `Sprite ${sprite.index + 1}`,
      originalBase64: sprite.base64,
      generatedBase64: null,
      approved: null, // null = pending, true = approved, false = rejected
      generating: false,
      error: null,
    }));
    setBaseGenerations(initialBases);
    
    const genOptions = {
      customPrompt,
      creativity,
      colorPalette,
      customColors: colorPalette === 'custom' ? customColors : []
    };
    
    // Generate base (front) pose for each sprite with real-time updates
    for (let i = 0; i < spritesToProcess.length; i++) {
      const sprite = spritesToProcess[i];
      const spriteName = sprite.name || `Sprite ${sprite.index + 1}`;
      
      // Mark this sprite as generating
      setBaseGenerations(prev => prev.map((base, idx) => 
        idx === i ? { ...base, generating: true } : base
      ));
      setProcessingStage(`Generating base: ${spriteName} (${i + 1}/${spritesToProcess.length})`);
      
      try {
        // Generate only the "front" pose as the base
        const result = await nanoBanana.generateWithStyle(
          sprite.base64,
          selectedStyle,
          'front', // Always use front as the base pose for approval
          genOptions
        );
        
        // Update with result immediately (real-time preview)
        setBaseGenerations(prev => prev.map((base, idx) => 
          idx === i ? { ...base, generatedBase64: result, generating: false } : base
        ));
        
        // Also add to streaming results for immediate display
        setStreamingResults(prev => ({
          ...prev,
          [`base_${sprite.index}`]: { base64: result, spriteName, spriteIndex: sprite.index }
        }));
        
        // Small delay between requests to avoid rate limits
        if (i < spritesToProcess.length - 1) {
          await nanoBanana.delay(2000);
        }
        
      } catch (error) {
        console.error(`[App] Failed to generate base for ${spriteName}:`, error);
        setBaseGenerations(prev => prev.map((base, idx) => 
          idx === i ? { ...base, generating: false, error: error.message } : base
        ));
        
        // If rate limited, stop and move to approval phase with what we have
        if (error.message.includes('Rate limit')) {
          setProcessingStage(`Rate limited. Review generated bases below.`);
          break;
        }
      }
    }
    
    setProcessing(false);
    setGenerationPhase('approval');
    setProcessingStage('Review and approve base sprites before generating variants');
  };

  // Toggle approval status for a base generation
  const toggleBaseApproval = (index) => {
    setBaseGenerations(prev => prev.map((base, idx) => {
      if (idx !== index) return base;
      // Cycle: null -> true -> false -> null (or just toggle true/false if already set)
      const newApproved = base.approved === null ? true : 
                          base.approved === true ? false : true;
      return { ...base, approved: newApproved };
    }));
  };

  // Approve all generated bases at once
  const approveAllBases = () => {
    setBaseGenerations(prev => prev.map(base => 
      base.generatedBase64 && !base.error ? { ...base, approved: true } : base
    ));
  };

  // Reject all generated bases
  const rejectAllBases = () => {
    setBaseGenerations(prev => prev.map(base => ({ ...base, approved: false })));
  };

  // Phase 2: Generate remaining pose variants for approved bases only
  const generateApprovedVariants = async () => {
    const approvedBases = baseGenerations.filter(b => b.approved === true && b.generatedBase64);
    
    if (approvedBases.length === 0) {
      setProcessingStage('No bases approved. Select at least one to generate variants.');
      return;
    }
    
    // Get remaining poses (exclude 'front' since we already have it as base)
    const remainingPoses = selectedPoses.filter(p => p !== 'front');
    
    if (remainingPoses.length === 0) {
      // Only front was selected, just save the bases
      setProcessingStage('Saving approved bases...');
      const results = {};
      approvedBases.forEach(base => {
        results[`${base.spriteIndex}_front`] = {
          sprite: base.generatedBase64,
          spriteName: base.spriteName,
          spriteIndex: base.spriteIndex,
          poseId: 'front',
          originalBase64: base.originalBase64
        };
      });
      setGeneratedSprites(results);
      setGenerationPhase('idle');
      setBaseGenerations([]);
      setProcessingStage(`Saved ${approvedBases.length} sprite(s)!`);
      return;
    }
    
    setGenerationPhase('variants');
    setProcessing(true);
    
    const genOptions = {
      customPrompt,
      creativity,
      colorPalette,
      customColors: colorPalette === 'custom' ? customColors : []
    };
    
    const allResults = {};
    
    // Add the already-generated front poses
    approvedBases.forEach(base => {
      allResults[`${base.spriteIndex}_front`] = {
        sprite: base.generatedBase64,
        spriteName: base.spriteName,
        spriteIndex: base.spriteIndex,
        poseId: 'front',
        originalBase64: base.originalBase64
      };
    });
    
    // Generate remaining poses for each approved sprite
    for (let i = 0; i < approvedBases.length; i++) {
      const base = approvedBases[i];
      
      for (let j = 0; j < remainingPoses.length; j++) {
        const poseId = remainingPoses[j];
        const totalProgress = i * remainingPoses.length + j + 1;
        const totalOperations = approvedBases.length * remainingPoses.length;
        
        setProcessingStage(`${base.spriteName}: ${poseId} (${totalProgress}/${totalOperations})`);
        
        try {
          const result = await nanoBanana.generateWithStyle(
            base.originalBase64, // Use original sprite, not the generated base
            selectedStyle,
            poseId,
            genOptions
          );
          
          // Add to results immediately for real-time preview
          allResults[`${base.spriteIndex}_${poseId}`] = {
            sprite: result,
            spriteName: base.spriteName,
            spriteIndex: base.spriteIndex,
            poseId,
            originalBase64: base.originalBase64
          };
          
          // Update streaming results for immediate display
          setStreamingResults(prev => ({ ...prev, ...allResults }));
          setGeneratedSprites({ ...allResults });
          
          // Delay between requests
          if (j < remainingPoses.length - 1 || i < approvedBases.length - 1) {
            await nanoBanana.delay(2000);
          }
          
        } catch (error) {
          console.error(`[App] Failed to generate ${poseId} for ${base.spriteName}:`, error);
          
          if (error.message.includes('Rate limit')) {
            setProcessingStage(`Rate limited. Generated ${Object.keys(allResults).length} variants.`);
            break;
          }
        }
      }
    }
    
    setGeneratedSprites(allResults);
    setProcessing(false);
    setGenerationPhase('idle');
    setBaseGenerations([]);
    setStreamingResults({});
    setProcessingStage(`Generated ${Object.keys(allResults).length} sprite variants!`);
  };

  // Cancel generation and reset state
  const cancelGeneration = () => {
    setProcessing(false);
    setGenerationPhase('idle');
    setBaseGenerations([]);
    setStreamingResults({});
    setProcessingStage('');
  };

  // Render Forge view
  const renderForge = () => {
    const selectedOriginal = selectedItem && originals.find(o => o.id === selectedItem.id);
    const selectedTransformation = selectedItem && transformations.find(t => t.id === selectedItem.id);
    const canTransform = selectedOriginal || selectedTransformation;
    
    // Calculate sprite count and total generations
    const isSpriteSheet = selectedItem?.isSpriteSheet;
    const spriteCount = selectedItem?.spriteCount || 1;
    const totalGenerations = spriteCount * selectedPoses.length;
    
    const forgeStyles = {
      styleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
      },
      styleCard: (isSelected) => ({
        padding: SPACING.sm,
        backgroundColor: isSelected ? COLORS.ui.active : COLORS.background.card,
        border: `2px solid ${isSelected ? COLORS.ui.active : COLORS.ui.border}`,
        borderRadius: BORDER_RADIUS.md,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
      }),
      styleLabel: (isSelected) => ({
        fontFamily: TYPOGRAPHY.fontFamily.system,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: isSelected ? '#000' : COLORS.text.primary,
        marginBottom: '2px',
      }),
      styleDesc: (isSelected) => ({
        fontFamily: TYPOGRAPHY.fontFamily.system,
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: isSelected ? '#333' : COLORS.text.muted,
      }),
      poseGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
      },
      poseChip: (isSelected) => ({
        padding: `${SPACING.xs} ${SPACING.md}`,
        backgroundColor: isSelected ? COLORS.ui.active : 'transparent',
        border: `1px solid ${isSelected ? COLORS.ui.active : COLORS.ui.border}`,
        borderRadius: BORDER_RADIUS.lg,
        cursor: 'pointer',
        fontFamily: TYPOGRAPHY.fontFamily.system,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: isSelected ? '#000' : COLORS.text.secondary,
        transition: 'all 0.2s ease',
      }),
      customPromptInput: {
        width: '100%',
        padding: SPACING.sm,
        backgroundColor: COLORS.background.primary,
        border: `1px solid ${COLORS.ui.border}`,
        borderRadius: BORDER_RADIUS.sm,
        color: COLORS.text.primary,
        fontFamily: TYPOGRAPHY.fontFamily.system,
        fontSize: TYPOGRAPHY.fontSize.sm,
        resize: 'vertical',
        minHeight: '60px',
      },
      resultsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: SPACING.md,
        marginTop: SPACING.md,
      },
      resultCard: {
        backgroundColor: COLORS.background.card,
        border: `1px solid ${COLORS.ui.border}`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        textAlign: 'center',
      },
      resultImage: {
        width: '100%',
        aspectRatio: '1',
        objectFit: 'contain',
        imageRendering: 'pixelated',
        backgroundColor: COLORS.background.primary,
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.xs,
      },
      resultLabel: {
        fontFamily: TYPOGRAPHY.fontFamily.system,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
      },
    };
    
    return (
      <div style={styles.forgePanel}>
        <h2 style={styles.forgeTitle}>Sprite Forge</h2>
        <p style={styles.forgeDescription}>
          Transform your sprites into different art styles and generate pose variants for game-ready sprite sheets.
        </p>
        
        {/* Selected Item Preview / Drop Zone */}
        <div 
          style={{
            ...styles.forgeSection,
            border: forgeDragOver ? `2px dashed ${COLORS.ui.active}` : `1px solid ${COLORS.ui.border}`,
            backgroundColor: forgeDragOver ? `${COLORS.ui.active}10` : COLORS.background.card,
            transition: 'all 0.2s ease',
          }}
          onDragOver={handleForgeDragOver}
          onDragLeave={handleForgeDragLeave}
          onDrop={handleForgeDrop}
        >
          <h3 style={styles.forgeSectionTitle}>Source Sprite</h3>
          
          {canTransform ? (
            <div style={styles.selectedPreview}>
              <img
                src={selectedItem.base64 || selectedItem.baseSprite}
                alt="Selected"
                style={styles.selectedSprite}
              />
              <div style={styles.selectedInfo}>
                <div style={styles.selectedName}>
                  {selectedItem.name || selectedItem.filename || 'Sprite'}
                </div>
                <div style={styles.selectedType}>
                  {isSpriteSheet ? (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: SPACING.xs,
                      backgroundColor: COLORS.ui.active,
                      color: '#000',
                      padding: `2px ${SPACING.sm}`,
                      borderRadius: BORDER_RADIUS.sm,
                      fontWeight: TYPOGRAPHY.fontWeight.medium
                    }}>
                      Sprite Sheet - {spriteCount} sprites
                    </span>
                  ) : (
                    selectedOriginal ? 'Original Sprite' : 'Transformation'
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              ...styles.emptyState, 
              padding: SPACING.lg,
              border: `2px dashed ${forgeDragOver ? COLORS.ui.active : COLORS.ui.border}`,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: forgeDragOver ? `${COLORS.ui.active}10` : 'transparent',
            }}>
              <div style={styles.emptyIcon}><UploadIcon size={48} /></div>
              <div style={styles.emptyText}>
                {forgeDragOver ? 'Drop image here' : 'Drop an image here'}
              </div>
              <div style={styles.emptyHint}>
                Or choose from your library
              </div>
              {originals.length > 0 && (
                <button
                  style={{
                    marginTop: SPACING.md,
                    padding: `${SPACING.sm} ${SPACING.lg}`,
                    backgroundColor: COLORS.ui.active,
                    border: 'none',
                    borderRadius: BORDER_RADIUS.md,
                    color: '#000',
                    fontFamily: TYPOGRAPHY.fontFamily.system,
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: SPACING.sm,
                  }}
                  onClick={() => setShowLibraryPicker(true)}
                >
                  <LibraryIcon size={16} color="#000" /> Browse Library
                </button>
              )}
            </div>
          )}
          
          {canTransform && (
            <div style={{ 
              marginTop: SPACING.sm, 
              fontSize: TYPOGRAPHY.fontSize.xs, 
              color: COLORS.text.muted,
              textAlign: 'center' 
            }}>
              Drop a new image to replace
            </div>
          )}
        </div>

        {/* Sprite Sheet Extraction Section */}
        {isSpriteSheet && canTransform && (
          <div style={styles.forgeSection}>
            <h3 style={styles.forgeSectionTitle}>Extract Individual Sprites</h3>
            
            {extractedSprites.length === 0 ? (
              <div>
                <p style={{ 
                  fontSize: TYPOGRAPHY.fontSize.sm, 
                  color: COLORS.text.secondary, 
                  marginBottom: SPACING.md 
                }}>
                  Extract individual sprites from this sheet to generate poses for each one.
                </p>
                <button
                  style={{
                    ...styles.forgeButton,
                    width: '100%',
                    justifyContent: 'center',
                    opacity: extracting ? 0.7 : 1,
                  }}
                  onClick={extractSpritesFromSheet}
                  disabled={extracting}
                >
                  {extracting ? 'Extracting...' : `Extract ${spriteCount} Sprite(s)`}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: SPACING.sm 
                }}>
                  <span style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.secondary }}>
                    {selectedExtractedSprites.length} of {extractedSprites.length} selected
                  </span>
                  <div style={{ display: 'flex', gap: SPACING.sm }}>
                    <button
                      style={{
                        fontSize: TYPOGRAPHY.fontSize.xs,
                        color: COLORS.ui.active,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedExtractedSprites(extractedSprites.map(s => s.index))}
                    >
                      Select all
                    </button>
                    <button
                      style={{
                        fontSize: TYPOGRAPHY.fontSize.xs,
                        color: COLORS.text.muted,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedExtractedSprites([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                <div 
                  id="extracted-sprites-container"
                  style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
                    gap: SPACING.sm,
                    height: extractedSpritesHeight,
                    overflowY: 'auto',
                    padding: SPACING.xs,
                    backgroundColor: COLORS.background.primary,
                    borderRadius: BORDER_RADIUS.sm,
                  }}
                >
                  {extractedSprites.map((sprite, idx) => (
                    <div
                      key={sprite.index}
                      style={{
                        cursor: 'pointer',
                        padding: '4px',
                        backgroundColor: selectedExtractedSprites.includes(sprite.index) 
                          ? `${COLORS.ui.active}30` 
                          : 'transparent',
                        border: `2px solid ${selectedExtractedSprites.includes(sprite.index) 
                          ? COLORS.ui.active 
                          : COLORS.ui.border}`,
                        borderRadius: BORDER_RADIUS.sm,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <img
                        src={sprite.base64}
                        alt={sprite.name || `Sprite ${sprite.index + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCarousel(extractedSprites, idx);
                        }}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                          cursor: 'zoom-in',
                        }}
                      />
                      <div 
                        onClick={() => toggleExtractedSprite(sprite.index)}
                        style={{
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          color: COLORS.text.muted,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtractedSprites.includes(sprite.index)}
                          onChange={() => toggleExtractedSprite(sprite.index)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginRight: '4px', cursor: 'pointer' }}
                        />
                        {sprite.name || `#${sprite.index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Vertical resize handle */}
                <div
                  style={{
                    height: '8px',
                    cursor: 'ns-resize',
                    backgroundColor: isResizingExtracted ? COLORS.ui.active : 'transparent',
                    borderRadius: BORDER_RADIUS.sm,
                    marginTop: '4px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onMouseDown={handleExtractedResizeStart}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${COLORS.ui.border}`}
                  onMouseLeave={(e) => !isResizingExtracted && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{
                    width: '40px',
                    height: '4px',
                    backgroundColor: COLORS.ui.border,
                    borderRadius: '2px',
                  }} />
                </div>
                
                <button
                  style={{
                    marginTop: SPACING.sm,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: COLORS.text.muted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setExtractedSprites([]);
                    setSelectedExtractedSprites([]);
                  }}
                >
                  Re-extract sprites
                </button>
              </div>
            )}
          </div>
        )}

        {/* Art Style Selection */}
        <div style={styles.forgeSection}>
          <h3 style={styles.forgeSectionTitle}>Art Style</h3>
          <div style={forgeStyles.styleGrid}>
            {Object.values(ART_STYLES).map(style => (
              <div
                key={style.id}
                style={forgeStyles.styleCard(selectedStyle === style.id)}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div style={forgeStyles.styleLabel(selectedStyle === style.id)}>
                  {style.name}
                </div>
                <div style={forgeStyles.styleDesc(selectedStyle === style.id)}>
                  {style.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pose Selection - Categorized */}
        <div style={styles.forgeSection}>
          <h3 style={styles.forgeSectionTitle}>Poses to Generate</h3>
          
          {Object.entries(POSE_CATEGORIES).map(([catId, category]) => (
            <div key={catId} style={{ marginBottom: SPACING.md }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: SPACING.xs 
              }}>
                <span style={{ 
                  fontSize: TYPOGRAPHY.fontSize.xs, 
                  color: COLORS.text.secondary,
                  fontWeight: TYPOGRAPHY.fontWeight.medium 
                }}>
                  {category.name}
                </span>
                <button
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: COLORS.ui.active,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onClick={() => {
                    const allSelected = category.poses.every(p => selectedPoses.includes(p));
                    if (allSelected) {
                      setSelectedPoses(prev => prev.filter(p => !category.poses.includes(p)));
                    } else {
                      setSelectedPoses(prev => [...new Set([...prev, ...category.poses])]);
                    }
                  }}
                >
                  {category.poses.every(p => selectedPoses.includes(p)) ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div style={forgeStyles.poseGrid}>
                {category.poses.map(poseId => {
                  const pose = POSE_OPTIONS[poseId];
                  return (
                    <button
                      key={pose.id}
                      style={forgeStyles.poseChip(selectedPoses.includes(pose.id))}
                      onClick={() => togglePose(pose.id)}
                      title={pose.description}
                    >
                      {pose.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: SPACING.sm,
            borderTop: `1px solid ${COLORS.ui.border}`,
          }}>
            <span style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs }}>
              Selected: {selectedPoses.length} pose(s)
            </span>
            <button
              style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.muted,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedPoses([])}
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Creativity Slider */}
        <div style={styles.forgeSection}>
          <h3 style={styles.forgeSectionTitle}>Creativity Level</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <span style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, minWidth: '60px' }}>Exact Copy</span>
            <input
              type="range"
              min="0"
              max="100"
              value={creativity}
              onChange={(e) => setCreativity(Number(e.target.value))}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <span style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, minWidth: '80px', textAlign: 'right' }}>Wild Remix</span>
          </div>
          <div style={{ color: COLORS.text.secondary, fontSize: TYPOGRAPHY.fontSize.sm, marginTop: SPACING.xs, textAlign: 'center' }}>
            {creativity <= 10 ? 'Exact match - only pose changes' :
             creativity <= 30 ? 'Very faithful - minor artistic freedom' :
             creativity <= 50 ? 'Balanced - moderate interpretation' :
             creativity <= 70 ? 'Creative - loose inspiration' :
             creativity <= 90 ? 'Reimagined - significant changes' :
             'Wild - dramatic reinterpretation'}
            {' '}({creativity}%)
          </div>
        </div>

        {/* Color Palette */}
        <div style={styles.forgeSection}>
          <h3 style={styles.forgeSectionTitle}>Color Palette</h3>
          <div style={forgeStyles.poseGrid}>
            {Object.values(COLOR_PALETTES).map(palette => (
              <button
                key={palette.id}
                style={forgeStyles.poseChip(colorPalette === palette.id)}
                onClick={() => setColorPalette(palette.id)}
              >
                {palette.name}
              </button>
            ))}
          </div>
          
          {/* Custom Color Picker */}
          {colorPalette === 'custom' && (
            <div style={{ marginTop: SPACING.md, display: 'flex', gap: SPACING.sm, alignItems: 'center' }}>
              {customColors.map((color, index) => (
                <input
                  key={index}
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newColors = [...customColors];
                    newColors[index] = e.target.value;
                    setCustomColors(newColors);
                  }}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: `2px solid ${COLORS.ui.border}`,
                    borderRadius: BORDER_RADIUS.sm,
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
              <span style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, marginLeft: SPACING.sm }}>
                Click to change colors
              </span>
            </div>
          )}
        </div>

        {/* Custom Prompt */}
        <div style={styles.forgeSection}>
          <h3 style={styles.forgeSectionTitle}>Custom Details (Optional)</h3>
          <textarea
            style={forgeStyles.customPromptInput}
            placeholder="Add custom details like 'glowing eyes', 'armored', 'battle-worn', etc."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </div>

        {/* Generate Button - Two-Phase Workflow */}
        <div style={styles.forgeSection}>
          {/* Phase: Idle - Show start button */}
          {generationPhase === 'idle' && (
            <>
              {/* For batch mode (sprite sheets), use two-phase workflow */}
              {isSpriteSheet && extractedSprites.length > 0 && selectedExtractedSprites.length > 0 ? (
                <button
                  style={{
                    ...styles.forgeButton,
                    width: '100%',
                    justifyContent: 'center',
                    ...((!canTransform || processing || selectedPoses.length === 0) ? styles.forgeButtonDisabled : {})
                  }}
                  onClick={startBaseGeneration}
                  disabled={!canTransform || processing || selectedPoses.length === 0}
                >
                  Step 1: Generate Base Sprites ({selectedExtractedSprites.length} sprites)
                </button>
              ) : (
                <button
                  style={{
                    ...styles.forgeButton,
                    width: '100%',
                    justifyContent: 'center',
                    ...((!canTransform || processing || selectedPoses.length === 0) ? styles.forgeButtonDisabled : {})
                  }}
                  onClick={generateSprites}
                  disabled={!canTransform || processing || selectedPoses.length === 0}
                >
                  {processing ? processingStage : `Generate ${selectedPoses.length} Sprite(s)`}
                </button>
              )}
              
              {!processing && (
                <div style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.sm, textAlign: 'center' }}>
                  Requires Google API key in Settings. Each sprite takes ~5-10 seconds.
                </div>
              )}
              
              {!processing && isSpriteSheet && extractedSprites.length === 0 && (
                <div style={{ 
                  color: COLORS.ui.info || '#3b82f6', 
                  fontSize: TYPOGRAPHY.fontSize.xs, 
                  marginTop: SPACING.sm, 
                  textAlign: 'center',
                  padding: SPACING.sm,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: BORDER_RADIUS.sm,
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  Sprite Sheet Mode: Extract sprites above to generate poses for each individual character.
                </div>
              )}
              
              {!processing && isSpriteSheet && extractedSprites.length > 0 && selectedExtractedSprites.length > 0 && (
                <div style={{ 
                  color: COLORS.ui.success || '#22c55e', 
                  fontSize: TYPOGRAPHY.fontSize.xs, 
                  marginTop: SPACING.sm, 
                  textAlign: 'center',
                  padding: SPACING.sm,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: BORDER_RADIUS.sm,
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  Two-Phase Mode: First generate base sprites for review, then generate {selectedPoses.length} pose(s) for approved sprites only.
                </div>
              )}
            </>
          )}
          
          {/* Phase: Base Generation - Show progress and real-time results */}
          {generationPhase === 'base' && (
            <>
              <div style={{
                padding: SPACING.md,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: BORDER_RADIUS.md,
                border: '1px solid rgba(245, 158, 11, 0.3)',
                marginBottom: SPACING.md,
              }}>
                <div style={{ color: '#f59e0b', fontWeight: TYPOGRAPHY.fontWeight.medium, marginBottom: SPACING.sm }}>
                  Step 1: Generating Base Sprites...
                </div>
                <div style={{ color: COLORS.text.secondary, fontSize: TYPOGRAPHY.fontSize.sm }}>
                  {processingStage}
                </div>
              </div>
              
              {/* Real-time preview of generated bases */}
              {baseGenerations.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: SPACING.sm,
                  marginBottom: SPACING.md,
                }}>
                  {baseGenerations.map((base, idx) => (
                    <div key={base.spriteIndex} style={{
                      backgroundColor: COLORS.ui.background,
                      borderRadius: BORDER_RADIUS.md,
                      padding: SPACING.sm,
                      border: base.generating ? '2px solid #f59e0b' : '2px solid transparent',
                      opacity: base.generating ? 1 : (base.generatedBase64 ? 1 : 0.5),
                    }}>
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        backgroundColor: '#fff',
                        borderRadius: BORDER_RADIUS.sm,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: SPACING.xs,
                      }}>
                        {base.generatedBase64 ? (
                          <img src={base.generatedBase64} alt={base.spriteName} style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }} />
                        ) : base.generating ? (
                          <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: '#f59e0b' }}>...</div>
                        ) : base.error ? (
                          <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.ui.danger }}>Error</div>
                        ) : (
                          <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>Pending</div>
                        )}
                      </div>
                      <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.primary, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {base.spriteName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                style={{
                  ...styles.forgeButton,
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: COLORS.ui.danger,
                }}
                onClick={cancelGeneration}
              >
                Cancel Generation
              </button>
            </>
          )}
          
          {/* Phase: Approval - Review and approve/reject bases */}
          {generationPhase === 'approval' && (
            <>
              <div style={{
                padding: SPACING.md,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: BORDER_RADIUS.md,
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginBottom: SPACING.md,
              }}>
                <div style={{ color: '#3b82f6', fontWeight: TYPOGRAPHY.fontWeight.medium, marginBottom: SPACING.sm }}>
                  Step 2: Approve Base Sprites
                </div>
                <div style={{ color: COLORS.text.secondary, fontSize: TYPOGRAPHY.fontSize.sm }}>
                  Click sprites to approve/reject. Green = approved, Red = rejected.
                  Only approved sprites will have variants generated.
                </div>
              </div>
              
              {/* Bulk approve/reject buttons */}
              <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.md }}>
                <button
                  style={{
                    ...styles.forgeButton,
                    flex: 1,
                    justifyContent: 'center',
                    backgroundColor: COLORS.ui.success,
                  }}
                  onClick={approveAllBases}
                >
                  Approve All
                </button>
                <button
                  style={{
                    ...styles.forgeButton,
                    flex: 1,
                    justifyContent: 'center',
                    backgroundColor: COLORS.ui.danger,
                  }}
                  onClick={rejectAllBases}
                >
                  Reject All
                </button>
              </div>
              
              {/* Base sprites for approval */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: SPACING.sm,
                marginBottom: SPACING.md,
              }}>
                {baseGenerations.map((base, idx) => (
                  <div 
                    key={base.spriteIndex} 
                    onClick={() => base.generatedBase64 && !base.error && toggleBaseApproval(idx)}
                    style={{
                      backgroundColor: COLORS.ui.background,
                      borderRadius: BORDER_RADIUS.md,
                      padding: SPACING.sm,
                      cursor: base.generatedBase64 && !base.error ? 'pointer' : 'not-allowed',
                      border: base.approved === true ? '3px solid #22c55e' : 
                              base.approved === false ? '3px solid #ef4444' : 
                              '3px solid transparent',
                      opacity: base.error ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      backgroundColor: '#fff',
                      borderRadius: BORDER_RADIUS.sm,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: SPACING.xs,
                      position: 'relative',
                    }}>
                      {base.generatedBase64 ? (
                        <>
                          <img src={base.generatedBase64} alt={base.spriteName} style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }} />
                          {base.approved !== null && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: base.approved ? '#22c55e' : '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}>
                              {base.approved ? '✓' : '✕'}
                            </div>
                          )}
                        </>
                      ) : base.error ? (
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.ui.danger, textAlign: 'center', padding: SPACING.xs }}>
                          {base.error.substring(0, 30)}...
                        </div>
                      ) : (
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted }}>Not generated</div>
                      )}
                    </div>
                    <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.primary, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {base.spriteName}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Generate variants button */}
              <div style={{ display: 'flex', gap: SPACING.sm }}>
                <button
                  style={{
                    ...styles.forgeButton,
                    flex: 1,
                    justifyContent: 'center',
                    backgroundColor: COLORS.ui.active,
                  }}
                  onClick={generateApprovedVariants}
                  disabled={baseGenerations.filter(b => b.approved === true).length === 0}
                >
                  Generate {selectedPoses.length - 1} More Poses for {baseGenerations.filter(b => b.approved === true).length} Approved Sprite(s)
                </button>
                <button
                  style={{
                    ...styles.forgeButton,
                    justifyContent: 'center',
                  }}
                  onClick={cancelGeneration}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          
          {/* Phase: Variants - Generating remaining poses */}
          {generationPhase === 'variants' && (
            <>
              <div style={{
                padding: SPACING.md,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: BORDER_RADIUS.md,
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: SPACING.md,
              }}>
                <div style={{ color: '#22c55e', fontWeight: TYPOGRAPHY.fontWeight.medium, marginBottom: SPACING.sm }}>
                  Step 3: Generating Pose Variants...
                </div>
                <div style={{ color: COLORS.text.secondary, fontSize: TYPOGRAPHY.fontSize.sm }}>
                  {processingStage}
                </div>
              </div>
              
              <button
                style={{
                  ...styles.forgeButton,
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: COLORS.ui.danger,
                }}
                onClick={cancelGeneration}
              >
                Cancel Generation
              </button>
            </>
          )}
        </div>

        {/* Generated Results */}
        {Object.keys(generatedSprites).length > 0 && (
          <div style={styles.forgeSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <h3 style={{ ...styles.forgeSectionTitle, marginBottom: 0 }}>Generated Sprites</h3>
              <div style={{ display: 'flex', gap: SPACING.sm }}>
                <button
                  style={{
                    ...styles.forgeButton,
                    padding: `${SPACING.xs} ${SPACING.md}`,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                  }}
                  onClick={generateSprites}
                  disabled={processing}
                >
                  <RefreshIcon size={14} /> Regenerate All
                </button>
                <button
                  style={{
                    ...styles.forgeButton,
                    padding: `${SPACING.xs} ${SPACING.md}`,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    backgroundColor: COLORS.ui.success,
                  }}
                  onClick={saveGeneratedSprites}
                  disabled={processing}
                >
                  <SaveIcon size={14} /> Save to Library
                </button>
              </div>
            </div>
            <div style={forgeStyles.resultsGrid}>
              {Object.entries(generatedSprites).map(([key, result], index) => {
                // Handle both single sprite format (string) and batch format (object with sprite property)
                const isBatchResult = result && typeof result === 'object' && result.sprite;
                const spriteImage = isBatchResult ? result.sprite : result;
                const label = isBatchResult 
                  ? `${result.spriteName} - ${POSE_OPTIONS[result.poseId]?.name || result.poseId}`
                  : (POSE_OPTIONS[key]?.name || key);
                
                // Prepare carousel data for this sprite
                const openGeneratedCarousel = () => {
                  const allSprites = Object.entries(generatedSprites)
                    .filter(([_, r]) => {
                      const img = r && typeof r === 'object' && r.sprite ? r.sprite : r;
                      return img !== null;
                    })
                    .map(([k, r], idx) => {
                      const isBatch = r && typeof r === 'object' && r.sprite;
                      return {
                        base64: isBatch ? r.sprite : r,
                        name: isBatch 
                          ? `${r.spriteName} - ${POSE_OPTIONS[r.poseId]?.name || r.poseId}`
                          : (POSE_OPTIONS[k]?.name || k),
                        index: idx,
                      };
                    });
                  setCarouselSprites(allSprites);
                  setCarouselIndex(index);
                  setCarouselOpen(true);
                };
                
                return (
                  <div key={key} style={{ ...forgeStyles.resultCard, position: 'relative', cursor: spriteImage ? 'pointer' : 'default' }}>
                    {spriteImage ? (
                      <>
                        <img
                          src={spriteImage}
                          alt={label}
                          style={forgeStyles.resultImage}
                          onClick={openGeneratedCarousel}
                          title="Click to preview"
                        />
                        <div style={{
                          ...forgeStyles.resultLabel,
                          fontSize: isBatchResult ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
                        }}>
                          {label}
                        </div>
                        {!isBatchResult && (
                          <button
                            style={{
                              marginTop: SPACING.xs,
                              padding: `${SPACING.xs} ${SPACING.sm}`,
                              backgroundColor: 'transparent',
                              border: `1px solid ${COLORS.ui.border}`,
                              borderRadius: BORDER_RADIUS.sm,
                              color: COLORS.text.secondary,
                              fontSize: TYPOGRAPHY.fontSize.xs,
                              cursor: processing ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: SPACING.xs,
                              width: '100%',
                              justifyContent: 'center',
                            }}
                            onClick={() => regenerateSingle(key)}
                            disabled={processing}
                          >
                            <RefreshIcon size={12} /> Redo
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{ padding: SPACING.lg, color: COLORS.text.muted }}>
                        <div>Failed</div>
                        {!isBatchResult && (
                          <button
                            style={{
                              marginTop: SPACING.sm,
                              padding: `${SPACING.xs} ${SPACING.sm}`,
                              backgroundColor: COLORS.ui.active,
                              border: 'none',
                              borderRadius: BORDER_RADIUS.sm,
                              color: '#000',
                              fontSize: TYPOGRAPHY.fontSize.xs,
                              cursor: processing ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => regenerateSingle(key)}
                            disabled={processing}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.sm }}>
              Click "Save to Library" to add these sprites to your Transformations.
            </div>
          </div>
        )}

        {/* Legacy Monster Generation */}
        <div style={{ ...styles.forgeSection, opacity: 0.7 }}>
          <h3 style={styles.forgeSectionTitle}>Data Generation</h3>
          <button
            style={{
              ...styles.forgeButton,
              backgroundColor: COLORS.background.tertiary,
              ...((!canTransform || processing) ? styles.forgeButtonDisabled : {})
            }}
            onClick={() => canTransform && transformOriginal(selectedItem)}
            disabled={!canTransform || processing}
          >
            Generate Monster Stats
          </button>
          <div style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>
            Analyzes sprite and generates stats, abilities, and lore (no image changes)
          </div>
        </div>
        
        {processingStage && !processing && (
          <div style={styles.status}>{processingStage}</div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <h1 style={styles.title}>Monster Forge</h1>
            <span style={styles.subtitle}>Sprite ETL Pipeline v2.0</span>
          </div>
          
          {/* Main Navigation */}
          <nav style={styles.mainNav}>
            {MAIN_TABS.map(tab => (
              <button
                key={tab.id}
                style={styles.mainNavButton(activeMainTab === tab.id)}
                onClick={() => setActiveMainTab(tab.id)}
              >
                <tab.Icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <button 
          style={styles.settingsButton}
          onClick={() => setShowSettings(true)}
        >
          <SettingsIcon size={16} />
          Settings
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {activeMainTab === 'library' && renderLibrary()}
        {activeMainTab === 'forge' && renderForge()}
      </main>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setPendingUpload(null);
        }}
        imagePreview={pendingUpload?.preview}
        filename={pendingUpload?.filename}
        onConfirm={processUpload}
        onAnalyze={analyzeUploadedImage}
      />
      
      {/* Sprite Carousel Modal */}
      {carouselOpen && carouselSprites.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setCarouselOpen(false)}
        >
          {/* Close button */}
          <button
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '32px',
              cursor: 'pointer',
              padding: SPACING.sm,
            }}
            onClick={() => setCarouselOpen(false)}
          >
            ×
          </button>
          
          {/* Navigation arrows */}
          <button
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '48px',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: BORDER_RADIUS.md,
              opacity: carouselIndex > 0 ? 1 : 0.3,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setCarouselIndex(prev => Math.max(0, prev - 1));
            }}
            disabled={carouselIndex === 0}
          >
            ‹
          </button>
          
          <button
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '48px',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: BORDER_RADIUS.md,
              opacity: carouselIndex < carouselSprites.length - 1 ? 1 : 0.3,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setCarouselIndex(prev => Math.min(carouselSprites.length - 1, prev + 1));
            }}
            disabled={carouselIndex === carouselSprites.length - 1}
          >
            ›
          </button>
          
          {/* Main image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '80vw',
              maxHeight: '80vh',
            }}
          >
            <img
              src={carouselSprites[carouselIndex]?.base64}
              alt={carouselSprites[carouselIndex]?.name || `Sprite ${carouselIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                backgroundColor: '#fff',
                borderRadius: BORDER_RADIUS.md,
                padding: SPACING.lg,
              }}
            />
            <div style={{
              marginTop: SPACING.md,
              color: '#fff',
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontFamily: TYPOGRAPHY.fontFamily.system,
            }}>
              {carouselSprites[carouselIndex]?.name || `Sprite ${carouselIndex + 1}`}
            </div>
            <div style={{
              marginTop: SPACING.xs,
              color: 'rgba(255,255,255,0.6)',
              fontSize: TYPOGRAPHY.fontSize.sm,
            }}>
              {carouselIndex + 1} / {carouselSprites.length}
            </div>
            
            {/* Toggle selection */}
            <button
              style={{
                marginTop: SPACING.md,
                padding: `${SPACING.sm} ${SPACING.lg}`,
                backgroundColor: selectedExtractedSprites.includes(carouselSprites[carouselIndex]?.index)
                  ? COLORS.ui.active
                  : 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: BORDER_RADIUS.md,
                color: selectedExtractedSprites.includes(carouselSprites[carouselIndex]?.index) ? '#000' : '#fff',
                cursor: 'pointer',
                fontSize: TYPOGRAPHY.fontSize.sm,
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleExtractedSprite(carouselSprites[carouselIndex]?.index);
              }}
            >
              {selectedExtractedSprites.includes(carouselSprites[carouselIndex]?.index) 
                ? '✓ Selected' 
                : 'Select for Generation'}
            </button>
          </div>
          
          {/* Thumbnail strip */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              gap: SPACING.xs,
              marginTop: SPACING.lg,
              padding: SPACING.sm,
              maxWidth: '90vw',
              overflowX: 'auto',
            }}
          >
            {carouselSprites.map((sprite, idx) => (
              <img
                key={sprite.index}
                src={sprite.base64}
                alt={sprite.name}
                onClick={() => setCarouselIndex(idx)}
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                  backgroundColor: '#fff',
                  borderRadius: BORDER_RADIUS.sm,
                  border: idx === carouselIndex 
                    ? `2px solid ${COLORS.ui.active}` 
                    : '2px solid transparent',
                  cursor: 'pointer',
                  opacity: idx === carouselIndex ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Library Picker Modal */}
      {showLibraryPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            zIndex: 2000,
            padding: SPACING.xl,
            overflowY: 'auto',
          }}
          onClick={() => setShowLibraryPicker(false)}
        >
          {/* Close button */}
          <button
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '32px',
              cursor: 'pointer',
              padding: SPACING.sm,
              zIndex: 2001,
            }}
            onClick={() => setShowLibraryPicker(false)}
          >
            ×
          </button>
          
          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: COLORS.ui.surface,
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.xl,
              maxWidth: '900px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{
              margin: 0,
              marginBottom: SPACING.lg,
              color: COLORS.text.primary,
              fontFamily: TYPOGRAPHY.fontFamily.system,
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
            }}>
              Select from Library
            </h2>
            
            {/* Sprite Sheets Section */}
            {originals.filter(o => o.isSpriteSheet && !o.parentSheetId).length > 0 && (
              <div style={{ marginBottom: SPACING.xl }}>
                <h3 style={{
                  margin: 0,
                  marginBottom: SPACING.md,
                  color: COLORS.text.secondary,
                  fontFamily: TYPOGRAPHY.fontFamily.system,
                  fontSize: TYPOGRAPHY.fontSize.md,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                }}>
                  Sprite Sheets
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: SPACING.md,
                }}>
                  {originals
                    .filter(o => o.isSpriteSheet && !o.parentSheetId)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowLibraryPicker(false);
                        }}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: COLORS.ui.background,
                          borderRadius: BORDER_RADIUS.md,
                          padding: SPACING.sm,
                          border: `2px solid transparent`,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.ui.active;
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{
                          width: '100%',
                          aspectRatio: '1',
                          backgroundColor: '#fff',
                          borderRadius: BORDER_RADIUS.sm,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          marginBottom: SPACING.xs,
                        }}>
                          <img
                            src={item.base64}
                            alt={item.filename}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              imageRendering: 'pixelated',
                            }}
                          />
                        </div>
                        <div style={{
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          color: COLORS.text.primary,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.filename}
                        </div>
                        {item.spriteCount && (
                          <div style={{
                            fontSize: TYPOGRAPHY.fontSize.xs,
                            color: COLORS.text.muted,
                            textAlign: 'center',
                          }}>
                            {item.spriteCount} sprites
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Single Sprites Section */}
            {originals.filter(o => !o.isSpriteSheet && !o.parentSheetId).length > 0 && (
              <div style={{ marginBottom: SPACING.xl }}>
                <h3 style={{
                  margin: 0,
                  marginBottom: SPACING.md,
                  color: COLORS.text.secondary,
                  fontFamily: TYPOGRAPHY.fontFamily.system,
                  fontSize: TYPOGRAPHY.fontSize.md,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                }}>
                  Single Sprites
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: SPACING.md,
                }}>
                  {originals
                    .filter(o => !o.isSpriteSheet && !o.parentSheetId)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowLibraryPicker(false);
                        }}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: COLORS.ui.background,
                          borderRadius: BORDER_RADIUS.md,
                          padding: SPACING.sm,
                          border: `2px solid transparent`,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.ui.active;
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{
                          width: '100%',
                          aspectRatio: '1',
                          backgroundColor: '#fff',
                          borderRadius: BORDER_RADIUS.sm,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          marginBottom: SPACING.xs,
                        }}>
                          <img
                            src={item.base64}
                            alt={item.filename}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              imageRendering: 'pixelated',
                            }}
                          />
                        </div>
                        <div style={{
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          color: COLORS.text.primary,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.filename}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Extracted Sprites Section - grouped by parent */}
            {(() => {
              const extractedByParent = {};
              originals.filter(o => o.parentSheetId).forEach(sprite => {
                const parentId = sprite.parentSheetId;
                if (!extractedByParent[parentId]) {
                  extractedByParent[parentId] = {
                    parentName: sprite.parentSheetName || 'Unknown Sheet',
                    sprites: []
                  };
                }
                extractedByParent[parentId].sprites.push(sprite);
              });
              
              const parentIds = Object.keys(extractedByParent);
              if (parentIds.length === 0) return null;
              
              return (
                <div>
                  <h3 style={{
                    margin: 0,
                    marginBottom: SPACING.md,
                    color: COLORS.text.secondary,
                    fontFamily: TYPOGRAPHY.fontFamily.system,
                    fontSize: TYPOGRAPHY.fontSize.md,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                  }}>
                    Extracted Sprites
                  </h3>
                  {parentIds.map(parentId => (
                    <div key={parentId} style={{ marginBottom: SPACING.lg }}>
                      <div style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.muted,
                        marginBottom: SPACING.sm,
                      }}>
                        From: {extractedByParent[parentId].parentName}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: SPACING.sm,
                      }}>
                        {extractedByParent[parentId].sprites.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              setShowLibraryPicker(false);
                            }}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: COLORS.ui.background,
                              borderRadius: BORDER_RADIUS.sm,
                              padding: SPACING.xs,
                              border: `2px solid transparent`,
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = COLORS.ui.active;
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <div style={{
                              width: '100%',
                              aspectRatio: '1',
                              backgroundColor: '#fff',
                              borderRadius: BORDER_RADIUS.sm,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}>
                              <img
                                src={item.base64}
                                alt={item.filename}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain',
                                  imageRendering: 'pixelated',
                                }}
                              />
                            </div>
                            <div style={{
                              fontSize: TYPOGRAPHY.fontSize.xs,
                              color: COLORS.text.primary,
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                            }}>
                              {item.filename}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            
            {/* Empty state */}
            {originals.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: SPACING.xl,
                color: COLORS.text.muted,
              }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.lg, marginBottom: SPACING.sm }}>
                  No sprites in library
                </div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>
                  Upload sprites in the Library tab first
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'success' ? '#22c55e' : 
                            toast.type === 'error' ? '#ef4444' : 
                            '#3b82f6',
            color: '#fff',
            padding: `${SPACING.md} ${SPACING.xl}`,
            borderRadius: BORDER_RADIUS.lg,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            fontFamily: TYPOGRAPHY.fontFamily.system,
            fontSize: TYPOGRAPHY.fontSize.md,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            animation: 'slideUp 0.3s ease',
          }}
        >
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={toast.action}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: BORDER_RADIUS.md,
                color: '#fff',
                padding: `${SPACING.sm} ${SPACING.md}`,
                cursor: 'pointer',
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                fontSize: TYPOGRAPHY.fontSize.sm,
                whiteSpace: 'nowrap',
              }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              padding: SPACING.xs,
              fontSize: '20px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
