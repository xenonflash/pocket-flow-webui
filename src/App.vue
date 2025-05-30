<script setup lang="ts">
import NodePalette from '@/components/layout/NodePalette.vue';
import PropertyEditor from '@/components/layout/PropertyEditor.vue';
import FlowCanvas from '@/components/canvas/FlowCanvas.vue';
import Toolbar from '@/components/layout/Toolbar.vue';
import ExecutionLogPanel from '@/components/layout/ExecutionLogPanel.vue'; // + Import ExecutionLogPanel
import FlowListPanel from '@/components/layout/FlowListPanel.vue'; // + Import FlowListPanel
import { useFlowsManagerStore } from '@/stores/flows-manager';
import { onMounted } from 'vue';
import { useFlowStore } from './stores/flow';

const flowsManagerStore = useFlowsManagerStore();
const flowStore = useFlowStore();

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
    <div class="main-layout">
      <FlowListPanel />
      <div class="editor-area">
        <NodePalette />
        <FlowCanvas />
        <PropertyEditor />
      </div>
    </div>
    <ExecutionLogPanel /> <!-- + Add ExecutionLogPanel here -->
  </div>
</template>

<style scoped>
/* 全局样式重置或基础样式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #ffffff; /* 整体背景色 */
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* Prevent whole page scroll */
}

.main-layout {
  display: flex;
  flex-grow: 1;
  overflow: hidden; /* Important for child flex items to scroll independently */
}

.editor-area {
  display: flex;
  flex-grow: 1;
  /* background-color: #f0f0f0; */ /* Optional: to see the area */
  overflow: hidden; /* Important for child flex items to scroll independently */
}

/* Ensure FlowCanvas can grow and potentially scroll if content is too large */
.editor-area > :nth-child(2) { /* Assuming FlowCanvas is the second child */
  flex-grow: 1;
  overflow: auto; /* Or hidden, depending on desired behavior for canvas itself */
}

.no-flow-selected-message {
  text-align: center;
  color: #6c757d;
  padding: 40px;
  display: flex; /* For centering content */
  flex-direction: column; /* For centering content */
  align-items: center; /* For centering content */
  justify-content: center; /* For centering content */
  height: 100%; /* Take full height of editor-area */
}

.no-flow-selected-message h1 {
  font-size: 1.8em;
  margin-bottom: 15px;
}

.no-flow-selected-message p {
  font-size: 1.1em;
}
</style>
