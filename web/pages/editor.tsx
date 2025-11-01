import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import {
  parseSPA,
  playSPA,
  type SPASound,
  type ToneElement,
  type NoiseElement,
  type GroupElement,
  type SequenceElement,
  type AutomationCurve,
} from '@spa-audio/core';
import {
  loadPreset as loadPresetFile,
  getPresetPath,
  initializePresets,
} from '../utils/presetLoader';
import { useSound } from '../contexts/SoundContext';
import UnifiedSidebar from '../components/UnifiedSidebar';
import CodeEditor from '../components/CodeEditor';

// Editor-specific types for UI state with support for nested structures
type EditorNode = EditorLayer | EditorGroup | EditorSequence;

interface EditorLayer {
  id: number;
  type: 'layer';
  sound: ToneElement | NoiseElement;
}

interface EditorGroup {
  id: number;
  type: 'group';
  children: EditorNode[];
}

interface EditorSequence {
  id: number;
  type: 'sequence';
  children: EditorNode[];
}

export default function Editor() {
  // Initialize with a default tone layer
  const getInitialNodes = (): EditorNode[] => {
    const initialNode: EditorLayer = {
      id: 0,
      type: 'layer',
      sound: {
        type: 'tone',
        wave: 'sine',
        freq: 440,
        dur: 0.5,
        amp: 1,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2,
        },
        repeat: 1,
        repeatInterval: 0,
        repeatDelay: 0,
        repeatDecay: 0,
        repeatPitchShift: 0,
      } as ToneElement,
    };
    return [initialNode];
  };

  const [rootNodes, setRootNodes] = useState<EditorNode[]>(getInitialNodes);
  const [currentNodeId, setCurrentNodeId] = useState<number | null>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { playSound: playSoundEffect } = useSound();
  const [xmlOutput, setXmlOutput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [importText, setImportText] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'code'>('editor');
  const [hasCodeError, setHasCodeError] = useState(false);
  const [presetCategories, setPresetCategories] = useState<Record<string, Record<string, string>>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodeIdCounterRef = useRef(1); // Start at 1 since we have node 0
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPlaybackRef = useRef<Promise<void> | null>(null);

  // Initialize preset categories on mount
  useEffect(() => {
    initializePresets().then(categories => {
      setPresetCategories(categories);
    });
  }, []);

  const getDefaultSound = (type: 'tone' | 'noise' = 'tone'): ToneElement | NoiseElement => {
    if (type === 'tone') {
      return {
        type: 'tone',
        wave: 'sine',
        freq: 440,
        dur: 0.5,
        amp: 1,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2,
        },
        repeat: 1,
        repeatInterval: 0,
        repeatDelay: 0,
        repeatDecay: 0,
        repeatPitchShift: 0,
      } as ToneElement;
    } else {
      return {
        type: 'noise',
        color: 'white',
        dur: 0.5,
        amp: 1,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2,
        },
        repeat: 1,
        repeatInterval: 0,
        repeatDelay: 0,
        repeatDecay: 0,
      } as NoiseElement;
    }
  };

  const findNodeById = (nodes: EditorNode[], id: number): EditorNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.type === 'group' || node.type === 'sequence') {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const _findParentNode = (
    nodes: EditorNode[],
    childId: number
  ): EditorGroup | EditorSequence | null => {
    for (const node of nodes) {
      if (node.type === 'group' || node.type === 'sequence') {
        if (node.children.some((child) => child.id === childId)) {
          return node;
        }
        const found = _findParentNode(node.children, childId);
        if (found) return found;
      }
    }
    return null;
  };

  const addNode = (parentId: number | null, nodeType: 'tone' | 'noise' | 'group' | 'sequence') => {
    if (isPlaying) {
      stopSound();
    }

    const newNodeId = nodeIdCounterRef.current++;
    let newNode: EditorNode;

    if (nodeType === 'group') {
      newNode = {
        id: newNodeId,
        type: 'group',
        children: [],
      };
      setExpandedNodes((prev) => new Set(Array.from(prev).concat(newNodeId)));
    } else if (nodeType === 'sequence') {
      newNode = {
        id: newNodeId,
        type: 'sequence',
        children: [],
      };
      setExpandedNodes((prev) => new Set(Array.from(prev).concat(newNodeId)));
    } else {
      newNode = {
        id: newNodeId,
        type: 'layer',
        sound: getDefaultSound(nodeType),
      };
    }

    if (parentId === null) {
      setRootNodes((prevNodes) => [...prevNodes, newNode]);
    } else {
      setRootNodes((prevNodes) => {
        const updateNodes = (nodes: EditorNode[]): EditorNode[] => {
          return nodes.map((node) => {
            if (node.id === parentId && (node.type === 'group' || node.type === 'sequence')) {
              return {
                ...node,
                children: [...node.children, newNode],
              };
            }
            if (node.type === 'group' || node.type === 'sequence') {
              return {
                ...node,
                children: updateNodes(node.children),
              };
            }
            return node;
          });
        };
        return updateNodes(prevNodes);
      });
    }

    setCurrentNodeId(newNodeId);
    setShowAddMenu(null);
  };

  const removeNode = (id: number) => {
    if (isPlaying) {
      stopSound();
    }

    const removeFromNodes = (nodes: EditorNode[]): EditorNode[] => {
      return nodes.filter((node) => {
        if (node.id === id) return false;
        if (node.type === 'group' || node.type === 'sequence') {
          node.children = removeFromNodes(node.children);
        }
        return true;
      });
    };

    setRootNodes(removeFromNodes(rootNodes));

    if (currentNodeId === id) {
      setCurrentNodeId(null);
    }
  };

  const updateLayerSound = (id: number, soundUpdates: Partial<ToneElement | NoiseElement>) => {
    const updateNodes = (nodes: EditorNode[]): EditorNode[] => {
      return nodes.map((node) => {
        if (node.id === id && node.type === 'layer') {
          return {
            ...node,
            sound: { ...node.sound, ...soundUpdates } as ToneElement | NoiseElement,
          };
        }
        if (node.type === 'group' || node.type === 'sequence') {
          return {
            ...node,
            children: updateNodes(node.children),
          };
        }
        return node;
      });
    };

    setRootNodes(updateNodes(rootNodes));
  };

  const toggleNodeExpansion = (id: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const nodeToXML = (node: EditorNode, indent: string = ''): string => {
    if (node.type === 'layer') {
      return soundToXML(node.sound);
    } else if (node.type === 'group') {
      if (node.children.length === 0) {
        return `${indent}<group/>`;
      }
      let xml = `${indent}<group>\n`;
      for (const child of node.children) {
        xml += `${indent}  ${nodeToXML(child, indent + '  ')}\n`;
      }
      xml += `${indent}</group>`;
      return xml;
    } else if (node.type === 'sequence') {
      if (node.children.length === 0) {
        return `${indent}<sequence/>`;
      }
      let xml = `${indent}<sequence>\n`;
      for (const child of node.children) {
        xml += `${indent}  ${nodeToXML(child, indent + '  ')}\n`;
      }
      xml += `${indent}</sequence>`;
      return xml;
    }
    return '';
  };

  const updateXMLOutput = useCallback(() => {
    if (rootNodes.length === 0) {
      setXmlOutput(`<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.1">
  <!-- Add layers to create your sound -->
</spa>`);
      return;
    }

    let xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<spa xmlns="https://spa.audio/ns" version="1.1">\n';

    for (const node of rootNodes) {
      xml += '  ' + nodeToXML(node, '  ') + '\n';
    }

    xml += '</spa>';
    setXmlOutput(xml);
  }, [rootNodes]);

  // Update XML whenever nodes change
  useEffect(() => {
    updateXMLOutput();
  }, [updateXMLOutput]);

  const soundToXML = (sound: ToneElement | NoiseElement): string => {
    let xml = '<';

    if (sound.type === 'tone') {
      const tone = sound as ToneElement;
      xml += `tone wave="${tone.wave}"`;

      if (typeof tone.freq === 'object' && 'start' in tone.freq) {
        const freq = tone.freq as AutomationCurve;
        xml += ` freq.start="${freq.start}" freq.end="${freq.end}" freq.curve="${freq.curve}"`;
      } else {
        xml += ` freq="${tone.freq}"`;
      }

      xml += ` dur="${tone.dur}"`;

      if ((tone as any).at !== undefined && (tone as any).at !== 0) {
        xml += ` at="${(tone as any).at}"`;
      }

      if (typeof tone.amp === 'object' && 'start' in tone.amp) {
        const amp = tone.amp as AutomationCurve;
        xml += ` amp.start="${amp.start}" amp.end="${amp.end}" amp.curve="${amp.curve}"`;
      } else if (tone.amp !== undefined && tone.amp !== 1) {
        xml += ` amp="${tone.amp}"`;
      }

      if (tone.pan !== undefined && tone.pan !== 0) {
        xml += ` pan="${tone.pan}"`;
      }

      if (tone.filter && typeof tone.filter === 'object') {
        xml += ` filter="${tone.filter.type}"`;

        // Handle cutoff automation
        if (typeof tone.filter.cutoff === 'object' && 'start' in tone.filter.cutoff) {
          const cutoff = tone.filter.cutoff as AutomationCurve;
          xml += ` cutoff.start="${cutoff.start}" cutoff.end="${cutoff.end}" cutoff.curve="${cutoff.curve}"`;
        } else {
          xml += ` cutoff="${tone.filter.cutoff}"`;
        }

        if (tone.filter.resonance !== undefined && tone.filter.resonance !== 1) {
          xml += ` resonance="${tone.filter.resonance}"`;
        }
      }

      if (tone.envelope && typeof tone.envelope === 'object') {
        const env = tone.envelope;
        xml += ` envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`;
      }

      if (
        tone.repeat !== undefined &&
        tone.repeat !== 1 &&
        tone.repeatInterval !== undefined &&
        tone.repeatInterval !== 0
      ) {
        xml += ` repeat="${tone.repeat}" repeat.interval="${tone.repeatInterval}"`;
        if (tone.repeatDelay && tone.repeatDelay !== 0)
          xml += ` repeat.delay="${tone.repeatDelay}"`;
        if (tone.repeatDecay && tone.repeatDecay !== 0)
          xml += ` repeat.decay="${tone.repeatDecay}"`;
        if (tone.repeatPitchShift && tone.repeatPitchShift !== 0)
          xml += ` repeat.pitchShift="${tone.repeatPitchShift}"`;
      }

      xml += '/>';
    } else if (sound.type === 'noise') {
      const noise = sound as NoiseElement;
      xml += `noise color="${noise.color}" dur="${noise.dur}"`;

      if ((noise as any).at !== undefined && (noise as any).at !== 0) {
        xml += ` at="${(noise as any).at}"`;
      }

      // Handle amp automation for noise
      if (typeof noise.amp === 'object' && 'start' in noise.amp) {
        const amp = noise.amp as AutomationCurve;
        xml += ` amp.start="${amp.start}" amp.end="${amp.end}" amp.curve="${amp.curve}"`;
      } else if (noise.amp !== undefined && noise.amp !== 1) {
        xml += ` amp="${noise.amp}"`;
      }

      if (noise.pan !== undefined && noise.pan !== 0) {
        xml += ` pan="${noise.pan}"`;
      }

      if (noise.filter && typeof noise.filter === 'object') {
        xml += ` filter="${noise.filter.type}"`;

        // Handle cutoff automation
        if (typeof noise.filter.cutoff === 'object' && 'start' in noise.filter.cutoff) {
          const cutoff = noise.filter.cutoff as AutomationCurve;
          xml += ` cutoff.start="${cutoff.start}" cutoff.end="${cutoff.end}" cutoff.curve="${cutoff.curve}"`;
        } else {
          xml += ` cutoff="${noise.filter.cutoff}"`;
        }

        if (noise.filter.resonance !== undefined && noise.filter.resonance !== 1) {
          xml += ` resonance="${noise.filter.resonance}"`;
        }
      }

      if (noise.envelope && typeof noise.envelope === 'object') {
        const env = noise.envelope;
        xml += ` envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`;
      }

      if (
        noise.repeat !== undefined &&
        noise.repeat !== 1 &&
        noise.repeatInterval !== undefined &&
        noise.repeatInterval !== 0
      ) {
        xml += ` repeat="${noise.repeat}" repeat.interval="${noise.repeatInterval}"`;
        if (noise.repeatDelay && noise.repeatDelay !== 0)
          xml += ` repeat.delay="${noise.repeatDelay}"`;
        if (noise.repeatDecay && noise.repeatDecay !== 0)
          xml += ` repeat.decay="${noise.repeatDecay}"`;
      }

      xml += '/>';
    }

    return xml;
  };

  const playSound = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (isPlaying) {
      stopSound();
      return;
    }

    setIsPlaying(true);

    try {
      currentPlaybackRef.current = playSPA(xmlOutput);
      await currentPlaybackRef.current;
    } catch (error) {
      console.error('Error playing sound:', error);
      console.error('XML that caused error:', xmlOutput);
    } finally {
      setIsPlaying(false);
      currentPlaybackRef.current = null;
    }
  }, [xmlOutput, isPlaying]);

  const stopSound = () => {
    setIsPlaying(false);
    currentPlaybackRef.current = null;
  };

  const importFromText = () => {
    try {
      const doc = parseSPA(importText);
      const newNodes: EditorNode[] = [];
      let nodeId = 0;

      const processSoundToNode = (sound: SPASound): EditorNode => {
        if (sound.type === 'group') {
          const group = sound as GroupElement;
          const groupNode: EditorGroup = {
            id: nodeId++,
            type: 'group',
            children: [],
          };
          if (group.sounds) {
            groupNode.children = group.sounds.map((s) => processSoundToNode(s));
          }
          setExpandedNodes((prev) => new Set(Array.from(prev).concat(groupNode.id)));
          return groupNode;
        } else if (sound.type === 'sequence') {
          const sequence = sound as SequenceElement;
          const sequenceNode: EditorSequence = {
            id: nodeId++,
            type: 'sequence',
            children: [],
          };
          if (sequence.elements) {
            sequenceNode.children = sequence.elements.map((timedSound: any) => {
              const soundWithTiming = { ...timedSound.sound, at: timedSound.at };
              return processSoundToNode(soundWithTiming);
            });
          }
          setExpandedNodes((prev) => new Set(Array.from(prev).concat(sequenceNode.id)));
          return sequenceNode;
        } else {
          return {
            id: nodeId++,
            type: 'layer',
            sound: normalizeSound(sound),
          };
        }
      };

      for (const sound of doc.sounds) {
        newNodes.push(processSoundToNode(sound));
      }

      if (newNodes.length > 0) {
        if (isPlaying) {
          stopSound();
        }
        setRootNodes(newNodes);
        nodeIdCounterRef.current = nodeId;
        // Find and select the first tone/noise layer instead of a group
        const firstLayer = getAllLayers(newNodes)[0];
        setCurrentNodeId(firstLayer ? firstLayer.id : newNodes[0].id);
        setShowImportModal(false);
        setImportText('');
      }
    } catch (error) {
      alert(`Failed to import SPA file: ${error}`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      importFromText();
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const normalizeSound = (sound: SPASound): ToneElement | NoiseElement => {
    // Just pass through all properties, ensuring repeat defaults
    if (sound.type === 'tone' || sound.type === 'noise') {
      return {
        ...sound,
        repeat: sound.repeat ?? 1,
        repeatInterval: sound.repeatInterval ?? 0,
        repeatDelay: sound.repeatDelay ?? 0,
        repeatDecay: sound.repeatDecay ?? 0,
        repeatPitchShift: (sound.type === 'tone' ? sound.repeatPitchShift : undefined) ?? 0,
      } as ToneElement | NoiseElement;
    }
    // For group or sequence, just return a default tone element
    // This shouldn't happen as we only call this for actual sound elements
    return {
      type: 'tone',
      wave: 'sine',
      freq: 440,
      dur: 0.5,
      amp: 1,
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
      },
      repeat: 1,
      repeatInterval: 0,
      repeatDelay: 0,
      repeatDecay: 0,
      repeatPitchShift: 0,
    } as ToneElement;
  };

  const loadPreset = async (category: string, preset: string) => {
    if (isPlaying) {
      stopSound();
    }

    const presetPath = getPresetPath(category, preset);

    if (presetPath) {
      try {
        const spaContent = await loadPresetFile(presetPath);
        // Parse and load the preset directly instead of going through importText state
        const doc = parseSPA(spaContent);
        const newNodes: EditorNode[] = [];
        let nodeId = 0;

        const processSoundToNode = (sound: SPASound): EditorNode => {
          if (sound.type === 'group') {
            const group = sound as GroupElement;
            const groupNode: EditorGroup = {
              id: nodeId++,
              type: 'group',
              children: [],
            };
            if (group.sounds) {
              groupNode.children = group.sounds.map((s) => processSoundToNode(s));
            }
            setExpandedNodes((prev) => new Set(Array.from(prev).concat(groupNode.id)));
            return groupNode;
          } else if (sound.type === 'sequence') {
            const sequence = sound as SequenceElement;
            const sequenceNode: EditorSequence = {
              id: nodeId++,
              type: 'sequence',
              children: [],
            };
            if (sequence.elements) {
              sequenceNode.children = sequence.elements.map(
                (timedSound: { sound: SPASound; at: number }) => {
                  const soundWithTiming = { ...timedSound.sound, at: timedSound.at };
                  return processSoundToNode(soundWithTiming);
                }
              );
            }
            setExpandedNodes((prev) => new Set(Array.from(prev).concat(sequenceNode.id)));
            return sequenceNode;
          } else {
            return {
              id: nodeId++,
              type: 'layer',
              sound: normalizeSound(sound),
            };
          }
        };

        for (const sound of doc.sounds) {
          newNodes.push(processSoundToNode(sound));
        }

        if (newNodes.length > 0) {
          setRootNodes(newNodes);
          nodeIdCounterRef.current = nodeId;
          // Find and select the first tone/noise layer instead of a group
          const firstLayer = getAllLayers(newNodes)[0];
          setCurrentNodeId(firstLayer ? firstLayer.id : newNodes[0].id);
        }
      } catch (error) {
        console.error(`Failed to load preset ${preset}:`, error);
        alert(`Failed to load preset: ${error}`);
      }
    } else {
      alert(`Preset not found: ${preset}`);
    }
  };

  const handleCodeChange = (newCode: string) => {
    // This will be called when valid code is entered in the CodeEditor
    try {
      const doc = parseSPA(newCode);
      const newNodes: EditorNode[] = [];
      let nodeId = 0;

      const processSoundToNode = (sound: SPASound): EditorNode => {
        if (sound.type === 'group') {
          const group = sound as GroupElement;
          const groupNode: EditorGroup = {
            id: nodeId++,
            type: 'group',
            children: [],
          };
          if (group.sounds) {
            groupNode.children = group.sounds.map((s) => processSoundToNode(s));
          }
          setExpandedNodes((prev) => new Set(Array.from(prev).concat(groupNode.id)));
          return groupNode;
        } else if (sound.type === 'sequence') {
          const sequence = sound as SequenceElement;
          const sequenceNode: EditorSequence = {
            id: nodeId++,
            type: 'sequence',
            children: [],
          };
          if (sequence.elements) {
            sequenceNode.children = sequence.elements.map(
              (timedSound: { sound: SPASound; at: number }) => {
                const soundWithTiming = { ...timedSound.sound, at: timedSound.at };
                return processSoundToNode(soundWithTiming);
              }
            );
          }
          setExpandedNodes((prev) => new Set(Array.from(prev).concat(sequenceNode.id)));
          return sequenceNode;
        } else {
          return {
            id: nodeId++,
            type: 'layer',
            sound: normalizeSound(sound),
          };
        }
      };

      for (const sound of doc.sounds) {
        newNodes.push(processSoundToNode(sound));
      }

      if (newNodes.length > 0) {
        if (isPlaying) {
          stopSound();
        }
        setRootNodes(newNodes);
        nodeIdCounterRef.current = nodeId;
        // Find and select the first tone/noise layer
        const firstLayer = newNodes.find((n) => n.type === 'layer');
        setCurrentNodeId(firstLayer ? firstLayer.id : newNodes[0].id);
      } else {
        // If empty, set default node
        setRootNodes(getInitialNodes());
        setCurrentNodeId(0);
      }

      setHasCodeError(false);
    } catch (error) {
      console.error('Failed to parse code:', error);
      // Don't update nodes if parse fails - CodeEditor handles the error display
    }
  };

  const handleCodeValidChange = (valid: boolean) => {
    setHasCodeError(!valid);
  };

  const getAllLayers = (nodes: EditorNode[]): EditorLayer[] => {
    const layers: EditorLayer[] = [];
    for (const node of nodes) {
      if (node.type === 'layer') {
        layers.push(node);
      } else if (node.type === 'group' || node.type === 'sequence') {
        layers.push(...getAllLayers(node.children));
      }
    }
    return layers;
  };

  const currentNode = currentNodeId !== null ? findNodeById(rootNodes, currentNodeId) : null;
  const currentLayer = currentNode?.type === 'layer' ? currentNode : null;
  const allLayers = getAllLayers(rootNodes);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside of any dropdown
      if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setShowAddMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement &&
          (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')
        ) {
          return;
        }
        e.preventDefault();
        if (rootNodes.length > 0) {
          playSound();
        }
      }

      // Prevent Escape from closing modals if code has errors
      if (e.key === 'Escape' && hasCodeError && activeEditorTab === 'code') {
        e.preventDefault();
        e.stopPropagation();
        alert('Please fix the errors in the Code view before leaving.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, rootNodes, xmlOutput, hasCodeError, activeEditorTab, playSound]);

  // Tree-based layer display component
  const LayerTree = ({
    nodes,
    parentId = null,
    depth = 0,
  }: {
    nodes: EditorNode[];
    parentId?: number | null;
    depth?: number;
  }) => {
    const isRoot = parentId === null;

    return (
      <ul className={`${!isRoot ? 'ml-[calc(5px-1.5rem)] pl-0' : ''}`}>
        {nodes.map((node, index) => {
          const isExpanded = expandedNodes.has(node.id);
          const isSelected = currentNodeId === node.id;
          const isLast = index === nodes.length - 1;
          const hasChildren =
            (node.type === 'group' || node.type === 'sequence') && node.children.length > 0;

          let nodeLabel = '';
          let nodeIcon = '';
          if (node.type === 'layer') {
            const sound = node.sound;
            if (sound.type === 'tone') {
              const toneSound = sound as ToneElement;
              const freqValue = typeof toneSound.freq === 'number' ? toneSound.freq : 440;
              nodeLabel = `${toneSound.wave} ${Math.round(freqValue)}Hz`;
              nodeIcon = '♪';
            } else {
              nodeLabel = `${(sound as NoiseElement).color} noise`;
              nodeIcon = '≈';
            }
          } else if (node.type === 'group') {
            nodeLabel = 'Group';
            nodeIcon = '⊕';
          } else {
            nodeLabel = 'Sequence';
            nodeIcon = '→';
          }

          return (
            <li
              key={node.id}
              className={`block relative ${!isRoot ? `border-l-2 ${isLast ? 'border-transparent' : 'border-gray-600'}` : ''}`}
              style={{ paddingLeft: !isRoot ? 'calc(2 * 1.5rem - 5px - 2px)' : '0' }}
            >
              {!isRoot && (
                <>
                  {/* Horizontal line */}
                  <span
                    className="absolute block border-b-2 border-l-2 border-gray-600"
                    style={{
                      top: 'calc(1.5rem / -2)',
                      left: '-2px',
                      width: 'calc(1.5rem + 2px)',
                      height: 'calc(1.5rem + 1px)',
                    }}
                  />
                  {/* Node dot */}
                  <span
                    className="absolute block w-[10px] h-[10px] rounded-full bg-gray-600"
                    style={{
                      top: 'calc(1.5rem / 2 - 5px)',
                      left: 'calc(1.5rem - 5px - 1px)',
                    }}
                  />
                </>
              )}

              <div className="flex items-center gap-2 mb-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleNodeExpansion(node.id)}
                    className="relative cursor-pointer outline-none focus:outline-dotted focus:outline-1 focus:outline-black"
                    style={{ marginLeft: !isRoot ? '0' : '0' }}
                  >
                    <span
                      className="absolute block w-[10px] h-[10px] rounded-full bg-white border-2 border-gray-600 z-10"
                      style={{
                        top: 'calc(1.5rem / 2 - 5px)',
                        left: !isRoot ? 'calc(1.5rem - 5px - 1px)' : '-12px',
                      }}
                    />
                    <span className="text-gray-400 text-xs ml-3">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                ) : null}

                <button
                  onClick={() => setCurrentNodeId(node.id)}
                  className={`px-2 py-1 rounded text-sm flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-navy-light text-white shadow-lg'
                      : 'bg-navy-dark hover:bg-navy-light/20 text-gray-300'
                  } ${!hasChildren && !isRoot ? 'ml-6' : ''}`}
                >
                  <span className="text-base">{nodeIcon}</span>
                  <span>{nodeLabel}</span>
                </button>

                {(node.type === 'group' || node.type === 'sequence') && (
                  <div className="relative">
                    <button
                      onClick={() => setShowAddMenu(showAddMenu === node.id ? null : node.id)}
                      className="dropdown-trigger text-xs px-2 py-1 bg-navy-light/20 hover:bg-navy-light/40 rounded transition-colors"
                    >
                      +
                    </button>
                    {showAddMenu === node.id && (
                      <div className="dropdown-menu absolute left-0 top-8 bg-navy border border-navy-light/20 rounded shadow-lg z-20">
                        <button
                          onClick={() => addNode(node.id, 'tone')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                        >
                          Tone
                        </button>
                        <button
                          onClick={() => addNode(node.id, 'noise')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                        >
                          Noise
                        </button>
                        <button
                          onClick={() => addNode(node.id, 'group')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                        >
                          Group
                        </button>
                        <button
                          onClick={() => addNode(node.id, 'sequence')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                        >
                          Sequence
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => removeNode(node.id)}
                  className="text-red-500 hover:text-red-400 text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {hasChildren && isExpanded && (
                <LayerTree nodes={node.children} parentId={node.id} depth={depth + 1} />
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-navy-dark text-white">
      <Head>
        <title>SPA Sound Editor</title>
      </Head>

      {/* Main Content */}
      <div className="flex h-screen">
        <UnifiedSidebar
          presetCategories={presetCategories}
          onLoadPreset={loadPreset}
          playSoundEffect={playSoundEffect}
        />

        {/* Main Content: Synth-style Layout */}
        <div className="flex-1 flex overflow-hidden w-full">
          {/* Left: Synth Controls */}
          <div className="flex-1 flex flex-col overflow-hidden bg-navy">
            {/* Top Bar: Waveform */}
            <div className="flex gap-4">
              <div className="flex flex-col w-full h-48 bg-grey">
                <div className="h-36 overflow-hidden relative">
                  {allLayers.length > 0 ? (
                    <svg
                      width="100%"
                      height="96"
                      viewBox="0 0 1000 96"
                      preserveAspectRatio="none"
                      className="w-full h-full"
                    >
                      {(() => {
                        const maxTime = Math.max(
                          1,
                          ...allLayers.map((l) => {
                            const s = l.sound;
                            const at = (s as any).at || 0;
                            const dur = s.type === 'tone' || s.type === 'noise' ? s.dur : 1;
                            return at + dur;
                          })
                        );

                        return allLayers.map((layer) => {
                          const isActive = layer.id === currentNodeId;
                          const sound = layer.sound;
                          const startTime = (sound as any).at || 0;
                          const duration =
                            sound.type === 'tone' || sound.type === 'noise' ? sound.dur : 1;

                          const startX = (startTime / maxTime) * 1000;
                          const endX = ((startTime + duration) / maxTime) * 1000;
                          const width = endX - startX;
                          const samples = Math.max(50, Math.floor(width / 5));

                          const points: string[] = [];
                          const centerY = 48;

                          for (let i = 0; i <= samples; i++) {
                            const x = startX + (i / samples) * width;
                            const progress = i / samples;
                            let y = centerY;

                            let amplitude = 22;
                            if (sound.type === 'tone' || sound.type === 'noise') {
                              const envelope = sound.envelope;
                              const env =
                                typeof envelope === 'object'
                                  ? envelope
                                  : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 };
                              const amp = typeof sound.amp === 'number' ? sound.amp : 1;

                              const attackEnd = env.attack / duration;
                              const decayEnd = (env.attack + env.decay) / duration;
                              const releaseStart = 1 - env.release / duration;

                              let envValue = 1;
                              if (progress < attackEnd) {
                                envValue = progress / attackEnd;
                              } else if (progress < decayEnd) {
                                const decayProg = (progress - attackEnd) / (decayEnd - attackEnd);
                                envValue = 1 - (1 - env.sustain) * decayProg;
                              } else if (progress < releaseStart) {
                                envValue = env.sustain;
                              } else {
                                const releaseProg = (progress - releaseStart) / (1 - releaseStart);
                                envValue = env.sustain * (1 - releaseProg);
                              }

                              amplitude *= envValue * amp;
                            }

                            if (sound.type === 'tone') {
                              const tone = sound as ToneElement;
                              const freq = typeof tone.freq === 'number' ? tone.freq : 440;
                              const cycles = (freq / 100) * progress * duration;

                              if (tone.wave === 'sine') {
                                y = centerY + Math.sin(cycles * Math.PI * 2) * amplitude;
                              } else if (tone.wave === 'square') {
                                y =
                                  centerY +
                                  (Math.sin(cycles * Math.PI * 2) > 0 ? amplitude : -amplitude);
                              } else if (tone.wave === 'saw') {
                                y = centerY + ((cycles % 1) * 2 - 1) * amplitude;
                              } else if (tone.wave === 'triangle') {
                                const t = (cycles % 1) * 4;
                                y = centerY + (t < 1 ? t : t < 3 ? 2 - t : t - 4) * amplitude;
                              }
                            } else if (sound.type === 'noise') {
                              y = centerY + (Math.random() * 2 - 1) * amplitude;
                            }

                            points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
                          }

                          const pathData = points.join(' ');

                          return (
                            <g
                              key={layer.id}
                              onClick={() => setCurrentNodeId(layer.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <path
                                d={pathData}
                                stroke={isActive ? '#22c55e' : 'rgba(34, 197, 94, 0.4)'}
                                strokeWidth={isActive ? 2 : 1}
                                fill="none"
                                style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
                              />
                            </g>
                          );
                        });
                      })()}
                      <line
                        x1="0"
                        y1="48"
                        x2="1000"
                        y2="48"
                        stroke="rgba(34, 197, 94, 0.1)"
                        strokeWidth="1"
                      />
                      <line
                        x1="0"
                        y1="24"
                        x2="1000"
                        y2="24"
                        stroke="rgba(34, 197, 94, 0.05)"
                        strokeWidth="1"
                      />
                      <line
                        x1="0"
                        y1="72"
                        x2="1000"
                        y2="72"
                        stroke="rgba(34, 197, 94, 0.05)"
                        strokeWidth="1"
                      />
                    </svg>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-green-500/50 text-xs font-mono">NO SIGNAL</p>
                    </div>
                  )}
                </div>
                <div className="m-3">
                  <button
                    onClick={playSound}
                    disabled={rootNodes.length === 0}
                    className={`md:rounded-lg transition-all border-2 border-green ${
                      isPlaying ? 'text-green bg-transparent' : 'text-grey bg-green'
                    } disabled:bg-gray disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-1 py-1 px-2">
                      {isPlaying ? (
                        <>
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="var(--color-green)">
                            <path d="M6 6h12v12H6z" />
                          </svg>
                          <div className="text-left">
                            <div className="text-xs">(space)</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="var(--color-grey)">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <div className="text-left">
                            <div className="text-xs">(space)</div>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Synth Control Panel */}
            <div className="flex h-full overflow-hidden">
              <div className="w-80 flex-shrink-0 border-r border-navy-light/20 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-navy-light font-semibold text-xs uppercase tracking-wider">
                      Sound Structure
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowAddMenu(showAddMenu === -1 ? null : -1)}
                        className="dropdown-trigger px-2 py-1 text-xs bg-navy-light hover:bg-navy-light/80 rounded transition-colors"
                      >
                        + Add
                      </button>
                      {showAddMenu === -1 && (
                        <div className="dropdown-menu absolute right-0 mt-1 bg-navy border border-navy-light/20 rounded shadow-lg z-10">
                          <button
                            onClick={() => addNode(null, 'tone')}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                          >
                            Tone
                          </button>
                          <button
                            onClick={() => addNode(null, 'noise')}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                          >
                            Noise
                          </button>
                          <button
                            onClick={() => addNode(null, 'group')}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                          >
                            Group
                          </button>
                          <button
                            onClick={() => addNode(null, 'sequence')}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-navy-light/10 transition-colors"
                          >
                            Sequence
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tree">
                    {rootNodes.length === 0 ? (
                      <p className="text-gray-500 text-xs">No layers</p>
                    ) : (
                      <LayerTree nodes={rootNodes} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Tab Header and Action Buttons */}
                <div className="flex justify-between items-center border-b border-navy-light/20">
                  <div className="flex">
                    <button
                      onClick={() => {
                        if (!hasCodeError) {
                          setActiveEditorTab('editor');
                        } else {
                          alert('Please fix the errors in the Code view before switching tabs.');
                        }
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeEditorTab === 'editor'
                          ? 'text-white border-green'
                          : hasCodeError
                            ? 'text-red-400 hover:text-red-300 border-transparent cursor-not-allowed'
                            : 'text-gray-400 hover:text-white border-transparent'
                      }`}
                      disabled={hasCodeError}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setActiveEditorTab('code')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeEditorTab === 'code'
                          ? hasCodeError
                            ? 'text-red-400 border-red-500'
                            : 'text-white border-green'
                          : 'text-gray-400 hover:text-white border-transparent'
                      }`}
                    >
                      Code {hasCodeError && <span className="text-red-400">●</span>}
                    </button>
                  </div>
                  <div className="flex gap-2 px-4">
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-3 py-1.5 text-xs bg-navy border border-navy-light/30 hover:bg-navy-light/10 rounded transition-colors"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([xmlOutput], { type: 'text/xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sound.spa';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 text-xs bg-navy border border-navy-light/30 hover:bg-navy-light/10 rounded transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(xmlOutput);
                      }}
                      className="px-3 py-1.5 text-xs bg-navy border border-navy-light/30 hover:bg-navy-light/10 rounded transition-colors"
                    >
                      Copy SPA
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeEditorTab === 'editor' ? (
                  <div className="flex-1 overflow-y-auto p-4 pb-24">
                    {currentLayer ? (
                      <div className="max-w-6xl">
                        {currentLayer.sound.type === 'tone' ? (
                          <ToneParameters
                            layer={currentLayer}
                            updateLayerSound={updateLayerSound}
                          />
                        ) : (
                          <NoiseParameters
                            layer={currentLayer}
                            updateLayerSound={updateLayerSound}
                          />
                        )}
                      </div>
                    ) : currentNode ? (
                      <div className="text-center mt-8">
                        <p className="text-gray-400 mb-2">
                          Selected: {currentNode.type === 'group' ? 'Group' : 'Sequence'}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {currentNode.type === 'group'
                            ? 'Groups play all their children simultaneously'
                            : 'Sequences play their children in order with timing'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center mt-8">Select a layer to edit</p>
                    )}
                  </div>
                ) : (
                  /* Code View */
                  <CodeEditor
                    value={xmlOutput}
                    onChange={handleCodeChange}
                    onValidChange={handleCodeValidChange}
                    className="flex-1"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-dark border border-navy-light rounded-lg max-w-2xl w-full">
            <div className="bg-navy border-b border-navy-light/20 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-light">Import SPA File</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-navy-light font-semibold">Load from file</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".spa,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-navy border-2 border-dashed border-navy-light/40 rounded-lg hover:border-navy-light transition-colors"
                >
                  Click to select a .spa file
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-navy-light font-semibold">Paste SPA XML</h3>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your SPA XML here..."
                  className="w-full h-48 bg-navy text-white p-4 rounded-lg border border-navy-light/20 font-mono text-sm"
                />
                <button
                  onClick={importFromText}
                  disabled={!importText.trim()}
                  className="w-full py-3 bg-navy-light hover:bg-navy-light/80 disabled:bg-navy disabled:text-gray-500 rounded-lg font-semibold transition-colors"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Knob Component
function Knob({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  displayValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  displayValue?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 150;
      const newValue = Math.max(min, Math.min(max, startValue.current + deltaY * sensitivity));
      onChange(parseFloat(newValue.toFixed(4)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const rotation = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-12 h-12 rounded-full border-2 border-gray-700 cursor-ns-resize shadow-lg"
        onMouseDown={handleMouseDown}
        style={{
          boxShadow: isDragging
            ? 'inset 0 2px 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(124, 58, 237, 0.5)'
            : 'inset 0 2px 8px rgba(0,0,0,0.5)',
          userSelect: 'none',
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="w-1 h-5 bg-navy-light rounded-full shadow-lg"
            style={{ marginTop: '-10px' }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-xs text-navy-light font-mono">{displayValue || value.toFixed(2)}</span>
    </div>
  );
}

// Slider Component
function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  displayValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  displayValue?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 150;
      const newValue = Math.max(min, Math.min(max, startValue.current + deltaY * sensitivity));
      onChange(parseFloat(newValue.toFixed(4)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-8 h-24 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-gray-700 rounded cursor-ns-resize shadow-inner"
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 bg-navy-light/30 rounded transition-all"
          style={{ height: `${percentage}%` }}
        />
        <div
          className="absolute left-0 right-0 h-3 bg-gradient-to-b from-gray-300 to-gray-500 border border-gray-600 rounded shadow-md"
          style={{
            bottom: `calc(${percentage}% - 6px)`,
            boxShadow: isDragging
              ? '0 0 0 2px rgba(124, 58, 237, 0.5), 0 2px 4px rgba(0,0,0,0.3)'
              : '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-xs text-navy-light font-mono">{displayValue || value.toFixed(2)}</span>
    </div>
  );
}

// Tone Parameters Component
function ToneParameters({
  layer,
  updateLayerSound,
}: {
  layer: EditorLayer;
  updateLayerSound: (id: number, updates: Partial<ToneElement | NoiseElement>) => void;
}) {
  const tone = layer.sound as ToneElement;

  const isFreqModulated =
    typeof tone.freq === 'object' && tone.freq !== null && 'start' in tone.freq;
  const freq = typeof tone.freq === 'number' ? tone.freq : 440;
  const freqMod = isFreqModulated
    ? (tone.freq as AutomationCurve)
    : { start: 440, end: 880, curve: 'linear' as const };
  const amp = typeof tone.amp === 'number' ? tone.amp : 1;
  const env =
    typeof tone.envelope === 'object'
      ? tone.envelope
      : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 };
  const filter = typeof tone.filter === 'object' ? tone.filter : undefined;
  const repeat = typeof tone.repeat === 'number' ? tone.repeat : 1;

  return (
    <div className="p-6">
      {/* Top Row: Oscillator + Filter */}
      <div className="flex gap-12 mb-8 pb-8 border-b border-navy-light/20">
        {/* Oscillator */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-2">
              Oscillator
            </h3>
            <div className="flex gap-1.5">
              {[
                { wave: 'sine', path: 'M2,12 Q8,2 14,12 T26,12' },
                { wave: 'square', path: 'M2,12 L2,4 L10,4 L10,20 L18,20 L18,4 L26,4 L26,12' },
                { wave: 'saw', path: 'M2,20 L8,4 L8,20 L14,4 L14,20 L20,4 L20,20 L26,4' },
                { wave: 'triangle', path: 'M2,20 L8,4 L14,20 L20,4 L26,20' },
              ].map(({ wave, path }) => (
                <button
                  key={wave}
                  onClick={() => updateLayerSound(layer.id, { wave } as Partial<ToneElement>)}
                  className={`w-8 h-8 rounded transition-all flex items-center justify-center ${
                    tone.wave === wave
                      ? 'bg-navy-light shadow-lg shadow-navy-light/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-navy-light/50'
                  }`}
                  title={wave}
                >
                  <svg width="28" height="24" viewBox="0 0 28 24" className="opacity-90">
                    <path
                      d={path}
                      stroke={tone.wave === wave ? 'white' : 'rgb(156, 163, 175)'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (isFreqModulated) {
                  // Switch to simple freq
                  updateLayerSound(layer.id, { freq: freqMod.start } as Partial<ToneElement>);
                } else {
                  // Switch to freq modulation
                  updateLayerSound(layer.id, {
                    freq: { start: freq, end: freq * 2, curve: 'linear' },
                  } as Partial<ToneElement>);
                }
              }}
              className={`ml-2 px-2 py-1 text-xs rounded transition-all ${
                isFreqModulated
                  ? 'bg-green text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-navy-light/50'
              }`}
              title="Toggle frequency modulation"
            >
              {isFreqModulated ? '↗' : '→'}
            </button>
          </div>

          {!isFreqModulated ? (
            <div className="flex gap-6 w-full">
              <Knob
                label="Freq"
                value={freq}
                onChange={(v) => updateLayerSound(layer.id, { freq: v } as Partial<ToneElement>)}
                min={20}
                max={2000}
                displayValue={`${Math.round(freq)}Hz`}
              />
              <Knob
                label="Amp"
                value={amp}
                onChange={(v) => updateLayerSound(layer.id, { amp: v } as Partial<ToneElement>)}
                min={0}
                max={1}
              />
              <Knob
                label="Dur"
                value={tone.dur || 0.5}
                onChange={(v) => updateLayerSound(layer.id, { dur: v } as Partial<ToneElement>)}
                min={0.01}
                max={5}
                displayValue={`${(tone.dur || 0.5).toFixed(2)}s`}
              />
              <Knob
                label="Start"
                value={(tone as any).at || 0}
                onChange={(v) => updateLayerSound(layer.id, { at: v } as any)}
                min={0}
                max={10}
                displayValue={`${((tone as any).at || 0).toFixed(2)}s`}
              />
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                {['linear', 'exp', 'log', 'smooth', 'step'].map((curve) => (
                  <button
                    key={curve}
                    onClick={() =>
                      updateLayerSound(layer.id, {
                        freq: { ...freqMod, curve: curve as any },
                      } as Partial<ToneElement>)
                    }
                    className={`px-2 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                      freqMod.curve === curve
                        ? 'bg-green text-white shadow-lg shadow-green/50'
                        : 'bg-gray-800 border border-gray-700 hover:border-green/50 text-gray-300'
                    }`}
                  >
                    {curve}
                  </button>
                ))}
              </div>
              <div className="flex gap-6 w-full">
                <Knob
                  label="F.Start"
                  value={freqMod.start}
                  onChange={(v) =>
                    updateLayerSound(layer.id, {
                      freq: { ...freqMod, start: v },
                    } as Partial<ToneElement>)
                  }
                  min={20}
                  max={2000}
                  displayValue={`${Math.round(freqMod.start)}Hz`}
                />
                <Knob
                  label="F.End"
                  value={freqMod.end}
                  onChange={(v) =>
                    updateLayerSound(layer.id, {
                      freq: { ...freqMod, end: v },
                    } as Partial<ToneElement>)
                  }
                  min={20}
                  max={2000}
                  displayValue={`${Math.round(freqMod.end)}Hz`}
                />
                <Knob
                  label="Amp"
                  value={amp}
                  onChange={(v) => updateLayerSound(layer.id, { amp: v } as Partial<ToneElement>)}
                  min={0}
                  max={1}
                />
                <Knob
                  label="Dur"
                  value={tone.dur || 0.5}
                  onChange={(v) => updateLayerSound(layer.id, { dur: v } as Partial<ToneElement>)}
                  min={0.01}
                  max={5}
                  displayValue={`${(tone.dur || 0.5).toFixed(2)}s`}
                />
                <Knob
                  label="Start"
                  value={(tone as any).at || 0}
                  onChange={(v) => updateLayerSound(layer.id, { at: v } as any)}
                  min={0}
                  max={10}
                  displayValue={`${((tone as any).at || 0).toFixed(2)}s`}
                />
              </div>
            </>
          )}
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-6 items-end">
          <div className="flex gap-3 items-center">
            <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-2">
              Filter
            </h3>
            <div className="flex gap-1.5">
              {['none', 'lowpass', 'highpass', 'bandpass'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'none') {
                      updateLayerSound(layer.id, { filter: undefined } as Partial<ToneElement>);
                    } else {
                      updateLayerSound(layer.id, {
                        filter: {
                          type: type as 'lowpass' | 'highpass' | 'bandpass',
                          cutoff: filter?.cutoff || 1000,
                          resonance: filter?.resonance || 1,
                        },
                      } as Partial<ToneElement>);
                    }
                  }}
                  className={`px-3 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                    (filter?.type || 'none') === type
                      ? 'bg-navy-light text-white shadow-lg shadow-navy-light/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-navy-light/50 text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex gap-6 w-full ${!filter ? 'opacity-40 pointer-events-none' : ''}`}>
            <Knob
              label="Cutoff"
              value={typeof filter?.cutoff === 'number' ? filter.cutoff : 1000}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, cutoff: v },
                  } as Partial<ToneElement>);
                }
              }}
              min={20}
              max={20000}
              displayValue={`${Math.round(typeof filter?.cutoff === 'number' ? filter.cutoff : 1000)}Hz`}
            />
            <Knob
              label="Res"
              value={typeof filter?.resonance === 'number' ? filter.resonance : 1}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, resonance: v },
                  } as Partial<ToneElement>);
                }
              }}
              min={0.1}
              max={30}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Envelope + Repeat */}
      <div className="flex gap-12">
        {/* Envelope */}
        <div>
          <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-3">
            Envelope
          </h3>
          <div className="flex gap-6">
            <Slider
              label="Attack"
              value={env.attack}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, attack: v },
                } as Partial<ToneElement>)
              }
              min={0}
              max={2}
              displayValue={`${env.attack.toFixed(3)}s`}
            />
            <Slider
              label="Decay"
              value={env.decay}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, decay: v },
                } as Partial<ToneElement>)
              }
              min={0}
              max={2}
              displayValue={`${env.decay.toFixed(3)}s`}
            />
            <Slider
              label="Sustain"
              value={env.sustain}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, sustain: v },
                } as Partial<ToneElement>)
              }
              min={0}
              max={1}
            />
            <Slider
              label="Release"
              value={env.release}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, release: v },
                } as Partial<ToneElement>)
              }
              min={0}
              max={2}
              displayValue={`${env.release.toFixed(3)}s`}
            />
          </div>
        </div>

        {/* Repeat */}
        <div>
          <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-3">
            Repeat
          </h3>
          <div className="flex gap-4">
            <Knob
              label="Count"
              value={repeat}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeat: Math.round(v) } as Partial<ToneElement>)
              }
              min={1}
              max={20}
              displayValue={`${Math.round(repeat)}`}
            />
            <Knob
              label="Interval"
              value={tone.repeatInterval ?? 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatInterval: v } as Partial<ToneElement>)
              }
              min={0}
              max={2}
              displayValue={`${(tone.repeatInterval ?? 0).toFixed(2)}s`}
            />
            <Knob
              label="Delay"
              value={tone.repeatDelay ?? 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatDelay: v } as Partial<ToneElement>)
              }
              min={0}
              max={2}
              displayValue={`${(tone.repeatDelay ?? 0).toFixed(2)}s`}
            />
            <Knob
              label="Decay"
              value={tone.repeatDecay ?? 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatDecay: v } as Partial<ToneElement>)
              }
              min={0}
              max={1}
            />
            <Knob
              label="Pitch"
              value={tone.repeatPitchShift ?? 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatPitchShift: v } as Partial<ToneElement>)
              }
              min={-12}
              max={12}
              displayValue={`${(tone.repeatPitchShift ?? 0).toFixed(1)}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Noise Parameters Component
function NoiseParameters({
  layer,
  updateLayerSound,
}: {
  layer: EditorLayer;
  updateLayerSound: (id: number, updates: Partial<ToneElement | NoiseElement>) => void;
}) {
  const noise = layer.sound as NoiseElement;

  const amp = typeof noise.amp === 'number' ? noise.amp : 1;
  const env =
    typeof noise.envelope === 'object'
      ? noise.envelope
      : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 };
  const filter = typeof noise.filter === 'object' ? noise.filter : undefined;
  const repeat = typeof noise.repeat === 'number' ? noise.repeat : 1;

  return (
    <div className="p-6">
      {/* Top Row: Noise Generator + Filter */}
      <div className="flex gap-12 mb-8 pb-8 border-b border-navy-light/20">
        {/* Noise Generator */}
        <div className="flex gap-6 items-end">
          <div className="flex flex-col gap-1">
            <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-2">
              Noise Generator
            </h3>
            <div className="flex flex-col gap-1.5">
              {['white', 'pink', 'brown'].map((color) => (
                <button
                  key={color}
                  onClick={() => updateLayerSound(layer.id, { color } as Partial<NoiseElement>)}
                  className={`px-3 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                    noise.color === color
                      ? 'bg-navy-light text-white shadow-lg shadow-navy-light/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-navy-light/50 text-gray-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
          <Knob
            label="Amp"
            value={amp}
            onChange={(v) => updateLayerSound(layer.id, { amp: v } as Partial<NoiseElement>)}
            min={0}
            max={1}
          />
          <Knob
            label="Dur"
            value={noise.dur || 0.5}
            onChange={(v) => updateLayerSound(layer.id, { dur: v } as Partial<NoiseElement>)}
            min={0.01}
            max={5}
            displayValue={`${(noise.dur || 0.5).toFixed(2)}s`}
          />
          <Knob
            label="Start"
            value={(noise as any).at || 0}
            onChange={(v) => updateLayerSound(layer.id, { at: v } as any)}
            min={0}
            max={10}
            displayValue={`${((noise as any).at || 0).toFixed(2)}s`}
          />
        </div>

        {/* Filter */}
        <div className="flex gap-6 items-end">
          <div className="flex flex-col gap-1">
            <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-2">
              Filter
            </h3>
            <div className="flex gap-1.5">
              {['none', 'lowpass', 'highpass', 'bandpass'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'none') {
                      updateLayerSound(layer.id, { filter: undefined } as Partial<NoiseElement>);
                    } else {
                      updateLayerSound(layer.id, {
                        filter: {
                          type: type as 'lowpass' | 'highpass' | 'bandpass',
                          cutoff: filter?.cutoff || 1000,
                          resonance: filter?.resonance || 1,
                        },
                      } as Partial<NoiseElement>);
                    }
                  }}
                  className={`px-3 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                    (filter?.type || 'none') === type
                      ? 'bg-navy-light text-white shadow-lg shadow-navy-light/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-navy-light/50 text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex gap-6 ${!filter ? 'opacity-40 pointer-events-none' : ''}`}>
            <Knob
              label="Cutoff"
              value={typeof filter?.cutoff === 'number' ? filter.cutoff : 1000}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, cutoff: v },
                  } as Partial<NoiseElement>);
                }
              }}
              min={20}
              max={20000}
              displayValue={`${Math.round(typeof filter?.cutoff === 'number' ? filter.cutoff : 1000)}Hz`}
            />
            <Knob
              label="Res"
              value={typeof filter?.resonance === 'number' ? filter.resonance : 1}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, resonance: v },
                  } as Partial<NoiseElement>);
                }
              }}
              min={0.1}
              max={30}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Envelope + Repeat */}
      <div className="flex gap-12">
        {/* Envelope */}
        <div>
          <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-3">
            Envelope
          </h3>
          <div className="flex gap-6">
            <Slider
              label="Attack"
              value={env.attack}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, attack: v },
                } as Partial<NoiseElement>)
              }
              min={0}
              max={2}
              displayValue={`${env.attack.toFixed(3)}s`}
            />
            <Slider
              label="Decay"
              value={env.decay}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, decay: v },
                } as Partial<NoiseElement>)
              }
              min={0}
              max={2}
              displayValue={`${env.decay.toFixed(3)}s`}
            />
            <Slider
              label="Sustain"
              value={env.sustain}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, sustain: v },
                } as Partial<NoiseElement>)
              }
              min={0}
              max={1}
            />
            <Slider
              label="Release"
              value={env.release}
              onChange={(v) =>
                updateLayerSound(layer.id, {
                  envelope: { ...env, release: v },
                } as Partial<NoiseElement>)
              }
              min={0}
              max={2}
              displayValue={`${env.release.toFixed(3)}s`}
            />
          </div>
        </div>

        {/* Repeat */}
        <div>
          <h3 className="text-navy-light font-bold text-xs uppercase tracking-widest mb-3">
            Repeat
          </h3>
          <div className="flex gap-4">
            <Knob
              label="Count"
              value={repeat}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeat: Math.round(v) } as Partial<NoiseElement>)
              }
              min={1}
              max={20}
              displayValue={`${Math.round(repeat)}`}
            />
            <Knob
              label="Interval"
              value={noise.repeatInterval || 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatInterval: v } as Partial<NoiseElement>)
              }
              min={0}
              max={2}
              displayValue={`${(noise.repeatInterval || 0).toFixed(2)}s`}
            />
            <Knob
              label="Delay"
              value={noise.repeatDelay || 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatDelay: v } as Partial<NoiseElement>)
              }
              min={0}
              max={2}
              displayValue={`${(noise.repeatDelay || 0).toFixed(2)}s`}
            />
            <Knob
              label="Decay"
              value={noise.repeatDecay || 0}
              onChange={(v) =>
                updateLayerSound(layer.id, { repeatDecay: v } as Partial<NoiseElement>)
              }
              min={0}
              max={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
