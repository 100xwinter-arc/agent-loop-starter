import { type InputsUnion1, type OpenAIResponsesRefusalContent, type OpenResponsesResult, type OutputFunctionCallItem, type OutputMessageItem, type OutputReasoningItem, type ResponseOutputText } from '@openrouter/sdk/models';

export function convertOutputItemToInput(
  item: OpenResponsesResult['output'][number],
): InputsUnion1 {
  if (isOutputMessageItem(item)) {
    const content = item.content.filter(isKnownMessageContent);
    if (content.length !== item.content.length) {
      throw new Error('Received an unsupported message content type');
    }
    return { ...item, content };
  }

  if (isFunctionCallOrReasoningItem(item)) {
    return item;
  }

  throw new Error(`Received an unexpected output item: ${item.type}`);
}

function isOutputMessageItem(
  item: OpenResponsesResult['output'][number],
): item is OutputMessageItem {
  return item.type === 'message';
}

function isKnownMessageContent(
  content: OutputMessageItem['content'][number],
): content is OpenAIResponsesRefusalContent | ResponseOutputText {
  return content.type === 'output_text' || content.type === 'refusal';
}

function isFunctionCallOrReasoningItem(
  item: OpenResponsesResult['output'][number],
): item is OutputFunctionCallItem | OutputReasoningItem {
  return item.type === 'function_call' || item.type === 'reasoning';
}
