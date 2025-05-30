import { defineStore } from 'pinia';
// Ensure NodeRegistry is imported, it now uses the union type NodeDefinition
import type { FlowState, FlowNode, FlowEdge, NodeRegistry, ParamSchemaItem, NodeDefinition, CodeBlockDefinition, NodeOutputDefinition } from '@/types/pocketflow-editor'; // Added CodeBlockDefinition, NodeOutputDefinition
import { ref, computed, watch, nextTick } from 'vue';

// Import all concrete definition classes
import { PfNodeDefinition } from '@/types/definitions/nodes/PfNodeDefinition';
import { PfAsyncNodeDefinition } from '@/types/definitions/nodes/PfAsyncNodeDefinition';
import { PfBatchNodeDefinition } from '@/types/definitions/nodes/PfBatchNodeDefinition';
import { PfAsyncBatchNodeDefinition } from '@/types/definitions/nodes/PfAsyncBatchNodeDefinition';
import { PfAsyncParallelBatchNodeDefinition } from '@/types/definitions/nodes/PfAsyncParallelBatchNodeDefinition';
import { PfFlowDefinition } from '@/types/definitions/flows/PfFlowDefinition';
import { PfBatchFlowDefinition } from '@/types/definitions/flows/PfBatchFlowDefinition';
import { PfAsyncFlowDefinition } from '@/types/definitions/flows/PfAsyncFlowDefinition';
import { PfAsyncBatchFlowDefinition } from '@/types/definitions/flows/PfAsyncBatchFlowDefinition';
import { PfAsyncParallelBatchFlowDefinition } from '@/types/definitions/flows/PfAsyncParallelBatchFlowDefinition';

// --- Initial Node Registry ---
// Replace plain objects with new class instances
const initialNodeRegistry: NodeRegistry = {
  'pf.Node': new PfNodeDefinition(),
  'pf.AsyncNode': new PfAsyncNodeDefinition(),
  'pf.BatchNode': new PfBatchNodeDefinition(),
  'pf.AsyncBatchNode': new PfAsyncBatchNodeDefinition(),
  'pf.AsyncParallelBatchNode': new PfAsyncParallelBatchNodeDefinition(),
  'pf.Flow': new PfFlowDefinition(),
  'pf.BatchFlow': new PfBatchFlowDefinition(),
  'pf.AsyncFlow': new PfAsyncFlowDefinition(),
  'pf.AsyncBatchFlow': new PfAsyncBatchFlowDefinition(),
  'pf.AsyncParallelBatchFlow': new PfAsyncParallelBatchFlowDefinition(),
  // Add other custom or utility nodes here if any in the future
};

// --- History Snapshot Type ---
interface FlowStateSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  // We might want to include selectedNodeId/selectedEdgeId if restoring selection is desired
  // selectedNodeId: string | null;
  // selectedEdgeId: string | null;
}

// Add a type for metadata updates
interface FlowMetadataUpdates {
  name?: string;
  description?: string;
  flowType?: string;
}

export const useFlowStore = defineStore('flow', () => {
  const nodeRegistry = ref<NodeRegistry>(initialNodeRegistry);

  const initialFlowState: FlowState = {
    id: `flow_default_${Date.now()}`, // Default ID for placeholder
    name: 'No Flow Selected',
    description: 'Please create or select a flow.',
    flowType: 'PfFlowDefinition',
    nodes: [],
    edges: [],
    flowParams: {},
    selectedNodeId: null,
    selectedEdgeId: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    editorSettings: {
      showGrid: true,
      snapToGrid: false,
      gridSize: 20,
    },
  };

  const flowState = ref<FlowState>({ ...initialFlowState });

  // --- History State ---
  const history = ref<FlowStateSnapshot[]>([]);
  const historyIndex = ref<number>(-1);
  const MAX_HISTORY_LENGTH = 50;
  let isRestoringHistory = false;

  // --- Persistence ---
  function persistFlowState() {
    if (flowState.value.id && flowState.value.id.startsWith('flow_')) { // Only persist actual flows, not placeholders
      try {
        console.log(`[flowStore] Persisting flow: ${flowState.value.id}`);
        localStorage.setItem(`flowData_${flowState.value.id}`, JSON.stringify(flowState.value));
      } catch (error) {
        console.error('[flowStore] Error persisting flow state to localStorage:', error);
      }
    }
  }

  // --- Getters ---
  const nodes = computed(() => flowState.value.nodes);
  const edges = computed(() => flowState.value.edges); 
  const selectedNodeId = computed(() => flowState.value.selectedNodeId);
  const selectedEdgeId = computed(() => flowState.value.selectedEdgeId);

  const selectedNode = computed(() => {
    if (!flowState.value.selectedNodeId) return null;
    return flowState.value.nodes.find(n => n.id === flowState.value.selectedNodeId) || null;
  });

  const selectedEdge = computed(() => { 
    if (!flowState.value.selectedEdgeId) return null;
    return flowState.value.edges.find(e => e.id === flowState.value.selectedEdgeId) || null;
  });

  const selectedNodeDefinition = computed(() => {
    if (!selectedNode.value) return null;
    return nodeRegistry.value[selectedNode.value.type] || null;
  });

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  const categorizedNodeDefinitions = computed(() => { // Keep this getter
    const categories: Record<string, NodeDefinition[]> = {};
    const registry = nodeRegistry.value;
    if (!registry || Object.keys(registry).length === 0) {
      return categories;
    }
    for (const [typeKeyInRegistry, nodeDefInstance] of Object.entries(registry)) {
      if (!nodeDefInstance) continue;
      const categoryName = nodeDefInstance.category || 'Uncategorized';
      if (!categories[categoryName]) categories[categoryName] = [];
      categories[categoryName].push(nodeDefInstance);
    }
    return categories;
  });


  // --- Private History Management ---
  function recordHistory() {
    if (isRestoringHistory) return;

    const snapshot: FlowStateSnapshot = {
      nodes: JSON.parse(JSON.stringify(flowState.value.nodes)),
      edges: JSON.parse(JSON.stringify(flowState.value.edges)),
    };

    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1);
    }

    history.value.push(snapshot);
    
    if (history.value.length > MAX_HISTORY_LENGTH) {
      history.value.shift();
    } else {
      historyIndex.value = history.value.length - 1;
    }
    persistFlowState(); // Persist state after recording history
  }
  
  // Initial history record
  // recordHistory(); // This will be called when a flow is created or loaded

  // --- Actions ---
  function addNode(nodeType: string, position: { x: number; y: number }): FlowNode | undefined {
    const definition = nodeRegistry.value[nodeType]; 
    if (!definition) {
      console.error(`Node definition for type "${nodeType}" not found.`);
      return undefined; 
    }

    const newNode: FlowNode = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }),
      type: nodeType,
      label: definition.label,
      position,
      params: JSON.parse(JSON.stringify(definition.defaultParams)), 
      size: definition.defaultSize ? { ...definition.defaultSize } : undefined,
      codeBlocks: {},
    };

    if (definition.supportsCodeEditing && definition.codeBlocksDefinition) {
      newNode.codeBlocks = {}; 
      for (const blockDef of definition.codeBlocksDefinition) {
        newNode.codeBlocks[blockDef.name] = {
          code: blockDef.defaultCode,
          language: blockDef.language,
        };
      }
    }

    flowState.value.nodes.push(newNode);
    setSelectedNode(newNode.id);
    recordHistory();
    return newNode; 
  }

  function setSelectedNode(nodeId: string | null) {
    const changed = flowState.value.selectedNodeId !== nodeId;
    flowState.value.selectedNodeId = nodeId;
    if (nodeId) {
      flowState.value.selectedEdgeId = null;
    }
  }

  function setSelectedEdge(edgeId: string | null) { 
    const changed = flowState.value.selectedEdgeId !== edgeId;
    flowState.value.selectedEdgeId = edgeId;
    if (edgeId) {
      flowState.value.selectedNodeId = null;
    }
  }

  function updateNodeParams(nodeId: string, paramsToUpdate: Record<string, any>) {
    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      node.params = { ...node.params, ...paramsToUpdate };
      recordHistory(); 
    }
  }
  
  function updateNodeCodeBlock(nodeId: string, blockName: string, newCode: string) {
    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      if (node.codeBlocks && node.codeBlocks[blockName]) {
        const definition = nodeRegistry.value[node.type];
        if (definition?.supportsCodeEditing && definition.codeBlocksDefinition?.find((b: CodeBlockDefinition) => b.name === blockName)) {
          node.codeBlocks[blockName].code = newCode;
          recordHistory();
        }
      }
    }
  }

  function updateNodePosition(nodeId: string, newPosition: { x: number, y: number }) {
    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      node.position = newPosition;
      // History recorded by finalizeNodeInteraction
    }
  }

  function finalizeNodeInteraction(itemId?: string) { 
    console.log('Finalizing interaction, recording history for item:', itemId);
    recordHistory();
  }

  function updateViewport(newViewport: Partial<FlowState['viewport']>) {
    flowState.value.viewport = { ...flowState.value.viewport, ...newViewport };
  }

  function addEdge(edgeData: Omit<FlowEdge, 'id' | 'style' | 'lineType' | 'animated'> & { label?: string }) {
    const sourceNode = nodes.value.find(n => n.id === edgeData.sourceNodeId);
    const targetNode = nodes.value.find(n => n.id === edgeData.targetNodeId);

    if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) return;

    const existingEdge = flowState.value.edges.find(e => 
        e.sourceNodeId === edgeData.sourceNodeId &&
        e.sourceOutputId === edgeData.sourceOutputId &&
        e.targetNodeId === edgeData.targetNodeId &&
        e.targetInputId === edgeData.targetInputId
    );
    if (existingEdge) return;
    
    const sourceNodeDef = nodeRegistry.value[sourceNode.type];
    const outputDef = sourceNodeDef?.outputs?.find((o: NodeOutputDefinition) => o.id === edgeData.sourceOutputId);
    const edgeLabel = edgeData.label || outputDef?.label || edgeData.sourceOutputId;

    const newEdge: FlowEdge = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }),
      ...edgeData,
      label: edgeLabel,
      style: { stroke: '#555', strokeWidth: 2 },
      lineType: 'smoothstep',
      animated: false,
    };
    flowState.value.edges.push(newEdge);
    setSelectedEdge(newEdge.id);
    recordHistory();
    return newEdge;
  }

  function removeNode(nodeId: string) {
    const originalNodesCount = flowState.value.nodes.length;
    flowState.value.nodes = flowState.value.nodes.filter(n => n.id !== nodeId);
    flowState.value.edges = flowState.value.edges.filter(
      e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
    );
    if (flowState.value.selectedNodeId === nodeId) {
      setSelectedNode(null);
    }
    if (flowState.value.nodes.length !== originalNodesCount) {
        recordHistory();
    }
  }

  function removeEdge(edgeId: string) {
    const originalEdgesCount = flowState.value.edges.length;
    flowState.value.edges = flowState.value.edges.filter(e => e.id !== edgeId);
    if (flowState.value.selectedEdgeId === edgeId) {
      setSelectedEdge(null);
    }
     if (flowState.value.edges.length !== originalEdgesCount) {
        recordHistory();
    }
  }
  
  function clearCanvas() {
    if (flowState.value.nodes.length > 0 || flowState.value.edges.length > 0) {
        flowState.value.nodes = [];
        flowState.value.edges = [];
        setSelectedNode(null);
        setSelectedEdge(null);
        recordHistory();
    }
  }

  function toggleGrid() {
    flowState.value.editorSettings.showGrid = !flowState.value.editorSettings.showGrid;
    persistFlowState(); // Persist editor settings change
  }

  function toggleSnapToGrid() {
    flowState.value.editorSettings.snapToGrid = !flowState.value.editorSettings.snapToGrid;
    persistFlowState(); // Persist editor settings change
  }

  // ... (zoomIn, zoomOut, resetView remain the same) ...
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 3.0;

  function zoomIn() {
    const newZoom = Math.min(MAX_ZOOM, flowState.value.viewport.zoom + ZOOM_STEP);
    updateViewport({ zoom: newZoom });
    // persistFlowState(); // Viewport changes might also be persisted
  }

  function zoomOut() {
    const newZoom = Math.max(MIN_ZOOM, flowState.value.viewport.zoom - ZOOM_STEP);
    updateViewport({ zoom: newZoom });
    // persistFlowState();
  }

  function resetView() {
    updateViewport({ x: 0, y: 0, zoom: 1 });
    // persistFlowState();
  }

  // Action to update flow metadata without creating a history entry
  function updateFlowMetadata(metadata: FlowMetadataUpdates) {
    let changed = false;
    if (metadata.name !== undefined && flowState.value.name !== metadata.name) {
      flowState.value.name = metadata.name;
      changed = true;
    }
    if (metadata.description !== undefined && flowState.value.description !== metadata.description) {
      flowState.value.description = metadata.description;
      changed = true;
    }
    if (metadata.flowType !== undefined && flowState.value.flowType !== metadata.flowType) {
      flowState.value.flowType = metadata.flowType;
      changed = true;
    }

    if (changed) {
      persistFlowState();
      console.log(`[flowStore] Flow metadata updated and persisted for ID: ${flowState.value.id}`);
    }
  }

  async function undo() {
    if (canUndo.value) {
      isRestoringHistory = true;
      historyIndex.value--;
      const snapshot = history.value[historyIndex.value];
      flowState.value.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
      flowState.value.edges = JSON.parse(JSON.stringify(snapshot.edges));
      setSelectedNode(null);
      setSelectedEdge(null);
      await nextTick(); 
      isRestoringHistory = false;
      persistFlowState(); // Persist after undo
    }
  }

  async function redo() {
    if (canRedo.value) {
      isRestoringHistory = true;
      historyIndex.value++;
      const snapshot = history.value[historyIndex.value];
      flowState.value.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
      flowState.value.edges = JSON.parse(JSON.stringify(snapshot.edges));
      setSelectedNode(null);
      setSelectedEdge(null);
      await nextTick(); 
      isRestoringHistory = false;
      persistFlowState(); // Persist after redo
    }
  }

  function updateNodeSize(nodeId: string, newSize: { width: number, height: number }) {
    if (isRestoringHistory) return;
    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      if (!node.size || node.size.width !== newSize.width || node.size.height !== newSize.height) {
        node.size = { width: newSize.width, height: newSize.height };
        // Do not record history for auto size adjustments, but persist the change
        persistFlowState();
      }
    }
  }

  function clearSelection() {
    setSelectedNode(null);
    setSelectedEdge(null);
  }

  function createNewFlow(id: string, name: string, description: string, flowType: string) {
    flowState.value = {
      id,
      name,
      description,
      flowType,
      nodes: [],
      edges: [],
      flowParams: {},
      selectedNodeId: null,
      selectedEdgeId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      editorSettings: {
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
      }
    };
    history.value = [];
    historyIndex.value = -1;
    recordHistory(); // This will also call persistFlowState for the new flow
    console.log(`[flowStore] New flow instance created in store: ${name} (ID: ${id})`);
  }
  
  // Action to load a full flow state from persistence
  function loadFlowState(savedState: FlowState) {
    console.log(`[flowStore] Loading flow state for ID: ${savedState.id}`);
    isRestoringHistory = true; // Prevent history recording during direct state load
    
    // Ensure all parts of the state are well-defined, merging with defaults if necessary
    const defaultEditorSettings = {
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
    };
    const defaultViewport = { x: 0, y: 0, zoom: 1 };

    flowState.value = {
        ...initialFlowState, // Start with defaults to ensure all keys are present
        ...JSON.parse(JSON.stringify(savedState)), // Deep copy and overwrite with saved state
        editorSettings: { // Explicitly merge editorSettings
            ...defaultEditorSettings,
            ...(savedState.editorSettings || {}),
        },
        viewport: { // Explicitly merge viewport
            ...defaultViewport,
            ...(savedState.viewport || {}),
        }
    };
    
    // Reset history for the loaded flow and establish its current state as the first entry
    history.value = [];
    historyIndex.value = -1;
    
    const snapshot: FlowStateSnapshot = {
      nodes: JSON.parse(JSON.stringify(flowState.value.nodes)),
      edges: JSON.parse(JSON.stringify(flowState.value.edges)),
    };
    history.value.push(snapshot);
    historyIndex.value = 0;

    isRestoringHistory = false;
    console.log(`[flowStore] Flow state loaded for ${flowState.value.name}`);
  }


  function initializeDefaultFlow() {
    const defaultId = initialFlowState.id || `flow_default_${Date.now()}`;
    // Check if a flow with this default ID already exists in localStorage
    // to avoid overwriting it if it was a real flow that happened to have this ID.
    // This is a rare edge case but good to consider.
    // For now, we'll assume createNewFlow will handle it or it's for a placeholder.
    
    // Try to load from localStorage if it's the placeholder ID
    const storedDefaultFlow = localStorage.getItem(`flowData_${defaultId}`);
    if (storedDefaultFlow) {
        try {
            const parsedFlow = JSON.parse(storedDefaultFlow) as FlowState;
            if (parsedFlow.id === defaultId) { // Ensure it's the actual placeholder flow
                loadFlowState(parsedFlow);
                console.log(`[flowStore] Initialized with stored default flow: ${defaultId}`);
                return;
            }
        } catch (e) {
            console.warn('[flowStore] Failed to parse stored default flow, creating new.', e);
        }
    }

    createNewFlow(
      defaultId, 
      initialFlowState.name || 'No Flow Selected', 
      initialFlowState.description || 'Please create or select a flow.', 
      initialFlowState.flowType || 'PfFlowDefinition'
    );
    console.log('[flowStore] Initialized with new default/placeholder flow.');
  }

  function getFlowDefinitionByType(type: string): NodeDefinition | undefined {
    const definition = nodeRegistry.value[type];
    if (definition && definition.isContainer) { 
      return definition;
    }
    return definition; 
  }

  return {
    flowState,
    nodeRegistry,
    nodes, 
    edges, 
    selectedNode, 
    selectedEdge, 
    selectedNodeId, 
    selectedEdgeId, 
    selectedNodeDefinition, 
    canUndo, 
    canRedo, 
    categorizedNodeDefinitions,
    
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    updateNodePosition,
    updateNodeParams, 
    updateNodeCodeBlock,
    updateNodeSize,
    setSelectedNode,
    setSelectedEdge,
    clearSelection, 
    updateViewport, 
    undo,
    redo,
    // recordHistory, // Not typically exposed directly
    finalizeNodeInteraction,
    
    clearCanvas,
    toggleGrid,
    toggleSnapToGrid,
    zoomIn,
    zoomOut,
    resetView,
    
    createNewFlow,
    initializeDefaultFlow, 
    getFlowDefinitionByType, 
    loadFlowState, // Expose the new action
    updateFlowMetadata, // Expose the metadata update action
  };
});
