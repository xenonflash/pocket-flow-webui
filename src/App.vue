<script setup lang="ts">
import Toolbar from './components/layout/Toolbar.vue';
import NodePalette from './components/layout/NodePalette.vue';
import PropertyEditor from './components/layout/PropertyEditor.vue';
import FlowCanvas from './components/canvas/FlowCanvas.vue';
import FlowListPanel from './components/layout/FlowListPanel.vue';
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
  <div id="app-container">
    <Toolbar />
    <div class="main-content">
      <FlowListPanel />
      <NodePalette v-if="flowsManagerStore.hasActiveFlow" />
      <div class="editor-area">
        <FlowCanvas v-if="flowsManagerStore.hasActiveFlow" />
        <div v-else class="no-flow-selected-message">
          <h1>Welcome to Pocket Flow</h1>
          <p>Please create a new flow or select an existing one from the panel on the left to get started.</p>
        </div>
      </div>
      <PropertyEditor v-if="flowsManagerStore.hasActiveFlow" />
    </div>
  </div>
</template>

<style>
/* 全局样式重置或基础样式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #ffffff; /* 整体背景色 */
}

#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 占满整个视口高度 */
  overflow: hidden; /* 防止主容器滚动 */
}

.main-content {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.editor-area {
  flex-grow: 1;
  display: flex; 
  flex-direction: column; /* Changed from row (default) to column */
  justify-content: center; 
  overflow: hidden; 
  position: relative; 
  background-color: #fff; /* Ensure editor area has a background */
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
