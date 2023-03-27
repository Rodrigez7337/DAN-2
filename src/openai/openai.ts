import { openaiKey } from "../../config.ts";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function fetchChatGPT(
  promptMessages: Array<Message>,
  systemPrompt?: string,
  temperature = 1,
): Promise<string> {
  const messages = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...promptMessages]
    : promptMessages;
  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: temperature,
        }),
      },
    );
    if (response.ok) {
      const data = await response.json();
      const messageText = data.choices[0].message.content;
      return messageText;
    } else {
      console.log(messages);
      console.log(response);
      throw new Error("Could not fetch response from OpenAI");
    }
  } catch (error) {
    console.log(error);
  }
  return "Something went wrong! 😕";
}

export function messagesToText(messages: Message[]): string {
  return messages.map((message) => {
    if (message.role === "assistant") {
      return `You: ${message.content}`;
    } else if (message.role === "user") {
      return `${message.role}: ${message.content}`;
    }
  }).filter(Boolean).join("\n");
}
