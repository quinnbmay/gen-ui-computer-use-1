import { createCua, CUAState, CUAUpdate } from "@langchain/langgraph-cua";

async function beforeNode(state: CUAState): Promise<CUAUpdate> {
  console.log("EXECUTING BEFORE");
  return {};
}

async function afterNode(state: CUAState): Promise<CUAUpdate> {
  console.log("EXECUTING AFTER");
  return {};
}

export const graph = createCua({
  nodeBeforeAction: beforeNode,
  nodeAfterAction: afterNode,
});
