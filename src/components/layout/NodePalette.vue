<template>
  <div class="node-palette">
    <h3>组件</h3>
    <div v-for="(nodes, category) in categorizedNodes" :key="category" class="category-group">
      <h4>{{ category }}</h4>
      <div
        v-for="nodeDef in nodes"
        :key="nodeDef.type"
        class="node-item"
        :style="{ borderColor: nodeDef.color }"
        draggable="true"
        @dragstart="onDragStart($event, nodeDef.type)"
      >
        <!-- Basic icon placeholder, replace with actual icons later -->
        <span v-if="nodeDef.icon" class="node-icon">{{ nodeDef.icon.startsWith('mdi-') ? '' : nodeDef.icon }}</span> 
        {{ nodeDef.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFlowStore } from '@/stores/flow';
import type { NodeDefinition } from '@/types/pocketflow-editor';

const flowStore = useFlowStore();

const categorizedNodes = computed(() => {
  const categories: Record<string, NodeDefinition[]> = {};
  for (const type in flowStore.nodeRegistry) {
    const nodeDef = flowStore.nodeRegistry[type];
    if (!categories[nodeDef.category]) {
      categories[nodeDef.category] = [];
    }
    categories[nodeDef.category].push(nodeDef);
  }
  return categories;
});

const onDragStart = (event: DragEvent, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/pocketflow-nodetype', nodeType);
    event.dataTransfer.effectAllowed = 'copy';
  }
};
</script>

<style scoped>
.node-palette {
  width: 240px;
  padding: 15px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  box-sizing: border-box;
  overflow-y: auto;
}
.node-palette h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px; /* Slightly larger */
  color: #343a40;
  text-align: center;
}
.category-group h4 {
  margin-top: 15px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #495057;
  font-weight: 600;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 4px;
}
.node-item {
  display: flex; /* For icon and text alignment */
  align-items: center; /* For icon and text alignment */
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: #ffffff;
  border: 1px solid #ced4da; /* Default border */
  border-left-width: 4px; /* Colored border on the left */
  border-radius: 4px;
  cursor: grab;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}
.node-item:hover {
  border-color: #007bff;
  border-left-color: #007bff; /* Ensure hover on colored border is consistent */
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
  transform: translateY(-1px);
}
.node-icon {
  margin-right: 8px;
  /* Basic styling for icon, assuming Material Design Icons or similar font icons */
  /* If using MDI, you'd typically use a class like <span class="mdi mdi-cube-outline"></span> */
  /* For now, this is a placeholder. Actual icon rendering might need a library or specific CSS */
  font-family: 'Material Design Icons'; /* Ensure you have MDI font linked if using names like mdi-cube */
  font-size: 18px;
  width: 20px; /* Fixed width for alignment */
  text-align: center;
}
</style>
