<script setup lang="ts">
import Toolbar from './components/layout/Toolbar.vue';
import NodePalette from './components/layout/NodePalette.vue';
import PropertyEditor from './components/layout/PropertyEditor.vue';
import FlowCanvas from './components/canvas/FlowCanvas.vue';
</script>

<template>
  <div id="app-container">
    <Toolbar />
    <div class="main-content">
      <NodePalette />
      <FlowCanvas />
      <PropertyEditor />
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
  flex-grow: 1; /* 占据 Toolbar 下方的所有剩余空间 */
  overflow: hidden; /* 防止内容区域本身滚动，由子组件控制滚动 */
}
</style>
