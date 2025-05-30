import { AbstractNodeDefinition } from "./AbstractNodeDefinition";
import type { ParamSchemaItem, NodeInputDefinition, NodeOutputDefinition, CodeBlockDefinition } from "@/types/pocketflow-editor";

export class PfAsyncNodeDefinition extends AbstractNodeDefinition {
  // Explicitly define properties to satisfy the abstract class requirements
  readonly inputs: NodeInputDefinition[];
  readonly outputs: NodeOutputDefinition[];
  readonly defaultSize: { width: number; height: number }; // Use inline type
  readonly sharedStateAccess?: { reads?: string[]; writes?: string[] };

  constructor(
    type: string,
    label:string,
    category: string,
    description: string = "",
    paramSchema: Record<string, ParamSchemaItem> = {},
    defaultParams: Record<string, any> = {},
    icon: string = "",
    inputs: NodeInputDefinition[] = [{ id: 'input_default_async', label: 'Input', type: 'data', position: { side: 'left' } }], 
    outputs: NodeOutputDefinition[] = [{ id: 'output_default_async', label: 'Output', type: 'data', position: { side: 'right' } }], 
    defaultSize: { width: number; height: number } = { width: 200, height: 180 }, // Use inline type
    sharedStateAccess?: { reads?: string[]; writes?: string[] } // Added parameter
  ) {
    super({
      type,
      label,
      pocketflowClass: 'AsyncNode', // Explicitly AsyncNode
      category,
      description,
      paramSchema,
      defaultParams,
      icon,
      supportsCodeEditing: true,
      codeBlocksDefinition: [
        { 
          name: 'prep_async', 
          label: 'Prep Logic (Async)', 
          language: 'python', 
          defaultCode: 'async def prep_async(self, shared_state):\n    # Prepare inputs for exec_async method.\n    # Access shared_state dictionary, e.g., shared_state["my_data"]\n    # Return data for exec_async, or None to skip exec_async.\n    # print(f"Node {self.id} ({self.type}): Executing prep_async, shared_state: {shared_state}")\n    # Example: data = await some_async_operation()\n    return None'
        },
        { 
          name: 'exec_async', 
          label: 'Exec Logic (Async)', 
          language: 'python', 
          defaultCode: 'async def exec_async(self, inputs):\n    # Main asynchronous execution logic.\n    # \'inputs\' is the data returned from prep_async or the previous node.\n    # print(f"Node {self.id} ({self.type}): Executing exec_async, inputs: {inputs}")\n    # Example: result = await another_async_operation(inputs)\n    # Return result or None.\n    return inputs'
        },
        { 
          name: 'post_async', 
          label: 'Post Logic (Async)', 
          language: 'python', 
          defaultCode: 'async def post_async(self, shared_state, prep_res, exec_res):\n    # Asynchronous post-processing logic.\n    # Update shared_state dictionary.\n    # Determine the next step/output port, e.g., return "next_port_name" or "end".\n    # \'prep_res\' is the result from prep_async, \'exec_res\' is the result from exec_async.\n    # print(f"Node {self.id} ({self.type}): Executing post_async, prep_res: {prep_res}, exec_res: {exec_res}")\n    # Example: await shared_state["some_queue"].put(exec_res)\n    return "end" # or "continue", or any other defined output port'
        }
      ],
      inputs, // Pass to super
      outputs, // Pass to super
      defaultSize, // Pass to super
      sharedStateAccess, // Pass to super
    });
    this.inputs = inputs;
    this.outputs = outputs;
    this.defaultSize = defaultSize;
    this.sharedStateAccess = sharedStateAccess; // Initialize the property
  }
}