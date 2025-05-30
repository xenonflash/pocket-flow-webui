import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { FlowListItem, FlowsManagerState, FlowState } from '@/types/pocketflow-editor';
import { useFlowStore } from './flow';

// Helper to generate unique IDs
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const FLOW_LIST_STORAGE_KEY = 'pocketFlows_flowList';
const ACTIVE_FLOW_ID_STORAGE_KEY = 'pocketFlows_activeFlowId';

export const useFlowsManagerStore = defineStore('flowsManager', () => {
  const flowStore = useFlowStore();

  const initialState: FlowsManagerState = {
    flows: [],
    activeFlowId: null,
  };

  // Load initial state from localStorage
  function loadStateFromLocalStorage(): FlowsManagerState {
    const savedFlows = localStorage.getItem(FLOW_LIST_STORAGE_KEY);
    const savedActiveFlowId = localStorage.getItem(ACTIVE_FLOW_ID_STORAGE_KEY);
    
    let flows: FlowListItem[] = [];
    if (savedFlows) {
      try {
        flows = JSON.parse(savedFlows);
      } catch (e) {
        console.error('[flowsManager] Error parsing saved flows from localStorage:', e);
        localStorage.removeItem(FLOW_LIST_STORAGE_KEY); // Clear corrupted data
      }
    }

    let activeFlowId: string | null = null;
    if (savedActiveFlowId && flows.some(f => f.id === savedActiveFlowId)) {
        activeFlowId = savedActiveFlowId;
    } else if (flows.length > 0) {
        // If saved activeFlowId is invalid or not set, but there are flows, set the first one as active.
        activeFlowId = flows[0].id;
    }

    return {
      flows,
      activeFlowId,
    };
  }

  const state = ref<FlowsManagerState>(loadStateFromLocalStorage());

  // Watch for changes in state and persist them to localStorage
  watch(() => state.value.flows, (newFlows) => {
    localStorage.setItem(FLOW_LIST_STORAGE_KEY, JSON.stringify(newFlows));
  }, { deep: true });

  watch(() => state.value.activeFlowId, (newActiveFlowId) => {
    if (newActiveFlowId) {
      localStorage.setItem(ACTIVE_FLOW_ID_STORAGE_KEY, newActiveFlowId);
    } else {
      localStorage.removeItem(ACTIVE_FLOW_ID_STORAGE_KEY);
    }
  });

  // --- Getters ---
  const flows = computed(() => state.value.flows);
  const activeFlowId = computed(() => state.value.activeFlowId);
  const activeFlow = computed(() => {
    if (!state.value.activeFlowId) return null;
    return state.value.flows.find(f => f.id === state.value.activeFlowId) || null;
  });
  const hasActiveFlow = computed(() => !!state.value.activeFlowId);

  // --- Actions ---
  function createFlow(name: string, description: string = '', flowType: string = 'PfFlowDefinition'): FlowListItem {
    const newFlowItem: FlowListItem = {
      id: `flow_${generateUUID()}`,
      name,
      description,
      flowType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.value.flows.push(newFlowItem);
    console.log(`[flowsManager] Flow created: ${name}, ID: ${newFlowItem.id}`);
    return newFlowItem;
  }

  function setActiveFlow(flowId: string | null) {
    console.log(`[flowsManager] Attempting to set active flow to: ${flowId}`);
    if (flowId === null) {
      state.value.activeFlowId = null;
      flowStore.initializeDefaultFlow(); // Show placeholder
      console.log(`[flowsManager] Active flow cleared. Initializing default flow state.`);
      return;
    }

    const flowToActivate = state.value.flows.find(f => f.id === flowId);
    if (flowToActivate) {
      state.value.activeFlowId = flowId;
      const persistedFlowState = loadFlowData(flowId);
      if (persistedFlowState) {
        console.log(`[flowsManager] Found persisted state for flow ${flowId}. Loading into flowStore.`);
        flowStore.loadFlowState(persistedFlowState as FlowState); // Type assertion
      } else {
        console.log(`[flowsManager] No persisted state for flow ${flowId}. Creating new in flowStore.`);
        flowStore.createNewFlow(
          flowToActivate.id,
          flowToActivate.name,
          flowToActivate.description,
          flowToActivate.flowType
        );
      }
      console.log(`[flowsManager] Active flow set to: ${flowToActivate.name} (ID: ${flowId})`);
    } else {
      console.warn(`[flowsManager] Attempted to activate non-existent flow ID: ${flowId}. Setting active flow to null.`);
      state.value.activeFlowId = null;
      flowStore.initializeDefaultFlow(); // Fallback to placeholder
    }
  }

  function updateFlow(flowId: string, updates: Partial<Omit<FlowListItem, 'id' | 'createdAt'>>) {
    const flowIndex = state.value.flows.findIndex(f => f.id === flowId);
    if (flowIndex !== -1) {
      const oldFlowData = { ...state.value.flows[flowIndex] }; // Capture old data for comparison
      state.value.flows[flowIndex] = {
        ...state.value.flows[flowIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // If the active flow's metadata is changed, update it in the flowStore as well
      if (state.value.activeFlowId === flowId && flowStore.flowState.id === flowId) {
        const metadataToUpdate: { name?: string; description?: string; flowType?: string } = {};
        let metadataChanged = false;

        if (updates.name !== undefined && oldFlowData.name !== updates.name) {
            metadataToUpdate.name = updates.name;
            metadataChanged = true;
        }
        if (updates.description !== undefined && oldFlowData.description !== updates.description) {
            metadataToUpdate.description = updates.description;
            metadataChanged = true;
        }
        if (updates.flowType !== undefined && oldFlowData.flowType !== updates.flowType) {
            metadataToUpdate.flowType = updates.flowType;
            metadataChanged = true;
        }

        if (metadataChanged) {
            flowStore.updateFlowMetadata(metadataToUpdate);
            console.log(`[flowsManager] Called flowStore.updateFlowMetadata for flow ID: ${flowId}`);
        }
      }
      console.log(`[flowsManager] Flow updated: ID ${flowId}`);
    }
  }

  function deleteFlow(flowId: string) {
    const flowToDelete = state.value.flows.find(f => f.id === flowId);
    if (!flowToDelete) return;

    state.value.flows = state.value.flows.filter(f => f.id !== flowId);
    // Persist flow list changes (covered by watcher)
    localStorage.removeItem(`flowData_${flowId}`); // Remove persisted flow data
    console.log(`[flowsManager] Deleted flow data from localStorage for ID: ${flowId}`);

    if (state.value.activeFlowId === flowId) {
      if (state.value.flows.length > 0) {
        setActiveFlow(state.value.flows[0].id); // Activate the first flow in the list
      } else {
        setActiveFlow(null); // No flows left, clear active flow and show placeholder
      }
    }
    console.log(`[flowsManager] Flow list item deleted: ID ${flowId}`);
  }
  
  function loadFlowData(flowId: string): FlowState | null {
    const savedFlow = localStorage.getItem(`flowData_${flowId}`);
    if (savedFlow) {
      try {
        console.log(`[flowsManager] Successfully retrieved flow data from localStorage for ID: ${flowId}`);
        return JSON.parse(savedFlow) as FlowState;
      } catch (error) {
        console.error(`[flowsManager] Error parsing flow data from localStorage for ID ${flowId}:`, error);
        localStorage.removeItem(`flowData_${flowId}`); // Clear corrupted data
        return null;
      }
    }
    console.log(`[flowsManager] No flow data found in localStorage for ID: ${flowId}`);
    return null; 
  }

  // Initialize active flow based on persisted state or default
  // This should run once when the store is initialized.
  if (state.value.activeFlowId) {
    console.log("[flowsManager] Initializing with activeFlowId from localStorage:", state.value.activeFlowId);
    setActiveFlow(state.value.activeFlowId); 
  } else if (state.value.flows.length > 0) {
    console.log("[flowsManager] No activeFlowId in localStorage, but flows exist. Activating the first flow.");
    setActiveFlow(state.value.flows[0].id);
  } else {
    console.log("[flowsManager] No flows and no activeFlowId in localStorage. Initializing default flow state.");
    flowStore.initializeDefaultFlow(); // Ensure placeholder is shown if no flows exist
  }

  return {
    flows,
    activeFlowId,
    activeFlow,
    hasActiveFlow,
    createFlow,
    setActiveFlow,
    updateFlow,
    deleteFlow,
  };
});
