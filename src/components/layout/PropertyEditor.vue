<template>
  <div class="property-editor">
    <h3>属性编辑</h3>
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
    <div v-else class="no-selection">
      <p>未选择任何节点</p>
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
import { computed, ref, watch } from 'vue';
import { useFlowStore } from '@/stores/flow';
import type { ParamSchemaItem, NodeDefinition, FlowNode } from '@/types/pocketflow-editor';
import { FormKitSchema } from '@formkit/vue';
import type { FormKitSchemaDefinition, FormKitNode, FormKitGroupValue, FormKitSchemaNode } from '@formkit/core';
import CodeEditorModal from '@/components/modals/CodeEditorModal.vue';

const flowStore = useFlowStore();

const selectedNode = computed(() => flowStore.selectedNode);
const selectedNodeDefinition = computed(() => flowStore.selectedNodeDefinition);
const formData = ref<Record<string, any>>({});

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
          paramsToUpdate[paramName] = newValues[paramName]; 
        }
      } else {
        paramsToUpdate[paramName] = newValues[paramName];
      }
    }
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

.property-group span {
  background-color: #e9ecef; 
  color: #495057;
  padding: 8px 10px;
  border-radius: 4px;
  word-break: break-all; 
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

/* Placeholder styling for the modal */
.code-editor-modal-placeholder {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 1000; /* Ensure it's above other content */
  min-width: 300px; /* Basic width */
  text-align: center;
}
</style>
