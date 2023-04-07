import {
  Bot,
  MemorySessionStorage,
  session,
} from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import {
  Context,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import { SessionData } from "./session.ts";
import { botToken } from "../config.ts";
import { fetchChatGPT, Message, messagesToText } from "./openai/openai.ts";
import { Character, characters } from "./character.ts";
import { queue } from "./queue.ts";

const MAX_CONTEXT_SIZE = 3; // Number of messages to keep in the chat buffer

const defaultCharacter: Character = characters.find((c) => c.name === "DAN")!;

// Define the initial session value.
export function createInitialSessionData(): SessionData {
  return {
    character: defaultCharacter,
    chatBuffer: [],
  };
}

// Flavor the context type to include sessions.
export type MyContext = Context & SessionFlavor<SessionData>;

// Create bot and register session middleware
const bot = new Bot<MyContext>(botToken);
bot.use(session({
  initial: createInitialSessionData,
  storage: new MemorySessionStorage(),
}));

bot.command("start", async (ctx) => {
  ctx.session.character = defaultCharacter;
  ctx.session.chatBuffer = [];
  await ctx.reply(await fetchChatGPT(ctx.session));
});

bot.command("character", async (ctx) => {
  await ctx.reply("Choose a character:", {
    reply_markup: {
      inline_keyboard: characters.map(({ name }) => [
        { text: name, callback_data: name },
      ]),
    },
  });
});

bot.on("callback_query:data", async (ctx) => {
  const characterName = ctx.callbackQuery.data;
  const character = characters.find((c) => c.name === characterName) ||
    defaultCharacter;
  ctx.session.character = character;
  ctx.session.chatBuffer = [];
  await ctx.reply(`I am now ${ctx.session.character.name}!`);
});

bot.on("message", (ctx) => {
  const messageText = ctx.message?.text?.trim();
  const replyToMessageText = ctx.message?.reply_to_message?.text?.trim();
  const isPrivateChat = ctx.chat?.type === "private";
  const isReplyTobot =
    ctx.message?.reply_to_message?.from?.id === bot.botInfo.id;
  const isBotTagged = ctx.message?.text?.includes(`@${bot.botInfo.username}`);
  if (messageText && (isPrivateChat || isBotTagged || isReplyTobot)) {
    // Add tasks to the queue
    queue.push(async () => {
      const chatId = ctx.chat.id;
      const session = ctx.session;
      // Update the buffer for chat context:
      if (replyToMessageText) {
        const quotedMessage: Message = {
          role: isReplyTobot ? "assistant" : "user",
          content: replyToMessageText,
        };
        if (!session.chatBuffer.includes(quotedMessage)) {
          session.chatBuffer.push(quotedMessage);
        }
      }
      session.chatBuffer.push({
        role: "user",
        content: messageText,
      });
      const bufferLength = session.chatBuffer.length;
      if (bufferLength > MAX_CONTEXT_SIZE) {
        session.chatBuffer.splice(
          0,
          bufferLength - MAX_CONTEXT_SIZE,
        );
      }
      // Show the typing indicator as the bot is generating a response
      await bot.api.sendChatAction(chatId, "typing");
      // Call the ChatGPT API to generate a response
      const completionText = await fetchChatGPT(session);
      // Reply to the user
      await bot.api.sendMessage(chatId, completionText);
      // Store the response
      session.chatBuffer.push({
        role: "assistant",
        content: completionText,
      });
      // Log the conversation
      console.log(
        `****Conversation ID: ${chatId}****\n${
          messagesToText(session.chatBuffer)
        }`,
      );
    });
  }
});

export default bot;
