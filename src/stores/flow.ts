import { defineStore } from 'pinia';
import type { FlowState, NodeDefinition, FlowNode, FlowEdge, NodeRegistry, ParamSchemaItem } from '@/types/pocketflow-editor';
import { ref, computed, watch, nextTick } from 'vue'; // Added watch and nextTick

// Helper to generate unique IDs
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Initial Node Registry ---
const initialNodeRegistry: NodeRegistry = {
  'pf.Node': {
    type: 'pf.Node',
    label: '基础节点 (Node)',
    pocketflowClass: 'pf.Node',
    description: 'PocketFlow 中的基础同步节点。',
    defaultParams: { name: 'node', inputs: [], outputs: [] },
    paramSchema: {
      name: { type: 'string', label: '名称', defaultValue: 'node', required: true, description: '节点的唯一名称。' },
      inputs: { type: 'json', label: '输入 (Inputs)', defaultValue: [], description: '节点的输入参数名列表。' },
      outputs: { type: 'json', label: '输出 (Outputs)', defaultValue: [], description: '节点的输出参数名列表。' },
    },
    icon: 'mdi-cube-outline',
    color: '#4CAF50', // Green
    category: '核心',
    defaultSize: { width: 180, height: 100 },
    inputs: [
      { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认输入点' }
    ],
    outputs: [
      { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
      { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
    ],
    // outputActions: [ // This will be removed
    //   { id: 'success', label: '成功', description: '当节点成功执行时触发。' },
    //   { id: 'failure', label: '失败', description: '当节点执行失败时触发。' }
    // ],
  },
  'pf.AsyncNode': {
    type: 'pf.AsyncNode',
    label: '异步节点 (AsyncNode)',
    pocketflowClass: 'pf.AsyncNode',
    description: 'PocketFlow 中的基础异步节点。',
    defaultParams: { name: 'async_node', inputs: [], outputs: [] },
     paramSchema: {
      name: { type: 'string', label: '名称', defaultValue: 'async_node', required: true, description: '节点的唯一名称。' },
      inputs: { type: 'json', label: '输入 (Inputs)', defaultValue: [], description: '节点的输入参数名列表。' },
      outputs: { type: 'json', label: '输出 (Outputs)', defaultValue: [], description: '节点的输出参数名列表。' },
    },
    icon: 'mdi-cogs',
    color: '#2196F3', // Blue
    category: '核心',
    defaultSize: { width: 180, height: 120 },
    inputs: [
      { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认异步输入点' }
    ],
    outputs: [
      { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
      { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
    ],
    // outputActions: [ // This will be removed
    //   { id: 'success', label: '成功', description: '当节点成功执行时触发。' },
    //   { id: 'failure', label: '失败', description: '当节点执行失败时触发。' }
    // ],
  },
  // TODO: Add more node definitions for Flow, BatchNode, etc.
};

// --- History Snapshot Type ---
interface FlowStateSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  // We might want to include selectedNodeId/selectedEdgeId if restoring selection is desired
  // selectedNodeId: string | null;
  // selectedEdgeId: string | null;
}

export const useFlowStore = defineStore('flow', () => {
  // --- State ---
  const nodeRegistry = ref<NodeRegistry>(initialNodeRegistry);

  const flowState = ref<FlowState>({
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
  });

  // --- History State ---
  const history = ref<FlowStateSnapshot[]>([]);
  const historyIndex = ref<number>(-1);
  const MAX_HISTORY_LENGTH = 50; // Max undo steps
  let isRestoringHistory = false; // Flag to prevent recording history during undo/redo

  // --- Getters ---
  const nodes = computed(() => flowState.value.nodes);
  const edges = computed(() => flowState.value.edges); // Added for edges
  const selectedNodeId = computed(() => flowState.value.selectedNodeId);
  const selectedEdgeId = computed(() => flowState.value.selectedEdgeId); // Added

  const selectedNode = computed(() => {
    if (!flowState.value.selectedNodeId) return null;
    return flowState.value.nodes.find(n => n.id === flowState.value.selectedNodeId) || null;
  });

  const selectedEdge = computed(() => { // Added
    if (!flowState.value.selectedEdgeId) return null;
    return flowState.value.edges.find(e => e.id === flowState.value.selectedEdgeId) || null;
  });

  const selectedNodeDefinition = computed(() => {
    if (!selectedNode.value) return null;
    return nodeRegistry.value[selectedNode.value.type] || null;
  });

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  
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
      // historyIndex doesn't need to change here, as we are always adding to the end
      // and then potentially removing from the beginning.
      // The current position (historyIndex) effectively shifts with the array.
    } else {
      historyIndex.value = history.value.length - 1; // Point to the new latest snapshot
    }
  }
  
  // Initial history record - capture the initial empty state
  // This ensures that the first actual change can be undone to this empty state.
  recordHistory(); 

  // --- Actions ---
  function addNode(nodeType: string, position: { x: number; y: number }): FlowNode | undefined {
    const definition = nodeRegistry.value[nodeType];
    if (!definition) {
      console.error(`Node definition for type "${nodeType}" not found.`);
      return undefined; // Return undefined if definition not found
    }

    const newNode: FlowNode = {
      id: generateUUID(),
      type: nodeType,
      label: definition.label,
      position,
      params: JSON.parse(JSON.stringify(definition.defaultParams)), // Deep copy
      size: definition.defaultSize ? { ...definition.defaultSize } : undefined,
    };
    flowState.value.nodes.push(newNode);
    setSelectedNode(newNode.id);
    recordHistory();
    return newNode; // Return the newly created node
  }

  function setSelectedNode(nodeId: string | null) {
    // Only record history if selection actually changes and it's not part of undo/redo
    const changed = flowState.value.selectedNodeId !== nodeId;
    flowState.value.selectedNodeId = nodeId;
    if (nodeId) {
      flowState.value.selectedEdgeId = null;
    }
    // Note: Decided not to record simple selection changes in history for now to avoid clutter.
    // If needed, add: if (changed && !isRestoringHistory) recordHistory();
  }

  function setSelectedEdge(edgeId: string | null) { // Added
    const changed = flowState.value.selectedEdgeId !== edgeId;
    flowState.value.selectedEdgeId = edgeId;
    if (edgeId) {
      flowState.value.selectedNodeId = null;
    }
    // Note: Decided not to record simple selection changes in history.
    // If needed, add: if (changed && !isRestoringHistory) recordHistory();
  }

  function updateNodeParams(nodeId: string, paramsToUpdate: Record<string, any>) {
    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      node.params = { ...node.params, ...paramsToUpdate };
      recordHistory(); // Param changes are discrete, so record immediately
    }
  }

  function updateNodePosition(nodeId: string, newPosition: { x: number, y: number }) {
    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      console.log(`[store] Updating position for ${nodeId} from ${JSON.stringify(node.position)} to ${JSON.stringify(newPosition)}`);
      // Temporarily remove condition to force update for debugging drag issue
      // if (node.position.x !== newPosition.x || node.position.y !== newPosition.y) {
      node.position = newPosition;
      // History is NOT recorded here. It will be recorded by finalizeNodeInteraction.
      // }
    }
  }

  // New action to be called at the end of an interaction that should be recorded
  function finalizeNodeInteraction(itemId?: string) { // itemId is optional, could be nodeId or edgeId
    // We could add logic here if different items need different history handling
    console.log('Finalizing interaction, recording history for item:', itemId);
    recordHistory();
  }

  function updateViewport(newViewport: Partial<FlowState['viewport']>) {
    flowState.value.viewport = { ...flowState.value.viewport, ...newViewport };
    // Viewport changes are typically not part of undo/redo history
  }

  function addEdge(edgeData: Omit<FlowEdge, 'id' | 'style' | 'lineType' | 'animated'> & { label?: string }) {
    const sourceNode = nodes.value.find(n => n.id === edgeData.sourceNodeId);
    const targetNode = nodes.value.find(n => n.id === edgeData.targetNodeId);

    if (!sourceNode || !targetNode) {
      console.error("Source or target node not found for edge creation.");
      return;
    }
    if (sourceNode.id === targetNode.id) {
      console.warn("Cannot connect a node to itself.");
      return;
    }

    // Prevent duplicate edges (same source node, same source output, same target node, same target input)
    const existingEdge = flowState.value.edges.find(e => 
        e.sourceNodeId === edgeData.sourceNodeId &&
        e.sourceOutputId === edgeData.sourceOutputId && // Updated from sourceAction
        e.targetNodeId === edgeData.targetNodeId &&
        e.targetInputId === edgeData.targetInputId
    );
    if (existingEdge) {
        console.warn("Edge already exists:", existingEdge);
        return;
    }
    
    const sourceNodeDef = nodeRegistry.value[sourceNode.type];
    // Get label from the new 'outputs' definition
    const outputDef = sourceNodeDef?.outputs?.find(o => o.id === edgeData.sourceOutputId);
    const edgeLabel = edgeData.label || outputDef?.label || edgeData.sourceOutputId;


    const newEdge: FlowEdge = {
      id: generateUUID(),
      ...edgeData, // sourceOutputId and targetInputId are now part of edgeData
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
    const originalNodes = flowState.value.nodes.length;
    flowState.value.nodes = flowState.value.nodes.filter(n => n.id !== nodeId);
    flowState.value.edges = flowState.value.edges.filter(
      e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
    );
    if (flowState.value.selectedNodeId === nodeId) {
      setSelectedNode(null); // Use setSelectedNode to handle deselection side effects
    }
    if (flowState.value.nodes.length !== originalNodes) { // Check if a node was actually removed
        recordHistory();
    }
  }

  function removeEdge(edgeId: string) {
    const originalEdges = flowState.value.edges.length;
    flowState.value.edges = flowState.value.edges.filter(e => e.id !== edgeId);
    if (flowState.value.selectedEdgeId === edgeId) {
      setSelectedEdge(null);
    }
     if (flowState.value.edges.length !== originalEdges) { // Check if an edge was actually removed
        recordHistory();
    }
  }
  
  // --- Toolbar Actions ---
  function clearCanvas() {
    if (flowState.value.nodes.length > 0 || flowState.value.edges.length > 0) {
        flowState.value.nodes = [];
        flowState.value.edges = [];
        setSelectedNode(null);
        setSelectedEdge(null);
        // resetView(); // Optionally reset view
        recordHistory();
    }
  }

  function toggleGrid() {
    flowState.value.editorSettings.showGrid = !flowState.value.editorSettings.showGrid;
  }

  function toggleSnapToGrid() {
    flowState.value.editorSettings.snapToGrid = !flowState.value.editorSettings.snapToGrid;
  }

  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 3.0;

  function zoomIn() {
    const newZoom = Math.min(MAX_ZOOM, flowState.value.viewport.zoom + ZOOM_STEP);
    updateViewport({ zoom: newZoom });
  }

  function zoomOut() {
    const newZoom = Math.max(MIN_ZOOM, flowState.value.viewport.zoom - ZOOM_STEP);
    updateViewport({ zoom: newZoom });
  }

  function resetView() {
    updateViewport({ x: 0, y: 0, zoom: 1 });
  }

  // --- Undo/Redo Actions ---
  async function undo() { // Made async
    if (canUndo.value) {
      isRestoringHistory = true;
      historyIndex.value--;
      const snapshot = history.value[historyIndex.value];
      flowState.value.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
      flowState.value.edges = JSON.parse(JSON.stringify(snapshot.edges));
      // Deselect on undo/redo to avoid issues with stale selections
      setSelectedNode(null);
      setSelectedEdge(null);
      await nextTick(); // Wait for Vue to process DOM updates
      isRestoringHistory = false;
    }
  }

  async function redo() { // Made async
    if (canRedo.value) {
      isRestoringHistory = true;
      historyIndex.value++;
      const snapshot = history.value[historyIndex.value];
      flowState.value.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
      flowState.value.edges = JSON.parse(JSON.stringify(snapshot.edges));
      setSelectedNode(null);
      setSelectedEdge(null);
      await nextTick(); // Wait for Vue to process DOM updates
      isRestoringHistory = false;
    }
  }

  // Action to update node size
  function updateNodeSize(nodeId: string, newSize: { width: number, height: number }) {
    // If undo/redo is in progress, the component might be reacting to restored state.
    // The guard helps prevent unnecessary updates or logs during the restoration's nextTick phase.
    if (isRestoringHistory) {
      // console.log(`[store] updateNodeSize call for ${nodeId} ignored during history restoration.`);
      return;
    }

    const node = flowState.value.nodes.find(n => n.id === nodeId);
    if (node) {
      // Check if the size actually needs updating
      if (!node.size || node.size.width !== newSize.width || node.size.height !== newSize.height) {
        // console.log(`[store] Updating size for ${nodeId} from ${JSON.stringify(node.size)} to ${JSON.stringify(newSize)} (no new history)`);
        // newSize is a complete { width, height } object from FlowNodeItem.vue
        node.size = { width: newSize.width, height: newSize.height };
        // DO NOT record history here for automatic size adjustments.
        // History should be recorded by user-initiated actions that are explicitly undoable.
      }
    } else {
      // console.warn(`[store] updateNodeSize: Node ${nodeId} not found (possibly already removed).`);
    }
  }

  return {
    nodeRegistry,
    flowState,
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    selectedNode,
    selectedEdge,
    selectedNodeDefinition,
    addNode,
    setSelectedNode,
    setSelectedEdge,
    updateNodeParams,
    updateNodePosition,
    updateViewport, 
    addEdge,
    removeNode,
    removeEdge,
    finalizeNodeInteraction, 
    updateNodeSize, // Export updateNodeSize
    // Toolbar actions
    clearCanvas,
    toggleGrid,
    toggleSnapToGrid,
    zoomIn,
    zoomOut,
    resetView,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
  };
});
