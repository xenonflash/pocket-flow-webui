<template>
  <div class="property-editor">
    <h3>属性编辑</h3>

    <!-- Node Properties -->
    <div v-if="selectedNode && selectedNodeDefinition" class="editor-content">
      <div class="property-group">
        <label>ID:</label>
        <span>{{ selectedNode.id }}</span>
      </div>
      <div class="property-group">
        <label>类型:</label>
        <span>{{ selectedNodeDefinition.label }}</span>
      </div>

      <template v-if="formSchema.length > 0">
        <h4>参数</h4>
        <FormKit
          type="form"
          v-model="formData"
          :actions="false"
          @input="(newValues) => handleFormInput(newValues as FormKitGroupValue | undefined)"
        >
          <FormKitSchema :schema="formSchema" :data="formData" />
        </FormKit>
      </template>
      
      <!-- Shared State Access Info -->
      <div v-if="selectedNodeDefinition.sharedStateAccess" class="shared-state-access-info property-group">
        <h4>共享状态访问</h4>
        <div v-if="selectedNodeDefinition.sharedStateAccess.reads && selectedNodeDefinition.sharedStateAccess.reads.length > 0">
          <label>读取:</label>
          <span>{{ selectedNodeDefinition.sharedStateAccess.reads.join(', ') }}</span>
        </div>
        <div v-if="selectedNodeDefinition.sharedStateAccess.writes && selectedNodeDefinition.sharedStateAccess.writes.length > 0">
          <label>写入:</label>
          <span>{{ selectedNodeDefinition.sharedStateAccess.writes.join(', ') }}</span>
        </div>
        <div v-if="(!selectedNodeDefinition.sharedStateAccess.reads || selectedNodeDefinition.sharedStateAccess.reads.length === 0) && (!selectedNodeDefinition.sharedStateAccess.writes || selectedNodeDefinition.sharedStateAccess.writes.length === 0)">
          <p>此节点不访问共享状态。</p>
        </div>
      </div>

      <!-- Code Editing Section -->
      <div v-if="selectedNodeDefinition.supportsCodeEditing && selectedNodeDefinition.codeBlocksDefinition && selectedNodeDefinition.codeBlocksDefinition.length > 0" class="code-editing-section">
        <h4>代码块</h4>
        <div class="code-blocks-list">
          <button 
            v-for="blockDef in selectedNodeDefinition.codeBlocksDefinition"
            :key="blockDef.name"
            @click="openCodeEditorForBlock(blockDef.name)"
            class="edit-code-block-button"
          >
            编辑 {{ blockDef.label }} ({{ blockDef.language }})
          </button>
        </div>
      </div>
    </div>

    <!-- Flow Properties -->
    <div v-else-if="currentFlowState" class="editor-content flow-properties">
      <h4>流程属性</h4>
      <div class="property-group">
        <label for="flowName">流程名称:</label>
        <input id="flowName" type="text" v-model="editableFlowName" @blur="updateFlowName" class="formkit-input" />
      </div>
      <div class="property-group">
        <label for="flowDescription">流程描述:</label>
        <textarea id="flowDescription" v-model="editableFlowDescription" @blur="updateFlowDescription" class="formkit-input"></textarea>
      </div>
      <div class="property-group">
        <label for="flowInitialSharedState">初始共享状态 (JSON):</label>
        <textarea 
          id="flowInitialSharedState" 
          v-model="editableInitialSharedState" 
          @blur="updateFlowInitialSharedState" 
          class="formkit-input json-textarea"
          rows="8"
          placeholder='例如：\n{\n  "apiKey": "your_api_key",\n  "maxRetries": 3\n}'
        ></textarea>
        <p v-if="initialSharedStateError" class="error-message">{{ initialSharedStateError }}</p>
      </div>
       <div class="property-group">
        <label>流程ID:</label>
        <span>{{ currentFlowState.id }}</span>
      </div>
      <div class="property-group">
        <label>流程类型:</label>
        <span>{{ currentFlowState.flowType }}</span>
      </div>
    </div>
    
    <div v-else class="no-selection">
      <p>未选择任何节点或流程。</p>
    </div>
  </div>

  <CodeEditorModal
    :show="isCodeEditorOpen"
    :node-id="selectedNode?.id || null" 
    :block-name="currentEditingBlockName"
    @save="handleSaveCodeBlock"
    @close="closeCodeEditor"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, toRaw } from 'vue';
import { useFlowStore } from '@/stores/flow';
import type { ParamSchemaItem, NodeDefinition, FlowNode } from '@/types/pocketflow-editor';
import { FormKitSchema } from '@formkit/vue';
import type { FormKitSchemaDefinition, FormKitNode, FormKitGroupValue, FormKitSchemaNode } from '@formkit/core';
import CodeEditorModal from '@/components/modals/CodeEditorModal.vue';

const flowStore = useFlowStore();

const selectedNode = computed(() => flowStore.selectedNode);
const selectedNodeDefinition = computed(() => flowStore.selectedNodeDefinition);
const formData = ref<Record<string, any>>({});

// Flow properties
const currentFlowState = computed(() => flowStore.flowState);
const editableFlowName = ref('');
const editableFlowDescription = ref('');
const editableInitialSharedState = ref('');
const initialSharedStateError = ref<string | null>(null);


watch(currentFlowState, (newFlowState) => {
  if (newFlowState) {
    editableFlowName.value = newFlowState.name;
    editableFlowDescription.value = newFlowState.description;
    editableInitialSharedState.value = JSON.stringify(newFlowState.initialSharedState || {}, null, 2);
    initialSharedStateError.value = null; // Reset error on flow change
  }
}, { immediate: true, deep: true });

const updateFlowName = () => {
  if (currentFlowState.value && editableFlowName.value !== currentFlowState.value.name) {
    flowStore.updateFlowMetadata({ name: editableFlowName.value });
  }
};

const updateFlowDescription = () => {
  if (currentFlowState.value && editableFlowDescription.value !== currentFlowState.value.description) {
    flowStore.updateFlowMetadata({ description: editableFlowDescription.value });
  }
};

const updateFlowInitialSharedState = () => {
  if (currentFlowState.value) {
    try {
      const parsedState = JSON.parse(editableInitialSharedState.value);
      // Check if the parsed state is different from the current state in the store to avoid unnecessary updates
      if (JSON.stringify(parsedState) !== JSON.stringify(currentFlowState.value.initialSharedState || {})) {
        flowStore.updateInitialSharedState(parsedState);
      }
      initialSharedStateError.value = null;
    } catch (e) {
      initialSharedStateError.value = '无效的 JSON 格式。';
      console.warn("Error parsing initialSharedState JSON:", e);
    }
  }
};


const isCodeEditorOpen = ref(false);
const currentEditingBlockName = ref<string | null>(null);

function openCodeEditorForBlock(blockName: string) {
  if (selectedNode.value && selectedNodeDefinition.value?.supportsCodeEditing) {
    currentEditingBlockName.value = blockName;
    isCodeEditorOpen.value = true;
  }
}

const closeCodeEditor = () => {
  isCodeEditorOpen.value = false;
  currentEditingBlockName.value = null;
};

const handleSaveCodeBlock = (blockName: string, newCode: string) => {
  console.log(`[PropertyEditor] handleSaveCodeBlock called. Node ID: ${selectedNode.value?.id}, Block Name: ${blockName}, New Code: ${newCode}`);
  if (selectedNode.value && blockName) {
    flowStore.updateNodeCodeBlock(selectedNode.value.id, blockName, newCode);
  }
};

const mapParamTypeToFormKitType = (paramType: ParamSchemaItem['type']): string => {
  switch (paramType) {
    case 'string': return 'text';
    case 'number': return 'number';
    case 'boolean': return 'checkbox';
    case 'select': return 'select';
    case 'textarea': return 'textarea';
    case 'json': return 'textarea'; 
    default: return 'text';
  }
};

const formSchema = computed<FormKitSchemaNode[]>(() => {
  if (!selectedNodeDefinition.value || !selectedNodeDefinition.value.paramSchema) {
    return [];
  }
  const schemaRecord = selectedNodeDefinition.value.paramSchema;
  
  return Object.entries(schemaRecord).map(([name, schemaItem]) => {
    const formKitType = mapParamTypeToFormKitType(schemaItem.type);
    
    const definitionNode: FormKitSchemaNode = {
      $formkit: formKitType,
      name: name,
      label: schemaItem.label || name,
      help: schemaItem.description,
      placeholder: schemaItem.placeholder,
    };

    if (schemaItem.validation || schemaItem.required) {
      const rules: string[] = [];
      if (schemaItem.required) rules.push('required');
      if (schemaItem.validation?.min !== undefined) rules.push(`min:${schemaItem.validation.min}`);
      if (schemaItem.validation?.max !== undefined) rules.push(`max:${schemaItem.validation.max}`);
      if (schemaItem.validation?.minLength !== undefined) rules.push(`length:${schemaItem.validation.minLength},*`);
      if (schemaItem.validation?.maxLength !== undefined) rules.push(`length:*,${schemaItem.validation.maxLength}`);
      if (schemaItem.validation?.pattern) rules.push(`matches:${schemaItem.validation.pattern}`);
      if (rules.length > 0) {
        definitionNode.validation = rules.join('|');
      }
    }
    if (schemaItem.type === 'select' && schemaItem.options) {
      definitionNode.options = schemaItem.options;
    }
    if (schemaItem.type === 'textarea' && schemaItem.rows) {
      (definitionNode as any).rows = schemaItem.rows;
    }
    if (schemaItem.type === 'json') {
      definitionNode.help = `${schemaItem.description || ''} (请输入有效的 JSON)`.trim();
    }
    return definitionNode;
  });
});

watch(selectedNode, (newNode, oldNode) => {
  if (isCodeEditorOpen.value && (newNode?.id !== oldNode?.id || !newNode)) {
    closeCodeEditor();
  }

  if (newNode && newNode.id !== oldNode?.id) {
    const newFormData: Record<string, any> = {};
    if (selectedNodeDefinition.value && selectedNodeDefinition.value.paramSchema) {
      const schemaRecord = selectedNodeDefinition.value.paramSchema;
      for (const paramName in schemaRecord) {
        const schemaItem = schemaRecord[paramName];
        let value = newNode.params[paramName];
        if (value === undefined && schemaItem.defaultValue !== undefined) {
          value = schemaItem.defaultValue;
        }
        if (schemaItem.type === 'json' && value !== undefined) {
          newFormData[paramName] = JSON.stringify(value, null, 2);
        } else {
          newFormData[paramName] = value;
        }
      }
    }
    formData.value = newFormData;
    console.log(`[PropertyEditor] Selected node changed or initialized. Node ID: ${newNode?.id}. formData initialized:`, JSON.parse(JSON.stringify(newFormData)));
    if (newNode?.codeBlocks) {
      console.log(`[PropertyEditor] Current codeBlocks for node ${newNode.id}:`, JSON.parse(JSON.stringify(newNode.codeBlocks)));
    }
  } else if (!newNode) {
    formData.value = {}; 
    console.log("[PropertyEditor] No node selected. formData cleared.");
  }
}, { immediate: true, deep: true });

const handleFormInput = (newValues: FormKitGroupValue | undefined) => {
  if (selectedNode.value && selectedNodeDefinition.value && newValues) {
    const paramsToUpdate: Record<string, any> = {};
    const schemaRecord = selectedNodeDefinition.value.paramSchema;

    if (!schemaRecord) return;

    for (const paramName in newValues) {
      const schemaItem = schemaRecord[paramName];
      if (schemaItem && schemaItem.type === 'json') {
        try {
          const rawValue = newValues[paramName];
          const parsedValue = rawValue && typeof rawValue === 'string' && rawValue.trim() !== '' 
                              ? JSON.parse(rawValue) 
                              : undefined;
          paramsToUpdate[paramName] = parsedValue;
        } catch (e) {
          console.warn(`Invalid JSON for param ${paramName}:`, newValues[paramName]);
          // If JSON is invalid, store the raw string so user can fix it.
          // Or, decide if you want to prevent update / show error in UI
          paramsToUpdate[paramName] = newValues[paramName]; 
        }
      } else {
        paramsToUpdate[paramName] = newValues[paramName];
      }
    }
    // Only update if there are actual changes to avoid unnecessary history entries
    if (Object.keys(paramsToUpdate).length > 0 && selectedNode.value) { 
       flowStore.updateNodeParams(selectedNode.value.id, paramsToUpdate);
    }
  }
};

</script>

<style scoped>
.property-editor {
  width: 300px; 
  padding: 15px;
  background-color: #f8f9fa;
  border-left: 1px solid #dee2e6;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%; 
}

.property-editor h3 {
  margin-top: 0;
  margin-bottom: 20px; 
  font-size: 18px;
  color: #343a40;
  text-align: center;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 18px; 
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 6px; 
}

.property-group label {
  font-weight: 600;
  font-size: 14px;
  color: #495057;
}

.property-group span,
.property-group input[type="text"],
.property-group textarea {
  background-color: #e9ecef; 
  color: #495057;
  padding: 8px 10px;
  border-radius: 4px;
  word-break: break-all; 
  border: 1px solid #ced4da; /* Added for consistency with formkit inputs */
}

.property-group input[type="text"],
.property-group textarea {
   background-color: #fff; /* Inputs should be white */
}


/* FormKit styles will largely be handled by the theme, but we can add overrides */
:deep(.formkit-form) {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Spacing between FormKit fields */
}

:deep(.formkit-outer) {
  margin-bottom: 0; /* Remove default FormKit outer margins if any */
}

:deep(.formkit-label) {
  font-weight: 600;
  font-size: 14px;
  color: #495057;
}

:deep(.formkit-input) {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background-color: #fff;
}

:deep(.formkit-input[type="checkbox"]) {
  width: auto; 
  margin-top: 5px;
  align-self: flex-start; 
}


:deep(.formkit-input:focus) {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

:deep(.formkit-help) {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

:deep(.formkit-messages) {
  list-style: none;
  padding: 0;
  margin: 0;
}
:deep(.formkit-message) {
  font-size: 12px;
  color: #dc3545; /* Bootstrap danger color for errors */
  margin-top: 4px;
}


.no-selection {
  text-align: center;
  color: #6c757d;
  margin-top: 40px; 
}
.no-selection p {
  font-size: 15px;
}

h4 { 
  margin-top: 15px; 
  margin-bottom: 12px; 
  font-size: 16px;
  color: #343a40;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px; 
}

.code-editing-section {
  margin-top: 10px; /* Add some space above the code editing section */
}

.code-blocks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.edit-code-block-button {
  background-color: #007bff; /* Bootstrap primary blue */
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease-in-out;
  width: 100%; /* Make button full width */
  text-align: left;
}

.edit-code-block-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
}

.flow-properties .property-group input[type="text"],
.flow-properties .property-group textarea {
  background-color: #fff; /* Ensure these are white */
  border: 1px solid #ced4da;
}

.json-textarea {
  font-family: monospace;
  min-height: 100px; /* Adjust as needed */
}

.error-message {
  color: #dc3545; /* Bootstrap danger color */
  font-size: 12px;
  margin-top: 4px;
}

.shared-state-access-info.property-group span {
   background-color: #e9ecef; 
   color: #495057;
   padding: 8px 10px;
   border-radius: 4px;
   word-break: break-all; 
   border: 1px solid #ced4da;
}
.shared-state-access-info.property.group p {
  font-size: 13px;
  color: #6c757d;
  margin-top: 5px;
}

</style>
