<template>
  <svg class="flow-edges-svg">
    <!-- Existing Edges -->
    <g v-for="edge in edges" :key="edge.id">
      <path
        :d="getEdgePath(edge).path"
        fill="none"
        :stroke="edge.style?.stroke || '#555'"
        :stroke-width="edge.style?.strokeWidth || 2.5"
        marker-end="url(#arrowhead)" 
      />
      <!-- Optional: Edge label -->
      <text
        v-if="edge.label && getEdgePath(edge).labelPosition"
        :x="getEdgePath(edge).labelPosition?.x"
        :y="getEdgePath(edge).labelPosition?.y"
        font-size="10"
        fill="#333"
        text-anchor="middle"
      >
        {{ edge.label }}
      </text>
    </g>
    <!-- Preview Edge -->
    <line 
      v-if="isDrawingEdge && drawingEdgePreviewLine"
      :x1="drawingEdgePreviewLine.x1"
      :y1="drawingEdgePreviewLine.y1"
      :x2="drawingEdgePreviewLine.x2"
      :y2="drawingEdgePreviewLine.y2"
      stroke="#007bff"
      stroke-width="2"
      stroke-dasharray="5,5"
    />
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" 
      refX="9" refY="3.5" orient="auto-start-reverse">
        <polygon points="0 0, 10 3.5, 0 7" :fill="arrowheadColor" />
      </marker>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useFlowStore } from '@/stores/flow';
import type { FlowNode, FlowEdge, NodeDefinition, NodeInputDefinition, NodeOutputDefinition } from '@/types/pocketflow-editor';

const props = defineProps({
  isDrawingEdge: {
    type: Boolean,
    required: true,
  },
  drawingEdgePreviewLine: {
    type: Object as PropType<{ x1: number, y1: number, x2: number, y2: number } | null>,
    default: null,
  },
});

const flowStore = useFlowStore();
const nodes = computed(() => flowStore.nodes);
const edges = computed(() => flowStore.edges);

const arrowheadColor = computed(() => {
  // Attempt to find an edge to use its color, otherwise default
  // This is a simplification; ideally, the marker could be dynamic per edge
  // or a more robust default/prop could be used.
  const firstEdgeWithStyle = edges.value.find(e => e.style?.stroke);
  return firstEdgeWithStyle?.style?.stroke || '#555';
});

const getNodeDefinition = (type: string): NodeDefinition | null => {
  return flowStore.nodeRegistry[type] || null;
};

const getNodeConnectionPointCoordinates = (
  node: FlowNode,
  pointId: string,
  pointType: 'input' | 'output'
): { x: number; y: number } | null => {
  const nodeDef = getNodeDefinition(node.type);
  if (!nodeDef) return null;

  const nodeSize = {
    width: node.size?.width || nodeDef.defaultSize?.width || 180,
    height: node.size?.height || nodeDef.defaultSize?.height || 80,
  };

  const points = pointType === 'input' ? nodeDef.inputs : nodeDef.outputs;
  const pointDef = points?.find(p => p.id === pointId);

  if (!pointDef) {
    // Fallback for old outputActions or if point not found - center of node or previous logic
    if (pointType === 'output') {
        // Try to use old outputActions logic if new outputs are not defined
        const outputActions = (nodeDef as any).outputActions as Array<{ id: string; label: string; }> | undefined;
        if (outputActions && outputActions.length > 0) {
            const actionIndex = outputActions.findIndex(a => a.id === pointId);
            if (actionIndex !== -1) {
                return {
                    x: node.position.x + (nodeSize.width / (outputActions.length + 1)) * (actionIndex + 1),
                    y: node.position.y + nodeSize.height - 5 - 7, // 5 padding, 7 radius
                };
            }
        }
        // Default to bottom center if no specific output point
        return { x: node.position.x + nodeSize.width / 2, y: node.position.y + nodeSize.height };
    }
    // Default to top center if no specific input point
    return { x: node.position.x + nodeSize.width / 2, y: node.position.y };
  }

  let x = node.position.x;
  let y = node.position.y;
  const offset = pointDef.position.offset ?? 0.5;

  switch (pointDef.position.side) {
    case 'top':
      x += nodeSize.width * offset;
      // y remains node.position.y
      break;
    case 'bottom':
      x += nodeSize.width * offset;
      y += nodeSize.height;
      break;
    case 'left':
      // x remains node.position.x
      y += nodeSize.height * offset;
      break;
    case 'right':
      x += nodeSize.width;
      y += nodeSize.height * offset;
      break;
  }
  return { x, y };
};

const getEdgePath = (edge: FlowEdge): { path: string; labelPosition?: { x: number; y: number } } => {
  const sourceNode = nodes.value.find(n => n.id === edge.sourceNodeId);
  const targetNode = nodes.value.find(n => n.id === edge.targetNodeId);

  if (!sourceNode || !targetNode) {
    return { path: '' };
  }

  const sourcePoint = getNodeConnectionPointCoordinates(sourceNode, edge.sourceOutputId, 'output');
  const targetPoint = getNodeConnectionPointCoordinates(targetNode, edge.targetInputId, 'input');

  if (!sourcePoint || !targetPoint) {
    console.warn('Could not find connection points for edge:', edge);
    return { path: '' };
  }

  const sx = sourcePoint.x;
  const sy = sourcePoint.y;
  const tx = targetPoint.x;
  const ty = targetPoint.y;

  // Determine control points based on connection side for a more natural curve
  let c1x = sx, c1y = sy, c2x = tx, c2y = ty;
  const dx = Math.abs(tx - sx);
  const dy = Math.abs(ty - sy);
  const offset = Math.max(dx * 0.5, dy * 0.3, 50); // Adjusted offset calculation

  const sourceDef = getNodeDefinition(sourceNode.type);
  const sourceOutputDef = sourceDef?.outputs?.find(o => o.id === edge.sourceOutputId);
  
  const targetDef = getNodeDefinition(targetNode.type);
  const targetInputDef = targetDef?.inputs?.find(i => i.id === edge.targetInputId);

  // Horizontal connections (left to right or right to left)
  if (sourceOutputDef?.position.side === 'right' && targetInputDef?.position.side === 'left') {
    c1x = sx + offset;
    c2x = tx - offset;
  } else if (sourceOutputDef?.position.side === 'left' && targetInputDef?.position.side === 'right') {
    c1x = sx - offset;
    c2x = tx + offset;
  } 
  // Vertical connections (top to bottom or bottom to top)
  else if (sourceOutputDef?.position.side === 'bottom' && targetInputDef?.position.side === 'top') {
    c1y = sy + offset;
    c2y = ty - offset;
  } else if (sourceOutputDef?.position.side === 'top' && targetInputDef?.position.side === 'bottom') {
    c1y = sy - offset;
    c2y = ty + offset;
  } 
  // Mixed or default (fallback to old behavior or a simpler curve)
  else {
    // Default: control points create a gentle S-curve or C-curve based on relative positions
    if (Math.abs(dx) > Math.abs(dy)) { // More horizontal distance
        c1x = sx + dx * 0.3;
        c1y = sy;
        c2x = tx - dx * 0.3;
        c2y = ty;
    } else { // More vertical distance
        c1x = sx;
        c1y = sy + dy * 0.3;
        c2x = tx;
        c2y = ty - dy * 0.3;
    }
    // If points are on the same side, create a loop-like curve
    if (sourceOutputDef?.position.side === targetInputDef?.position.side) {
        const loopOffset = 30;
        if (sourceOutputDef?.position.side === 'top' || sourceOutputDef?.position.side === 'bottom') {
            c1x = sx + loopOffset * (sourceOutputDef?.position.side === 'top' ? -1 : 1);
            c1y = sy + loopOffset * (sourceOutputDef?.position.side === 'top' ? -1 : 1);
            c2x = tx + loopOffset * (sourceOutputDef?.position.side === 'top' ? -1 : 1);
            c2y = ty + loopOffset * (sourceOutputDef?.position.side === 'top' ? 1 : -1);
        } else { // left or right
            c1x = sx + loopOffset * (sourceOutputDef?.position.side === 'left' ? -1 : 1);
            c1y = sy + loopOffset * (sourceOutputDef?.position.side === 'left' ? -1 : 1);
            c2x = tx + loopOffset * (sourceOutputDef?.position.side === 'left' ? 1 : -1);
            c2y = ty + loopOffset * (sourceOutputDef?.position.side === 'left' ? -1 : 1);
        }
    }
  }

  const path = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
  
  const labelPosition = {
      x: 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx,
      y: 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ty,
  };

  return { path, labelPosition };
};

</script>

<style scoped>
.flow-edges-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; 
  height: 100%;
  pointer-events: none; 
  overflow: visible; 
}
</style>
