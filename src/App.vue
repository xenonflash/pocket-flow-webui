<script setup lang="ts">
import NodePalette from '@/components/layout/NodePalette.vue';
import PropertyEditor from '@/components/layout/PropertyEditor.vue';
import FlowCanvas from '@/components/canvas/FlowCanvas.vue';
import Toolbar from '@/components/layout/Toolbar.vue';
import ExecutionLogPanel from '@/components/layout/ExecutionLogPanel.vue';
import FlowListPanel from '@/components/layout/FlowListPanel.vue';
import { useFlowsManagerStore } from '@/stores/flows-manager';
import { onMounted, ref } from 'vue';
import { useFlowStore } from './stores/flow';

const flowsManagerStore = useFlowsManagerStore();
const flowStore = useFlowStore();

const isFlowListVisible = ref(true); // Control visibility of FlowListPanel

onMounted(() => {
  if (!flowsManagerStore.activeFlowId && flowsManagerStore.flows.length === 0) {
    flowStore.initializeDefaultFlow();
  } else if (flowsManagerStore.activeFlowId && flowStore.flowState.id !== flowsManagerStore.activeFlowId) {
    flowsManagerStore.setActiveFlow(flowsManagerStore.activeFlowId);
  }
});
</script>

<template>
  <div class="app-container">
    <Toolbar />
    <div class="main-content-area">
      <FlowListPanel v-if="isFlowListVisible" />
      <div v-if="flowsManagerStore.flows.length > 0" class="editor-layout">
        <NodePalette />
        <FlowCanvas />
        <PropertyEditor />
      </div>
      <div v-else class="no-flows-placeholder">
        <h2>没有可用的流程</h2>
        <p>请从工具栏创建一个新流程开始。</p>
        <!-- TODO: Add a button to trigger create new flow if desired -->
      </div>
    </div>
    <ExecutionLogPanel />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--pf-color-background-secondary); /* Use new var */
}

.main-content-area {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.editor-layout {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

/* Placeholder styles when no flows exist */
.no-flows-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  padding: var(--pf-spacing-xl);
  text-align: center;
  background-color: var(--pf-color-background-primary);
  color: var(--pf-color-text-secondary);
}

.no-flows-placeholder h2 {
  font-size: var(--pf-font-size-xl);
  margin-bottom: var(--pf-spacing-md);
  color: var(--pf-color-text-primary);
  font-weight: var(--pf-font-weight-semibold);
}

.no-flows-placeholder p {
  font-size: var(--pf-font-size-lg);
}

/* Styling for individual panels (NodePalette, FlowCanvas, PropertyEditor) 
   should be within their own components or adjusted here if needed for layout */

/* Example: Give FlowCanvas the most space */
.editor-layout > .flow-canvas-container { /* Assuming FlowCanvas is wrapped or has a specific class */
  flex-grow: 1;
  /* background-color: var(--pf-color-background-primary); */ /* Canvas background */
}

/* Remove old styles that are now handled by base.css or are too specific */
/*
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #ffffff; 
}
.main-layout { ... }
.editor-area { ... }
.editor-area > :nth-child(2) { ... }
.no-flow-selected-message { ... }
*/
</style>
