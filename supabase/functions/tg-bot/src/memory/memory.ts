import { fetchChatGPT, Message } from "../openai/openai.ts";
import { SessionData } from "../bot.ts";


export function messagesToText(messages: Message[]): string {
  return messages.map((message) => {
    if (message.role === "assistant") {
      return `You: ${message.content}`;
    } else if (message.role === "user") {
      return `${message.role}: ${message.content}`;
    }
  }).filter(Boolean).join("\n");
}

export async function summarizeConversation(
  summary: string,
  newMessages: Message[],
): Promise<string> {
  const newMessageText = messagesToText(newMessages);
  const completionText = await fetchChatGPT([
    {
      role: "system",
      content:
        `Progressively summarize the conversation provided, adding onto the previous summary returning a new summary.
        Current summary: ${summary}
        New lines of conversation:
        ${newMessageText}
        
        New summary:
        `,
    },
  ]);
  return completionText!;
}

export async function fetchChatGPTWithMemory(
  { chatBuffer, history, character }: SessionData,
): Promise<string> {
  let systemPrompt = character.system_instruction;
  if (history) {
    systemPrompt +=
      `
      \nThe following is a history of the conversation between you and a user. You provides lots of specific details from this context.
      \n${history}
      `;
  }
  const messages: Message[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push(...chatBuffer);
  const completionText = await fetchChatGPT(messages);
  return completionText!;
}
