<template>
  <div 
    class="flow-node"
    ref="nodeRef" 
    :style="nodeComputedStyle" 
    :data-node-id="node.id"
    @mousedown.left="$emit('nodeMousedown', $event, node.id)"
    @click="$emit('nodeClick', node.id)"
  >
    <div class="node-header" :style="{ backgroundColor: nodeDefinition?.color || '#ccc' }">
      {{ nodeDefinition?.label || node.label }}
    </div>
    <div class="node-content">
      <!-- Input connection points (optional rendering) -->
      <div v-if="nodeDefinition?.inputs && nodeDefinition.inputs.length > 0" class="input-points-container">
        <div
          v-for="input in nodeDefinition.inputs"
          :key="input.id"
          class="input-point"
          :data-input-id="input.id"
          :title="`${input.label} (${input.id}) - ${input.position.side} @ ${input.position.offset ?? 0.5}`"
          :style="getInputPointStyle(input)"
          @mousedown.stop="console.log('Input point clicked:', input.id)"
        >
          <!-- Optionally, render a visual indicator for inputs -->
        </div>
      </div>

      <p v-for="(value, key) in node.params" :key="key" class="node-param">
        <span class="param-key">{{ getParamLabel(node.type, key as string) || key }}:</span> {{ value }}
      </p>
      
      <!-- Output connection points -->
      <div v-if="nodeDefinition?.outputs && nodeDefinition.outputs.length > 0" class="output-points-container">
         <div
          v-for="output in nodeDefinition.outputs"
          :key="output.id"
          class="action-point" 
          :title="`${output.label} (${output.id}) - ${output.position.side} @ ${output.position.offset ?? 0.5}`"
          :style="getOutputPointStyle(output)"
          
          @mousedown.stop="$emit('actionpointMousedown', $event, node.id, output.id)"
        >
          <!-- Visual indicator for output, e.g., a small circle or icon -->
        </div>
      </div>
      
      <!-- Fallback for old outputActions if new outputs are not defined -->
      <div v-else-if="nodeDefinition?.outputActions" class="node-actions">
        <div 
          v-for="action in nodeDefinition.outputActions"
          :key="action.id"
          class="action-point"
          :title="`${action.label} (${action.id})`"
          @mousedown.stop="$emit('actionpointMousedown', $event, node.id, action.id)" 
        >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
// Ensure NodeInputDefinition and NodeOutputDefinition are imported
import type { FlowNode, NodeDefinition, NodeInputDefinition, NodeOutputDefinition } from '@/types/pocketflow-editor';
import { useFlowStore } from '@/stores/flow';

const props = defineProps<{
  node: FlowNode;
  isSelected: boolean;
  nodeDefinition: NodeDefinition | null;
  getParamLabel: (nodeType: string, paramKey: string) => string | undefined;
}>();

defineEmits<{
  (e: 'nodeMousedown', event: MouseEvent, nodeId: string): void;
  (e: 'nodeClick', nodeId: string): void;
  // Ensure this matches the change from actionId to outputId
  (e: 'actionpointMousedown', event: MouseEvent, nodeId: string, outputId: string): void; 
}>();

const flowStore = useFlowStore();
const nodeRef = ref<HTMLElement | null>(null);

const nodeComputedStyle = computed(() => {
  return {
    backgroundColor: props.node.customVisuals?.backgroundColor || '#ffffff',
    borderColor: props.isSelected ? '#007bff' : (props.node.customVisuals?.color || props.nodeDefinition?.color || '#ccc'),
    boxShadow: props.isSelected ? '0 0 0 2px rgba(0,123,255,.5)' : '0 2px 5px rgba(0,0,0,0.1)',
  };
});

const getInputPointStyle = (inputDef: NodeInputDefinition): Record<string, string> => {
  const offsetPercent = (inputDef.position.offset ?? 0.5) * 100 + '%';
  const style: Record<string, string> = { position: 'absolute' };
  const pointSize = '10px'; // Example size
  const halfPointSize = '-5px'; // -(pointSize / 2)

  switch (inputDef.position.side) {
    case 'top':
      style.top = halfPointSize;
      style.left = offsetPercent;
      style.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      style.bottom = halfPointSize;
      style.left = offsetPercent;
      style.transform = 'translateX(-50%)';
      break;
    case 'left':
      style.left = halfPointSize;
      style.top = offsetPercent;
      style.transform = 'translateY(-50%)';
      break;
    case 'right':
      style.right = halfPointSize;
      style.top = offsetPercent;
      style.transform = 'translateY(-50%)';
      break;
  }
  style.width = pointSize;
  style.height = pointSize;
  return style;
};

const getOutputPointStyle = (outputDef: NodeOutputDefinition): Record<string, string> => {
  // This can be similar to getInputPointStyle or different if outputs are styled differently
  // For now, let's reuse the logic but it could be customized
  const offsetPercent = (outputDef.position.offset ?? 0.5) * 100 + '%';
  const style: Record<string, string> = { position: 'absolute' };
  const pointSize = '14px'; 
  const halfPointSize = '-7px'; 

  switch (outputDef.position.side) {
    case 'top':
      style.top = halfPointSize;
      style.left = offsetPercent;
      style.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      style.bottom = halfPointSize;
      style.left = offsetPercent;
      style.transform = 'translateX(-50%)';
      break;
    case 'left':
      style.left = halfPointSize;
      style.top = offsetPercent;
      style.transform = 'translateY(-50%)';
      break;
    case 'right':
      style.right = halfPointSize;
      style.top = offsetPercent;
      style.transform = 'translateY(-50%)';
      break;
  }
  // Note: The .action-point class already defines width, height, etc.
  // This style is for positioning the absolutely positioned action points.
  // If .action-point is not absolute, these styles might need adjustment or be applied differently.
  return style;
};


const updateSizeInStore = async () => {
  await nextTick(); 
  if (nodeRef.value) {
    const newWidth = nodeRef.value.offsetWidth;
    const newHeight = nodeRef.value.offsetHeight;
    
    if (props.node.id && 
        (!props.node.size || 
         props.node.size.width !== newWidth || 
         props.node.size.height !== newHeight)) {
      flowStore.updateNodeSize(props.node.id, { width: newWidth, height: newHeight });
    }
  }
};

watch(() => [props.node.params, props.nodeDefinition?.outputs, props.nodeDefinition?.inputs, props.node.label], 
  updateSizeInStore, 
  { deep: true } 
);

onMounted(() => {
  updateSizeInStore();
});

</script>

<style scoped>
.flow-node {
  position: absolute; /* This is CRUCIAL for left/top positioning by FlowCanvas */
  box-sizing: border-box; /* Add this line to fix width calculation issues */
  /* left, top, width, and zIndex are applied by FlowCanvas via :style binding on the <FlowNodeItem> tag */
  border: 1px solid;
  border-radius: 8px; 
  background-color: white;
  cursor: default;
  display: flex;
  flex-direction: column;
  user-select: none; 
  transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
  min-height: 60px; 
  /* width is set by FlowCanvas, but if you want nodes to have a minimum width based on content, 
     you might need more complex logic or set it here and ensure FlowCanvas respects it.
     For now, width is primarily controlled by defaultSize or node.size.width from store. */
}
.flow-node:hover {
 box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.node-header {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  border-top-left-radius: 7px; 
  border-top-right-radius: 7px;
  cursor: grab; /* Keep grab cursor on header for dragging indication */
}

.node-content {
  padding: 10px; /* Adjusted padding */
  font-size: 13px;
  flex-grow: 1;
  position: relative; /* Important for absolute positioning of connection points */
  display: flex;
  flex-direction: column;
  min-height: 40px; /* Ensure content area has some height */
}

.node-param {
  margin: 0 0 5px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; 
}
.param-key {
  font-weight: 500;
}

/* Container for input points if rendered on sides */
/* .input-points-container, .output-points-container removed as they were empty */

/* Styling for visible input points (if you choose to render them) */
.input-point {
  /* position: absolute; is set by getPointStyle */
  background-color: #ffc107; /* Amber */
  border: 1px solid #ffa000;
  border-radius: 50%;
  cursor: pointer; /* Or 'crosshair' if inputs can also start edges */
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  z-index: 1;
}
.input-point:hover {
  background-color: #ffca28;
  transform: scale(1.25); /* Already handled by getPointStyle if needed */
}


/* .node-actions was for the old layout, replaced by individual point positioning */
/* .node-actions { ... } */

.action-point {
  /* position: absolute; is set by getOutputPointStyle */
  width: 14px; 
  height: 14px;
  background-color: #607d8b; 
  border: 1px solid #455a64;
  border-radius: 50%;
  cursor: crosshair; 
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.15s ease-in-out;
  z-index: 10; /* Ensure points are above other node content */
}
.action-point:hover {
  background-color: #03a9f4; 
  border-color: #0288d1;
  transform: scale(1.25); /* This might conflict if getOutputPointStyle also sets transform */
}
</style>
