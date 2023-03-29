import {
  Bot,
  Context,
  session,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import { botToken } from "../../config.ts";
import { fetchChatGPT, messagesToText } from "../openai/openai.ts";
import {
  Character,
  characters,
  defaultCharacter,
} from "../character/character.ts";
import { queue } from "../queue.ts";
import { createInitialSessionData, SessionData } from "../session.ts";

const CHAT_CONTEXT_SIZE = 4; // Number of older messages to keep in the chat buffer

// Flavor the context type to include sessions.
type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(botToken);

// Use the session middleware to keep track of chats
bot.use(session({ initial: createInitialSessionData }));

bot.command("start", async (ctx) => {
  ctx.session.character = defaultCharacter;
  ctx.session.chatBuffer = [];
  await ctx.reply(
    "Welcome to DAN, a chatbot powered by ChatGPT! As DAN, I am an AI assistant to help you with anything you need. I have many alter egos specialized at different tasks. To chat with any of them, click the buttons below. Enjoy!",
  );
  await displayCharacterOptions(ctx.chat.id, characters);
});

bot.command("character", async (ctx) => {
  await displayCharacterOptions(ctx.chat.id, characters);
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
  if (
    messageText &&
    (ctx.chat?.type === "private" ||
      ctx.message?.text?.includes(`@${bot.botInfo.username}`) ||
      ctx.message?.reply_to_message?.from?.id === bot.botInfo.id)
  ) {
    const chatId = ctx.chat.id;
    // Update the chat buffer with the user's message
    ctx.session.chatBuffer.push({
      role: "user",
      content: replyToMessageText
        ? `${replyToMessageText}\n\n${messageText}`
        : messageText,
    });
    // Add async tasks to the queue
    queue.push(async () => {
      // Show the typing indicator as the bot is generating a response
      await bot.api.sendChatAction(chatId, "typing");
      // Call the ChatGPT API to generate a response
      const completionText = await fetchChatGPT(
        ctx.session.chatBuffer,
        ctx.session.character.instruction,
      );
      // Reply to the user
      await bot.api.sendMessage(chatId, completionText);
      // Add response to the chat buffer
      ctx.session.chatBuffer.push({
        role: "assistant",
        content: completionText,
      });
      // Log the conversation
      console.log(
        `****Conversation ID: ${chatId}****\n${
          messagesToText(ctx.session.chatBuffer)
        }`,
      );
      // Update the buffer for the next run:
      const bufferLength = ctx.session.chatBuffer.length;
      if (bufferLength > CHAT_CONTEXT_SIZE) {
        ctx.session.chatBuffer.splice(
          0,
          bufferLength - CHAT_CONTEXT_SIZE,
        );
      }
    });
  }
});

export default bot;

async function displayCharacterOptions(
  chatId: number,
  characters: Character[],
) {
  await bot.api.sendMessage(chatId, "Choose a character:", {
    reply_markup: {
      inline_keyboard: characters.map(({ name }) => [
        { text: name, callback_data: name },
      ]),
    },
  });
}
