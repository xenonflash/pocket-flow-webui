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

      <h4 v-if="formSchema.length > 0">参数</h4>
      <FormKit
        type="form"
        v-model="formData"
        :actions="false"
        @input="handleFormInput"
        #default="{ value }"
      >
        <FormKitSchema :schema="formSchema" :data="formData" />
      </FormKit>
       <!-- Debugging: Display form data -->
       <!-- <pre>{{ value }}</pre> -->
    </div>
    <div v-else class="no-selection">
      <p>未选择任何节点</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFlowStore } from '@/stores/flow';
import type { ParamSchemaItem, NodeDefinition } from '@/types/pocketflow-editor';
import { FormKitSchema } from '@formkit/vue';
import type { FormKitSchemaDefinition, FormKitNode, FormKitGroupValue } from '@formkit/core';

const flowStore = useFlowStore();

const selectedNode = computed(() => flowStore.selectedNode);
const selectedNodeDefinition = computed(() => flowStore.selectedNodeDefinition);
const formData = ref<Record<string, any>>({});

const mapParamTypeToFormKitType = (paramType: ParamSchemaItem['type']): string => {
  switch (paramType) {
    case 'string':
      return 'text';
    case 'number':
      return 'number';
    case 'boolean':
      return 'checkbox';
    case 'select':
      return 'select';
    case 'textarea':
      return 'textarea';
    case 'json':
      return 'textarea'; // FormKit doesn't have a built-in JSON editor, use textarea
    default:
      return 'text';
  }
};

const formSchema = computed<FormKitSchemaDefinition[]>(() => {
  if (!selectedNodeDefinition.value || !selectedNodeDefinition.value.paramSchema) {
    return [];
  }
  const schemaRecord = selectedNodeDefinition.value.paramSchema as Record<string, ParamSchemaItem>;
  
  return Object.entries(schemaRecord).map(([name, schema]) => {
    const formKitType = mapParamTypeToFormKitType(schema.type);
    const definition: FormKitSchemaDefinition & { help?: string, label: string, name: string, validation?: string, options?: any[], placeholder?: string, rows?: number } = {
      $formkit: formKitType,
      name: name,
      label: schema.label || name,
      help: schema.description,
      placeholder: schema.placeholder,
    };

    if (schema.validation) {
      const rules: string[] = [];
      if (schema.required) rules.push('required');
      if (schema.validation.min !== undefined) rules.push(`min:${schema.validation.min}`);
      if (schema.validation.max !== undefined) rules.push(`max:${schema.validation.max}`);
      if (schema.validation.minLength !== undefined) rules.push(`length:${schema.validation.minLength},*`);
      if (schema.validation.maxLength !== undefined) rules.push(`length:*,${schema.validation.maxLength}`);
      if (schema.validation.pattern) rules.push(`matches:${schema.validation.pattern}`);
      // Custom validation is not directly translatable to FormKit string rules easily.
      // For more complex scenarios, FormKit custom validation functions would be needed.
      if (rules.length > 0) {
        definition.validation = rules.join('|');
      }
    }
     if (schema.type === 'select' && schema.options) {
      definition.options = schema.options;
    }
    if (schema.type === 'textarea' && schema.rows) {
      definition.rows = schema.rows;
    }
    if (schema.type === 'json') {
      // Add a note that this should be valid JSON
      definition.help = `${schema.description || ''} (请输入有效的 JSON)`.trim();
    }

    return definition;
  });
});

watch(selectedNode, (newNode, oldNode) => {
  if (newNode && newNode.id !== oldNode?.id) {
    // Initialize formData when a new node is selected
    const newFormData: Record<string, any> = {};
    if (selectedNodeDefinition.value && selectedNodeDefinition.value.paramSchema) {
      const schemaRecord = selectedNodeDefinition.value.paramSchema as Record<string, ParamSchemaItem>;
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
  } else if (!newNode) {
    formData.value = {}; // Clear form data if no node is selected
  }
}, { immediate: true });


const handleFormInput = (newValues: FormKitGroupValue | undefined, _node?: FormKitNode) => {
  if (selectedNode.value && selectedNodeDefinition.value && newValues) {
    const paramsToUpdate: Record<string, any> = {};
    const schemaRecord = selectedNodeDefinition.value.paramSchema as Record<string, ParamSchemaItem>;

    for (const paramName in newValues) {
      const schemaItem = schemaRecord[paramName];
      if (schemaItem && schemaItem.type === 'json') {
        try {
          // Allow empty string to clear a JSON param (becomes undefined or handled by backend)
          const parsedValue = newValues[paramName] && (newValues[paramName] as string).trim() !== '' ? JSON.parse(newValues[paramName] as string) : undefined;
          paramsToUpdate[paramName] = parsedValue;
        } catch (e) {
          console.warn(`Invalid JSON for param ${paramName}:`, newValues[paramName]);
          // Optionally, set an error state or keep the old value
          // For now, we'll just not update this specific param if JSON is invalid
          // Or, we can pass the raw string and let a FormKit validation rule handle it
          paramsToUpdate[paramName] = newValues[paramName]; // Or skip update: continue;
        }
      } else {
        paramsToUpdate[paramName] = newValues[paramName];
      }
    }
    if (Object.keys(paramsToUpdate).length > 0) {
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
</style>
