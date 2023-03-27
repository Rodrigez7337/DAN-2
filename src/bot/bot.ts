import {
  Bot,
  Context,
  session,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import { freeStorage } from "https://deno.land/x/grammy_storages@v2.1.4/free/src/mod.ts";
import { botToken } from "../../config.ts";
import { fetchChatGPT, messagesToText } from "../openai/openai.ts";
import { Character, characters } from "../character/character.ts";
import { queue } from "../queue.ts";
import { createInitialSessionData, SessionData } from "../session.ts";


const CHAT_CONTEXT_SIZE = 2; // Number of older messages to keep in the chat buffer

// Flavor the context type to include sessions.
type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(botToken);

// Use the session middleware to keep track of chats
bot.use(session({
  initial: createInitialSessionData,
  storage: freeStorage<SessionData>(bot.token),
}));

bot.command("start", async (ctx) => {
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
  const character = characters.find((c) => c.name === characterName)!;
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
    const chat = ctx.session;
    // Update the chat buffer with the user's message
    chat.chatBuffer.push({
      role: "user",
      content: replyToMessageText
        ? `"${replyToMessageText}"\n${messageText}`
        : messageText,
    });
    queue.enqueue({ key: chatId, value: chat });
  }
});

setInterval(async ()=>{
  await processQueuedTasks();
}, 1000);

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

async function processQueuedTasks() {
  // get and remove the front element of the queue
  const dq = queue.dequeue();
  // Run if the queue is not empty:
  if(dq) {
    const { key: chatId, value: chat } = dq as {
      key: number;
      value: SessionData;
    };
    // Show the typing indicator as the bot is generating a response
    await bot.api.sendChatAction(chatId, "typing");
    // Call the ChatGPT API to generate a response
    const completionText = await fetchChatGPT(
      chat.chatBuffer,
      chat.character.instruction
    );
    // Reply to the user
    await bot.api.sendMessage(chatId, completionText);
    // Add response to the chat buffer
    chat.chatBuffer.push({ role: "assistant", content: completionText });
    // Update the buffer for the next run and generate history with the older messages
    const bufferLength = chat.chatBuffer.length;
    if(bufferLength > CHAT_CONTEXT_SIZE) {
      chat.chatBuffer.splice(
        0,
        bufferLength - CHAT_CONTEXT_SIZE
      ); // Remove the oldest messages
    }
    // Log the conversation
    console.log(`****Conversation ID: ${chatId}****`);
    if(chat.history) {
      console.log("Summary: " + chat.history);
    }
    console.log(messagesToText(chat.chatBuffer));
  }
}