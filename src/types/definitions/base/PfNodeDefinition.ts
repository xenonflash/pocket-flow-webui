import { AbstractNodeDefinition } from "./AbstractNodeDefinition";
import type { ParamSchemaItem, NodeInputDefinition, NodeOutputDefinition, CodeBlockDefinition } from "@/types/pocketflow-editor";

export class PfNodeDefinition extends AbstractNodeDefinition {
  // Explicitly define properties to satisfy the abstract class requirements
  readonly inputs: NodeInputDefinition[];
  readonly outputs: NodeOutputDefinition[];
  readonly defaultSize: { width: number; height: number }; // Use inline type
  readonly sharedStateAccess?: { reads?: string[]; writes?: string[] };

  constructor(
    type: string,
    label: string,
    category: string,
    description: string = "",
    paramSchema: Record<string, ParamSchemaItem> = {},
    defaultParams: Record<string, any> = {},
    icon: string = "",
    isAsync: boolean = false,
    inputs: NodeInputDefinition[] = [{ id: 'input_default', label: 'Input', type: 'data', position: { side: 'left' }}], // Modified default input
    outputs: NodeOutputDefinition[] = [{ id: 'output_default', label: 'Output', type: 'data', position: { side: 'right' }}], // Modified default output
    defaultSize: { width: number; height: number } = { width: 200, height: 150 }, // Use inline type
    sharedStateAccess?: { reads?: string[]; writes?: string[] } // Added parameter
  ) {
    super({
      type,
      label,
      pocketflowClass: isAsync ? 'AsyncNode' : 'Node', // Determine based on isAsync
      category,
      description,
      paramSchema,
      defaultParams,
      icon,
      supportsCodeEditing: true, 
      codeBlocksDefinition: [
        { 
          name: 'prep', 
          label: 'Prep Logic', 
          language: 'python', 
          defaultCode: 'def prep(self, shared_state):\n    # Prepare inputs for exec method.\n    # Access shared_state dictionary, e.g., shared_state["my_data"]\n    # Return data for exec, or None to skip exec.\n    # print(f"Node {self.id} ({self.type}): Executing prep, shared_state: {shared_state}")\n    return None'
        },
        { 
          name: 'exec', 
          label: 'Exec Logic', 
          language: 'python', 
          defaultCode: 'def exec(self, inputs):\n    # Main execution logic.\n    # \'inputs\' is the data returned from prep or the previous node.\n    # print(f"Node {self.id} ({self.type}): Executing exec, inputs: {inputs}")\n    # Return result or None.\n    return inputs'
        },
        { 
          name: 'post', 
          label: 'Post Logic', 
          language: 'python', 
          defaultCode: 'def post(self, shared_state, prep_res, exec_res):\n    # Post-processing logic.\n    # Update shared_state dictionary.\n    # Determine the next step/output port, e.g., return "next_port_name" or "end".\n    # \'prep_res\' is the result from prep, \'exec_res\' is the result from exec.\n    # print(f"Node {self.id} ({self.type}): Executing post, prep_res: {prep_res}, exec_res: {exec_res}")\n    # Example: shared_state["processed_data"] = exec_res\n    return "end" # or "continue", or any other defined output port'
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