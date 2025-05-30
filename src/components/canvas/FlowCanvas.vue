<template>
  <div 
    class="flow-canvas-wrapper" 
    ref="canvasWrapperRef"
    @dragover.prevent="canvasInteractions.handleDragOver" 
    @drop.prevent="canvasInteractions.handleDrop"     
  >
    <div 
      class="flow-canvas"
      ref="canvasRef"
      :style="canvasStyle"
    >
      <!-- Render nodes -->
      <FlowNodeItem
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :is-selected="flowStore.flowState.selectedNodeId === node.id"
        :node-definition="getNodeDefinition(node.type)"
        :get-param-label="getNodeParamLabel"
        :style="getNodeStyle(node)" 
        @node-mousedown="nodeInteractions.onNodeMouseDown"
        @node-click="nodeInteractions.selectNode" 
        @actionpoint-mousedown="nodeInteractions.onActionPointMouseDown"
      />

      <!-- Render Edges -->
      <FlowEdgesRenderer 
        :is-drawing-edge="isDrawingEdge"
        :drawing-edge-preview-line="drawingEdgePreviewLine"
      />

      <p v-if="!nodes.length" class="placeholder-text">将组件从左侧拖拽到此处开始</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// ... existing imports ...
import { ref, computed, onMounted } from 'vue';
import { useFlowStore } from '@/stores/flow';
import type { FlowNode, NodeDefinition } from '@/types/pocketflow-editor'; // FlowEdge removed as it's handled by FlowEdgesRenderer
import FlowNodeItem from './FlowNodeItem.vue'; 
import { useCanvasInteractions } from '@/composables/useCanvasInteractions'; 
import FlowEdgesRenderer from './FlowEdgesRenderer.vue';
import { useNodeInteractions } from '@/composables/useNodeInteractions'; // Import the new composable

const flowStore = useFlowStore();
const nodes = computed(() => flowStore.nodes);

const canvasWrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null); 

const isDrawingEdge = ref(false);
const drawingEdgePreviewLine = ref<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

const canvasInteractions = useCanvasInteractions(canvasWrapperRef, canvasRef, isDrawingEdge);
// Initialize the new composable for node interactions
const nodeInteractions = useNodeInteractions(canvasWrapperRef, isDrawingEdge, drawingEdgePreviewLine);


const canvasStyle = computed(() => ({
  transform: `translate(${flowStore.flowState.viewport.x}px, ${flowStore.flowState.viewport.y}px) scale(${flowStore.flowState.viewport.zoom})`,
  backgroundSize: `${(flowStore.flowState.editorSettings.gridSize || 20) * flowStore.flowState.viewport.zoom}px ${(flowStore.flowState.editorSettings.gridSize || 20) * flowStore.flowState.viewport.zoom}px`,
  display: flowStore.flowState.editorSettings.showGrid ? 'block' : 'none',
}));

const getNodeDefinition = (type: string): NodeDefinition | null => {
  return flowStore.nodeRegistry[type] || null;
};

const getNodeParamLabel = (nodeType: string, paramKey: string): string | undefined => {
  const definition = getNodeDefinition(nodeType);
  return definition?.paramSchema[paramKey]?.label;
};

const getNodeStyle = (node: FlowNode) => {
  const definition = getNodeDefinition(node.type);
  return {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
    width: `${node.size?.width || definition?.defaultSize?.width || 180}px`,
    zIndex: flowStore.flowState.selectedNodeId === node.id ? 10 : (isDrawingEdge.value ? 0 : 1),
  };
};

// Node interaction logic (selectNode, onNodeMouseDown, onNodeMouseMove, onNodeMouseUp) 
// and edge drawing logic (onActionPointMouseDown, handleDrawingEdgeMouseMove, handleDrawingEdgeMouseUp, resetDrawingState)
// are now moved to useNodeInteractions.ts

onMounted(() => {
  // Panning and zooming logic is now in useCanvasInteractions
  // Node interaction event listeners are now managed by useNodeInteractions
});

</script>

<style scoped>
/* Styles for .flow-node, .node-header, .node-content, .node-param, .node-actions, .action-point are moved to FlowNodeItem.vue */

.flow-canvas-wrapper {
  flex-grow: 1;
  background-color: #f0f0f0;
  overflow: hidden;
  position: relative;
  cursor: grab; 
}

.flow-canvas {
  width: 1px; 
  height: 1px;
  position: relative; 
  transform-origin: 0 0; 
  /* Grid is now controlled by canvasStyle computed property for dynamic show/hide and size */
  /* background-image: radial-gradient(circle at 1px 1px, #d1d1d1 1px, transparent 0);  */
  /* background-size: 20px 20px; */
}
.flow-canvas[style*="display: block"] { /* Apply grid only when shown */
  background-image: radial-gradient(circle at 1px 1px, #d1d1d1 1px, transparent 0);
}


.placeholder-text {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%); 
  color: #757575;
  font-size: 20px;
  pointer-events: none; 
}

/* .flow-edges-svg style is now in FlowEdgesRenderer.vue */
/*
.flow-edges-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; 
  height: 100%;
  pointer-events: none; 
  overflow: visible; 
}
*/
</style>
