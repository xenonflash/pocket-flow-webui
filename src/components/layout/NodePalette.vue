<template>
  <div class="node-palette"><!-- Removed :class="{ collapsed: !hasActiveFlow }" as App.vue handles visibility -->
    <h3 class="palette-title">Components</h3>
    <div v-if="Object.keys(flowStore.categorizedNodeDefinitions).length === 0" class="empty-palette-message">
      <p>No components available.</p>
    </div>
    <div v-for="(nodesInCategory, categoryName) in flowStore.categorizedNodeDefinitions" :key="categoryName" class="category-group">
      <h4 class="category-name">{{ categoryName === 'undefined' ? 'Uncategorized' : categoryName }}</h4>
      <div
        v-for="(nodeDef, index) in nodesInCategory"
        :key="nodeDef.type || `fallback-key-${categoryName}-${index}`" 
        class="node-item"
        :style="{ borderLeftColor: nodeDef.color || '#6c757d' }"
        draggable="true"
        @dragstart="onDragStart($event, nodeDef)"
      >
        <span v-if="nodeDef.icon" class="node-icon">
          <!-- Basic icon rendering, assuming simple text or a class name for an icon font -->
          <i :class="nodeDef.icon" v-if="nodeDef.icon.startsWith('mdi-') || nodeDef.icon.startsWith('fa-')"></i>
          <template v-else>{{ nodeDef.icon }}</template>
        </span>
        <span class="node-label">{{ nodeDef.label || 'Unnamed Node' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'; // Added computed for hasActiveFlow
import { useFlowStore } from '@/stores/flow';
import { useFlowsManagerStore } from '@/stores/flows-manager'; // Import flowsManagerStore
import type { NodeDefinition } from '@/types/pocketflow-editor';

const flowStore = useFlowStore();
const flowsManagerStore = useFlowsManagerStore(); // Instantiate it

// Visibility is now controlled by App.vue using v-if on NodePalette itself
// const hasActiveFlow = computed(() => flowsManagerStore.hasActiveFlow);

const onDragStart = (event: DragEvent, nodeDef: NodeDefinition) => {
  const nodeType = nodeDef.type;
  const nodeLabel = nodeDef.label;
  console.log(`NodePalette DragStart: type='${nodeType}', label='${nodeLabel}'`);
  
  if (event.dataTransfer && typeof nodeType === 'string' && nodeType) {
    event.dataTransfer.setData('application/pocketflow-nodetype', nodeType);
    event.dataTransfer.effectAllowed = 'copy';
  } else {
    console.error(`NodePalette DragStart: nodeType is invalid ('${nodeType}'). Cannot set drag data. Preventing drag.`);
    event.preventDefault(); 
  }
};
</script>

<style scoped>
.node-palette {
  width: 180px; /* Further reduced width */
  padding: 10px; /* Further reduced padding */
  background-color: #fdfdff;
  border-right: 1px solid #e0e0e0;
  box-sizing: border-box;
  overflow-y: auto;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.palette-title {
  margin-top: 0;
  margin-bottom: 10px; /* Reduced margin */
  font-size: 0.95em; /* Reduced font size */
  color: #333;
  font-weight: 600;
  text-align: left;
  padding-bottom: 6px; /* Reduced padding */
  border-bottom: 1px solid #eee;
}

.category-group {
  margin-bottom: 8px; /* Reduced margin */
}

.category-name {
  margin-top: 0;
  margin-bottom: 6px; /* Reduced margin */
  font-size: 0.8em; /* Reduced font size */
  color: #555;
  font-weight: 500;
  padding-left: 2px;
}

.node-item {
  display: flex;
  align-items: center;
  padding: 6px 8px; /* Further reduced padding */
  margin-bottom: 4px; /* Reduced margin */
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-left-width: 3px;
  border-radius: 3px;
  cursor: grab;
  font-size: 0.85em; /* Reduced font size */
  color: #454545;
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-item:hover {
  border-color: #007bff;
  border-left-color: #007bff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  color: #000;
}

.node-icon {
  margin-right: 6px; /* Reduced margin */
  font-size: 1em; /* Slightly reduced icon size */
  width: 16px; /* Reduced width */
  text-align: center;
  color: #777;
  flex-shrink: 0;
}

.node-item:hover .node-icon {
  color: #007bff;
}

.node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.empty-palette-message {
  font-size: 0.8em; /* Reduced font size */
  color: #777;
  text-align: center;
  padding: 10px 0; /* Reduced padding */
}
</style>
