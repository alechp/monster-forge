/**
 * Monster Forge - Main Application
 * 
 * Sprite ETL Pipeline for Monster-Battling RPG
 * 
 * Main Navigation:
 * - Library: View Originals and Transformations
 * - Forge: Transform sprites into new variations
 */

import React, { useState, useCallback } from 'react';
import { SpriteExtractor } from './services/spriteExtractor';
import ClaudeVisionService from './services/claudeVision';
import { DataGenerator } from './services/dataGenerator';
import { NanoBananaService, ART_STYLES, POSE_OPTIONS, COLOR_PALETTES } from './services/nanoBanana';
import { colorToElement } from './data/elements';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from './styles/theme';

// Components
import UploadZone from './components/UploadZone';
import MonsterDetail from './components/MonsterDetail';
import SettingsModal from './components/SettingsModal';
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
  UploadIcon
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

  // Services
  const extractor = new SpriteExtractor();
  const vision = new ClaudeVisionService();
  const generator = new DataGenerator();
  const nanoBanana = new NanoBananaService();

  // Process uploaded sprite sheet
  const processUpload = useCallback(async (file) => {
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
      width: '300px',
      borderRight: `1px solid ${COLORS.ui.border}`,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.background.secondary
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
            // Originals: simple grid
            <div style={styles.itemGrid}>
              {currentLibraryItems.map(item => (
                <div
                  key={item.id}
                  style={styles.itemCard(selectedItem?.id === item.id)}
                  onClick={() => setSelectedItem(item)}
                >
                  <button
                    style={styles.itemDeleteButton}
                    onClick={(e) => deleteOriginal(item.id, e)}
                    title="Delete"
                  >
                    <DeleteIcon size={12} color="#fff" />
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
                            >
                              <button
                                style={styles.itemDeleteButton}
                                onClick={(e) => deleteTransformation(item.id, e)}
                                title="Delete"
                              >
                                <DeleteIcon size={10} color="#fff" />
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
                            >
                              <button
                                style={styles.itemDeleteButton}
                                onClick={(e) => deleteTransformation(item.id, e)}
                                title="Delete"
                              >
                                <DeleteIcon size={12} color="#fff" />
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
          <UploadZone onUpload={processUpload} processing={processing} />
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
                maxWidth: '300px',
                maxHeight: '300px',
                imageRendering: 'pixelated',
                border: `2px solid ${COLORS.ui.border}`,
                borderRadius: BORDER_RADIUS.md,
              }}
            />
            <div style={{ marginTop: SPACING.md, color: COLORS.text.secondary }}>
              Select this sprite and go to <strong>Forge</strong> to transform it into a monster
            </div>
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
    
    // Process the dropped file
    await processUpload(file);
    
    // Switch to Forge tab and select the new sprite
    setActiveMainTab('forge');
  };

  // Save generated sprites to library
  const saveGeneratedSprites = () => {
    if (Object.keys(generatedSprites).length === 0) return;
    
    const sessionId = `session_${Date.now()}`;
    const sessionName = `${selectedItem?.name || selectedItem?.filename || 'Sprite'} - ${ART_STYLES[selectedStyle].name}`;
    
    const newTransformations = Object.entries(generatedSprites)
      .filter(([_, sprite]) => sprite !== null)
      .map(([poseId, sprite]) => ({
        id: `gen_${Date.now()}_${poseId}`,
        name: `${selectedItem?.name || 'Sprite'} (${ART_STYLES[selectedStyle].name} - ${poseId})`,
        baseSprite: sprite,
        base64: sprite,
        originalId: selectedItem?.id,
        style: selectedStyle,
        pose: poseId,
        createdAt: new Date().toISOString(),
        primaryElement: selectedItem?.primaryElement || 'Unknown',
        sessionId,
        sessionName,
        genOptions: { creativity, colorPalette, customColors, customPrompt }
      }));
    
    if (newTransformations.length > 0) {
      setTransformations(prev => [...prev, ...newTransformations]);
      setProcessingStage(`Saved ${newTransformations.length} sprite(s) to library!`);
    }
  };

  // Generate sprites with selected style and poses
  const generateSprites = async () => {
    if (!selectedItem || selectedPoses.length === 0) return;
    
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
      
      const results = await nanoBanana.generatePoseSet(
        sourceImage,
        selectedStyle,
        selectedPoses,
        genOptions,
        (progress) => {
          if (progress.error) {
            setProcessingStage(`Error: ${progress.error}`);
          } else if (progress.done) {
            const successCount = progress.current;
            const failCount = progress.failed || 0;
            if (failCount > 0) {
              setProcessingStage(`Generated ${successCount} sprite(s), ${failCount} failed (rate limit)`);
            } else {
              setProcessingStage(`Successfully generated ${successCount} sprite(s)!`);
            }
          } else if (progress.message) {
            setProcessingStage(`${progress.message} (${progress.current}/${progress.total})`);
          } else {
            setProcessingStage(`Generating ${progress.currentPose}... (${progress.current + 1}/${progress.total})`);
          }
        }
      );
      
      setGeneratedSprites(results);
      
      // Note: Sprites are NOT auto-saved anymore
      // User clicks "Save to Library" button to save them
      
    } catch (error) {
      console.error('[App] Sprite generation failed:', error);
      setProcessingStage(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Render Forge view
  const renderForge = () => {
    const selectedOriginal = selectedItem && originals.find(o => o.id === selectedItem.id);
    const selectedTransformation = selectedItem && transformations.find(t => t.id === selectedItem.id);
    const canTransform = selectedOriginal || selectedTransformation;
    
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
                  {selectedOriginal ? 'Original Sprite' : 'Transformation'}
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
                Or select a sprite from the Library
              </div>
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

        {/* Pose Selection */}
        <div style={styles.forgeSection}>
          <h3 style={styles.forgeSectionTitle}>Poses to Generate</h3>
          <div style={forgeStyles.poseGrid}>
            {Object.values(POSE_OPTIONS).map(pose => (
              <button
                key={pose.id}
                style={forgeStyles.poseChip(selectedPoses.includes(pose.id))}
                onClick={() => togglePose(pose.id)}
              >
                {pose.name}
              </button>
            ))}
          </div>
          <div style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs }}>
            Selected: {selectedPoses.length} pose(s) - Each pose will generate a separate image
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

        {/* Generate Button */}
        <div style={styles.forgeSection}>
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
            {processing ? '⏳ ' + processingStage : `Generate ${selectedPoses.length} Sprite(s)`}
          </button>
          
          {!processing && (
            <div style={{ color: COLORS.text.muted, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.sm, textAlign: 'center' }}>
              Requires Google API key in Settings. Each sprite takes ~5-10 seconds.
            </div>
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
              {Object.entries(generatedSprites).map(([poseId, sprite]) => (
                <div key={poseId} style={{ ...forgeStyles.resultCard, position: 'relative' }}>
                  {sprite ? (
                    <>
                      <img
                        src={sprite}
                        alt={`${poseId} pose`}
                        style={forgeStyles.resultImage}
                      />
                      <div style={forgeStyles.resultLabel}>{POSE_OPTIONS[poseId]?.name || poseId}</div>
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
                        onClick={() => regenerateSingle(poseId)}
                        disabled={processing}
                      >
                        <RefreshIcon size={12} /> Redo
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: SPACING.lg, color: COLORS.text.muted }}>
                      <div>Failed</div>
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
                        onClick={() => regenerateSingle(poseId)}
                        disabled={processing}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
    </div>
  );
}
