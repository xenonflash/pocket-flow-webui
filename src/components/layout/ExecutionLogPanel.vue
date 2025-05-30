<template>
  <div :class="['execution-log-panel', { collapsed: isCollapsed }]">
    <div class="panel-header" @click="toggleCollapse">
      <h3>运行/调试</h3>
      <button class="collapse-button">{{ isCollapsed ? '▶' : '▼' }}</button>
    </div>
    <transition name="slide-fade">
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
    </transition>
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
  background-color: var(--pf-color-background-secondary);
  border-top: 1px solid var(--pf-color-border);
  padding: 0;
  font-family: var(--pf-font-family-sans);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--pf-spacing-sm) var(--pf-spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--pf-color-border);
  background-color: var(--pf-color-background-primary);
}

.execution-log-panel.collapsed .panel-header {
  border-bottom: none;
}

.panel-header h3 {
  margin: 0;
  font-size: var(--pf-font-size-lg);
  color: var(--pf-color-text-primary);
  font-weight: var(--pf-font-weight-medium);
}

.collapse-button {
  background: none;
  border: none;
  font-size: var(--pf-font-size-md);
  color: var(--pf-color-text-secondary);
  cursor: pointer;
  padding: var(--pf-spacing-xs);
}

.panel-content {
  display: flex;
  flex-direction: row;
  gap: var(--pf-spacing-md);
  overflow: hidden; /* Crucial for max-height transition */
  padding: var(--pf-spacing-md);
  background-color: var(--pf-color-background-secondary);
  /* Fixed height removed, max-height in transition will control visible size */
}

.log-output-section,
.shared-state-section {
  flex: 1;
  background-color: var(--pf-color-background-primary);
  border: 1px solid var(--pf-color-border);
  border-radius: var(--pf-border-radius-md);
  padding: var(--pf-spacing-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent content from breaking layout */
  min-height: 0; /* Fix for flex item overflow in some browsers */
}

.log-output-section h4,
.shared-state-section h4 {
  margin-top: 0;
  margin-bottom: var(--pf-spacing-sm);
  font-size: var(--pf-font-size-md);
  color: var(--pf-color-text-secondary);
  border-bottom: 1px solid var(--pf-color-border-light);
  padding-bottom: var(--pf-spacing-sm);
  font-weight: var(--pf-font-weight-medium);
}

.log-area,
.shared-state-area {
  flex-grow: 1;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: var(--pf-font-size-md); /* Increased from sm to md for better readability */
  line-height: 1.6; /* Added for better readability */
  color: var(--pf-color-text-primary);
  background-color: var(--pf-color-background-secondary);
  padding: var(--pf-spacing-sm);
  border-radius: var(--pf-border-radius-sm);
  font-family: var(--pf-font-family-mono);
}

/* Transition styles */
.slide-fade-enter-active {
  transition: max-height 0.3s ease-in-out,
              opacity 0.3s ease-in-out,
              transform 0.3s ease-in-out;
}

.slide-fade-leave-active {
  transition: max-height 0.3s ease-in-out, /* Changed to ease-in-out for consistency */
              opacity 0.3s ease-in-out,
              transform 0.3s ease-in-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(20px); /* Increased translateY for more noticeable slide */
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  max-height: 300px; /* Adjust if content typically exceeds this. This is the expanded state height. */
  transform: translateY(0);
}

/* Styling for different log levels (example) */
.log-area .error {
  color: var(--pf-color-danger); /* Use theme color */
  font-weight: var(--pf-font-weight-bold);
}
.log-area .warn {
  color: var(--pf-color-warning); /* Use theme color */
}
.log-area .info {
  color: var(--pf-color-info); /* Use theme color */
  /* Note: --pf-color-info is often the same as --pf-color-primary */
}
</style>
