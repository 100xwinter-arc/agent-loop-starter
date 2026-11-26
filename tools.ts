import { type ResponsesRequestToolFunction } from '@openrouter/sdk/models';

export const bashExecute = async (command: string, cwd: string) => {
  console.log("running command " + command);
  try {
    const result = await Bun.$`bash -lc ${command}`
    .cwd(cwd)
    const stdout = result.stdout.toString();

    return {
      stdout
    };
  } catch(e) {
    return {
      stdout: "",
      stderr: "Error while running command"
    }
  }
}

export const tools: ResponsesRequestToolFunction[] = [
  {
    type: "function",
    name: "bash",
    description: "Runs a bash command",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to run"
        }
      },
      required: ["command"]
    }
  }
]
