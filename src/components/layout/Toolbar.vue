<template>
  <div class="toolbar">
    <button @click="clearCanvas" title="清空画布">
      <span class="icon">🗑️</span> 清空
    </button>
    <button @click="toggleGrid" :class="{ active: editorSettings.showGrid }" title="切换网格">
      <span class="icon">格子</span> {{ editorSettings.showGrid ? '隐藏' : '显示' }}网格
    </button>
    <button @click="toggleSnapToGrid" :class="{ active: editorSettings.snapToGrid }" title="切换吸附网格">
      <span class="icon">磁铁</span> {{ editorSettings.snapToGrid ? '取消' : '' }}吸附
    </button>
    <div class="spacer"></div>
    <button @click="zoomIn" title="放大">
      <span class="icon">➕</span> 放大
    </button>
    <button @click="zoomOut" title="缩小">
      <span class="icon">➖</span> 缩小
    </button>
    <button @click="resetView" title="重置视图">
      <span class="icon">🎯</span> 重置视图
    </button>
     <div class="spacer"></div>
    <button @click="undo" title="撤销" :disabled="!canUndo">
      <span class="icon">↩️</span> 撤销
    </button>
    <button @click="redo" title="重做" :disabled="!canRedo">
      <span class="icon">↪️</span> 重做
    </button>
    <div class="spacer"></div>
    <button @click="saveFlow" title="保存流程 (待实现)" disabled>
      <span class="icon">💾</span> 保存
    </button>
    <button @click="loadFlow" title="加载流程 (待实现)" disabled>
      <span class="icon">📂</span> 加载
    </button>
    <button @click="runFlow" title="运行流程 (待实现)" disabled>
      <span class="icon">▶️</span> 运行
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFlowStore } from '@/stores/flow';

const flowStore = useFlowStore();
const editorSettings = computed(() => flowStore.flowState.editorSettings);
const canUndo = computed(() => flowStore.canUndo);
const canRedo = computed(() => flowStore.canRedo);

const clearCanvas = () => {
  flowStore.clearCanvas();
};

const toggleGrid = () => {
  flowStore.toggleGrid();
};

const toggleSnapToGrid = () => {
  flowStore.toggleSnapToGrid();
};

const zoomIn = () => {
  flowStore.zoomIn();
};

const zoomOut = () => {
  flowStore.zoomOut();
};

const resetView = () => {
  flowStore.resetView();
};

const undo = () => {
  flowStore.undo();
};

const redo = () => {
  flowStore.redo();
};

// Placeholder for future actions
const saveFlow = () => console.warn('Save flow action not implemented yet.');
const loadFlow = () => console.warn('Load flow action not implemented yet.');
const runFlow = () => console.warn('Run flow action not implemented yet.');

</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f0f2f5; /* Lighter grey */
  border-bottom: 1px solid #d1d5db; /* Softer border */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar button {
  background-color: #fff;
  color: #374151; /* Darker text for better contrast */
  border: 1px solid #d1d5db; /* Consistent border */
  padding: 6px 12px;
  margin-right: 8px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
}

.toolbar button .icon {
  margin-right: 5px;
  font-size: 14px; /* Slightly larger icons */
}

.toolbar button:hover {
  background-color: #e5e7eb; /* Subtle hover */
  border-color: #adb5bd;
}

.toolbar button:active, .toolbar button.active {
  background-color: #007bff; /* Vue blue for active state */
  color: white;
  border-color: #007bff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.toolbar button:disabled {
  background-color: #e9ecef;
  color: #adb5bd;
  cursor: not-allowed;
  border-color: #dee2e6;
}

.spacer {
  flex-grow: 1;
}

/* Specific icon styling if needed - using emojis for now */
/* Example: using a font icon library
.toolbar button .icon-clear::before { content: '\f1f8'; font-family: 'FontAwesome'; } 
*/
</style>
