<template>
  <div class="flow-list-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header">
      <h3 v-show="!isCollapsed">Flows</h3>
      <button @click="toggleCollapse" class="collapse-btn">
        {{ isCollapsed ? '»' : '«' }}
      </button>
      <button v-show="!isCollapsed" @click="openAddFlowModal" class="add-flow-btn">+</button>
    </div>
    <div v-show="!isCollapsed" class="panel-content-wrapper">
      <ul v-if="flowsManagerStore.flows.length > 0" class="flow-list">
        <li
          v-for="flow in flowsManagerStore.flows"
          :key="flow.id"
          :class="{ active: flow.id === flowsManagerStore.activeFlowId }"
          @click="selectFlow(flow.id)"
        >
          <span class="flow-name">{{ flow.name }}</span>
          <div class="flow-actions">
            <button @click.stop="openEditFlowModal(flow)" class="edit-btn">✏️</button>
            <button @click.stop="confirmDeleteFlow(flow)" class="delete-btn">🗑️</button>
          </div>
        </li>
      </ul>
      <p v-else class="no-flows-message">No flows yet. Click "+" to add one.</p>
    </div>

    <!-- Add/Edit Flow Modal -->
    <div v-if="showAddEditModal" class="modal-overlay" @click.self="closeAddEditModal">
      <div class="modal-content">
        <h4>{{ isEditing ? 'Edit Flow' : 'Add New Flow' }}</h4>
        <form @submit.prevent="handleAddEditFlow">
          <div class="form-group">
            <label for="flowName">Name:</label>
            <input type="text" id="flowName" v-model="currentFlowData.name" required />
          </div>
          <div class="form-group">
            <label for="flowDescription">Description (Optional):</label>
            <textarea id="flowDescription" v-model="currentFlowData.description"></textarea>
          </div>
          <div class="form-group">
            <label for="flowType">Flow Type:</label>
            <select id="flowType" v-model="currentFlowData.flowType">
              <!-- Assuming you have a way to get available flow definitions -->
              <!-- For now, hardcoding the default one -->
              <option value="PfFlowDefinition">Default Flow</option>
              <!-- <option v-for="def in availableFlowTypes" :key="def.type" :value="def.type">{{ def.name }}</option> -->
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeAddEditModal">Cancel</button>
            <button type="submit">{{ isEditing ? 'Save Changes' : 'Create Flow' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmation Modal for Delete -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="cancelDeleteFlow">
      <div class="modal-content">
        <h4>Confirm Delete</h4>
        <p>Are you sure you want to delete the flow "{{ flowToDelete?.name }}"?</p>
        <div class="modal-actions">
          <button type="button" @click="cancelDeleteFlow">Cancel</button>
          <button type="button" @click="executeDeleteFlow" class="confirm-delete-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useFlowsManagerStore } from '@/stores/flows-manager';
import type { FlowListItem } from '@/types/pocketflow-editor';

const flowsManagerStore = useFlowsManagerStore();
const isCollapsed = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const showAddEditModal = ref(false);
const isEditing = ref(false);
const currentFlowData = reactive<Partial<FlowListItem>>({
  id: undefined,
  name: '',
  description: '',
  flowType: 'PfFlowDefinition', // Default flow type
});

const showDeleteConfirmModal = ref(false);
const flowToDelete = ref<FlowListItem | null>(null);

const openAddFlowModal = () => {
  isEditing.value = false;
  currentFlowData.id = undefined;
  currentFlowData.name = '';
  currentFlowData.description = '';
  currentFlowData.flowType = 'PfFlowDefinition';
  showAddEditModal.value = true;
};

const openEditFlowModal = (flow: FlowListItem) => {
  isEditing.value = true;
  currentFlowData.id = flow.id;
  currentFlowData.name = flow.name;
  currentFlowData.description = flow.description;
  currentFlowData.flowType = flow.flowType;
  showAddEditModal.value = true;
};

const closeAddEditModal = () => {
  showAddEditModal.value = false;
};

const handleAddEditFlow = () => {
  if (!currentFlowData.name) {
    alert('Flow name is required.');
    return;
  }
  if (isEditing.value && currentFlowData.id) {
    flowsManagerStore.updateFlow(currentFlowData.id, {
      name: currentFlowData.name,
      description: currentFlowData.description,
      flowType: currentFlowData.flowType,
    });
  } else {
    const newFlow = flowsManagerStore.createFlow(
      currentFlowData.name,
      currentFlowData.description,
      currentFlowData.flowType
    );
    // Optionally activate the new flow
    if (newFlow) {
      flowsManagerStore.setActiveFlow(newFlow.id);
    }
  }
  closeAddEditModal();
};

const selectFlow = (flowId: string) => {
  flowsManagerStore.setActiveFlow(flowId);
};

const confirmDeleteFlow = (flow: FlowListItem) => {
  flowToDelete.value = flow;
  showDeleteConfirmModal.value = true;
};

const cancelDeleteFlow = () => {
  showDeleteConfirmModal.value = false;
  flowToDelete.value = null;
};

const executeDeleteFlow = () => {
  if (flowToDelete.value) {
    flowsManagerStore.deleteFlow(flowToDelete.value.id);
  }
  cancelDeleteFlow();
};

// TODO: Fetch available flow types dynamically if needed
// const availableFlowTypes = computed(() => { /* ... logic to get flow definitions ... */ });
</script>

<style scoped>
.flow-list-panel {
  width: 280px;
  min-width: 280px; /* Keep min-width when not collapsed */
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.3s ease, min-width 0.3s ease;
  overflow: hidden; /* Prevent content overflow during transition */
}

.flow-list-panel.collapsed {
  width: 50px;
  min-width: 50px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px; /* Uniform padding */
  border-bottom: 1px solid #dee2e6;
  background-color: #e9ecef;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.flow-list-panel.collapsed .panel-header {
  padding: 10px 0; /* Adjust padding for centered button */
  justify-content: center;
}

.panel-header h3 {
  margin: 0 0 0 5px; /* Added left margin */
  font-size: 1.1em;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  flex-grow: 1; /* Allow h3 to take space */
}

.collapse-btn {
  background: none;
  border: none;
  font-size: 1.5em; /* Slightly larger for better clickability */
  line-height: 1; /* Ensure consistent height */
  cursor: pointer;
  padding: 0 8px; /* Adjust padding */
  color: #343a40;
  order: -1; /* Move collapse button to the left of H3 when not collapsed */
}

.flow-list-panel.collapsed .collapse-btn {
  order: 0; /* Reset order when collapsed to be the only item */
}

.add-flow-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 1.1em;
  line-height: 26px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: auto; /* Push add button to the far right */
  flex-shrink: 0; /* Prevent button from shrinking */
}

.add-flow-btn:hover {
  background-color: #0056b3;
}

.panel-content-wrapper { /* Added wrapper for content */
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Hide horizontal scrollbar if names are too long */
  display: flex;
  flex-direction: column;
}

.flow-list {
  list-style: none;
  padding: 0;
  margin: 0;
  /* Removed overflow-y and flex-grow, handled by wrapper */
}

.flow-list li {
  padding: 8px 12px; /* Adjusted padding */
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.flow-list li:hover {
  background-color: #e9ecef;
}

.flow-list li.active {
  background-color: #007bff;
  color: white;
  font-weight: 500;
}

.flow-list li.active .flow-name {
  color: white;
}
.flow-list li.active .edit-btn,
.flow-list li.active .delete-btn {
  color: white;
  opacity: 0.8;
}
.flow-list li.active .edit-btn:hover,
.flow-list li.active .delete-btn:hover {
  opacity: 1;
}


.flow-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px; /* Reduced margin */
}

.flow-actions button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 3px; /* Reduced padding */
  font-size: 0.85em; /* Slightly smaller */
  color: #6c757d;
  flex-shrink: 0; /* Prevent action buttons from shrinking */
}
.flow-actions button:hover {
  color: #343a40;
}


.no-flows-message {
  padding: 15px; /* Reduced padding */
  text-align: center;
  color: #6c757d;
  font-size: 0.9em;
  margin-top: 10px; /* Add some space from header */
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 450px;
}

.modal-content h4 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3em;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1em;
}
.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
}

.modal-actions button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-left: 10px;
}

.modal-actions button[type="submit"],
.confirm-delete-btn {
  background-color: #007bff;
  color: white;
}
.modal-actions button[type="submit"]:hover,
.confirm-delete-btn:hover {
  background-color: #0056b3;
}

.modal-actions button[type="button"]:not(.confirm-delete-btn) {
  background-color: #6c757d;
  color: white;
}
.modal-actions button[type="button"]:not(.confirm-delete-btn):hover {
  background-color: #5a6268;
}
</style>
