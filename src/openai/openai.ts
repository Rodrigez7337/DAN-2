import { openaiKey } from "../../config.ts";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function fetchChatGPT(
  promptMessages: Array<Message>,
  temperature = 1,
): Promise<string | undefined> {
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
          messages: promptMessages,
          temperature: temperature,
        }),
      },
    );
    const data = await response.json();
    const messageText = data.choices[0].message.content;
    if (!messageText) {
      throw new Error("No message text returned from OpenAI API!");
    }
    return messageText;
  } catch (error) {
    console.log(error);
  }
}
