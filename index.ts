import { OpenRouter } from '@openrouter/sdk';
import { type InputsUnion1, type OpenResponsesResult } from '@openrouter/sdk/models';
import { bashExecute, tools } from './tools';
import { convertOutputItemToInput } from './convert';
import { systemPrompt } from './prompt';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const repoPath = resolve(Bun.argv[2] ?? process.cwd());

if (!existsSync(repoPath)) {
  console.error("Path does not exist: " + repoPath);
  process.exit(1);
}

console.log("Working in " + repoPath);

const client = new OpenRouter({
  apiKey: process.env.API_KEY,
});

const inputs: InputsUnion1[] = []

const runAgent = async () => {
  while(1) {
    const stream = await client.responses.send({
      responsesRequest: {
        model: 'openai/gpt-5.2',
        instructions: systemPrompt(repoPath),
        input: inputs,
        stream: true,
        tools
      },
    });

    let response: OpenResponsesResult | undefined;

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        process.stdout.write(event.delta);
      }
      if (event.type === "response.completed") {
        response = event.response;
      }
    }

    if (!response) {
      throw new Error("Stream ended without a completed response");
    }

    inputs.push(...response.output.map(convertOutputItemToInput))

    const toolcalls = response.output.filter(x => x.type === "function_call")

    if (toolcalls.length === 0) {
      process.stdout.write("\n");
      break;
    }

    for (const toolcall of toolcalls) {
      if (toolcall.name != "bash") {
        throw new Error("Tool not found")
      }

      const command = JSON.parse(toolcall.arguments).command;
      const bashResult = await bashExecute(command, repoPath);
      inputs.push({
        type: 'function_call_output',
        callId: toolcall.callId,
        output: JSON.stringify(bashResult),
      });
    }
  }
}

process.stdout.write("> ");
for await (const line of console) {
  if (line.trim() === "") {
    process.stdout.write("> ");
    continue;
  }

  inputs.push({
    content: line,
    role: "user"
  })

  await runAgent();
  process.stdout.write("\n> ");
}
