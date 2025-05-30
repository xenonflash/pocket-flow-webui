<template>
  <div :class="['execution-log-panel', { collapsed: isCollapsed }]">
    <div class="panel-header" @click="toggleCollapse">
      <h3>运行/调试</h3>
      <button class="collapse-button">{{ isCollapsed ? '▶' : '▼' }}</button>
    </div>
    <div v-if="!isCollapsed" class="panel-content">
      <div class="log-output-section">
        <h4>日志输出</h4>
        <pre class="log-area">{{ logMessages.join('\n') }}</pre>
      </div>
      <div class="shared-state-section">
        <h4>共享状态</h4>
        <pre class="shared-state-area">{{ formattedSharedState }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const isCollapsed = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// Dummy data for now, will be replaced by actual execution data
const logMessages = ref<string[]>([
  '[INFO] Flow execution started...',
  '[DEBUG] Node "Node 1" processing input: {"data": "sample"}',
  '[WARN] Optional input "config" not provided for "Node 2".',
  '[INFO] Node "Node 3" completed successfully.',
  '[ERROR] Node "Node 4" failed: Timeout after 5000ms.',
  '[INFO] Flow execution finished with errors.',
]);

const currentSharedState = ref<Record<string, any>>({
  processedItems: 15,
  apiKey: '********', // Mask sensitive data
  lastRunStatus: 'Error',
  activeQueues: ['queue_A', 'queue_B'],
  results: [
    { id: 'item1', status: 'success' },
    { id: 'item2', status: 'pending' },
  ]
});

const formattedSharedState = computed(() => {
  return JSON.stringify(currentSharedState.value, null, 2);
});

// TODO: Add methods to update logs and shared state from flow execution events
</script>

<style scoped>
.execution-log-panel {
  display: flex;
  flex-direction: column;
  /* height: 300px; */ /* Removed fixed height, will be dynamic */
  background-color: #f0f0f0;
  border-top: 1px solid #ccc;
  padding: 0; /* Adjusted padding */
  font-family: Arial, sans-serif;
  transition: height 0.3s ease; /* Smooth transition for collapse/expand */
}

.execution-log-panel.collapsed {
  height: 40px; /* Height when collapsed, adjust as needed */
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #ccc; /* Add a separator for the header */
}

.execution-log-panel.collapsed .panel-header {
  border-bottom: none; /* No border when collapsed */
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.collapse-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.panel-content {
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-grow: 1;
  overflow: hidden;
  padding: 10px; /* Add padding to the content area */
  height: 260px; /* Fixed height for the content area when expanded */
}

.log-output-section,
.shared-state-section {
  flex: 1;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* For scrolling within sections */
}

.log-output-section h4,
.shared-state-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.log-area,
.shared-state-area {
  flex-grow: 1;
  overflow-y: auto;
  white-space: pre-wrap; /* Allows text to wrap */
  word-break: break-all; /* Breaks long words/strings */
  font-size: 12px;
  color: #333;
  background-color: #f9f9f9;
  padding: 6px;
  border-radius: 3px;
}

/* Styling for different log levels (example) */
.log-area .error {
  color: red;
  font-weight: bold;
}
.log-area .warn {
  color: orange;
}
.log-area .info {
  color: blue;
}
</style>
