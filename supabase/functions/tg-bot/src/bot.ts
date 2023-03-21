import { botToken } from "../config.ts";
import { Bot, CommandContext, Context, session, SessionFlavor } from "https://deno.land/x/grammy@v1.14.1/mod.ts";
import { freeStorage } from "https://deno.land/x/grammy_storages@v2.1.4/free/src/mod.ts";
import {
  fetchChatGPTWithMemory,
  messagesToText,
  summarizeConversation,
} from "./memory/memory.ts";
import { Message } from "./openai/openai.ts";
import { Character, getCharacters } from "./supabase.ts";

// Define the shape of each Chat session.
export interface SessionData {
  character: Character;
  history: string;
  chatBuffer: Message[];
}


const characters: Character[] = await getCharacters() as Character[];
const defaultCharacter: Character = characters.find((c) => c.name === "DAN")!;

const CHAT_CONTEXT_SIZE = 2; // Number of older messages to keep in the chat buffer

// Flavor the context type to include sessions.
type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(botToken);

// Use session middleware, and define the initial session value.
function createInitialSessionData(): SessionData {
  return {
    character: defaultCharacter,
    history: "",
    chatBuffer: []
  };
}

bot.use(session({
  initial: createInitialSessionData,
  storage: freeStorage<SessionData>(bot.token)
}));

bot.command("start", async (ctx) => {
  await ctx.reply("Welcome to DAN, a chatbot powered by ChatGPT! As DAN, I am an AI assistant to help you with anything you need. I have many alter egos specialized at different tasks. To chat with any of them, click the buttons below. Enjoy!");
  await displayCharacterOptions(ctx, characters);
});

bot.command("character", async (ctx) => {
  await displayCharacterOptions(ctx, characters);
});

bot.on("callback_query:data", async (ctx) => {
  const characterName = ctx.callbackQuery.data;
  ctx.session.character = characters.find((c) => c.name === characterName)!;
  await ctx.reply(`I am now ${ctx.session.character.name}!`);
  ctx.session.history = "";
  ctx.session.chatBuffer = [];
});

// Listen for messages
bot.on("message", async (ctx) => {
  const messageText = ctx.message?.text?.trim();
  if (messageText) {
    const chatId = ctx.chat.id;
    // Update the chat buffer with the user's message
    ctx.session.chatBuffer.push({ role: "user", content: messageText });
    // Show the typing indicator as the bot is generating a response
    await ctx.api.sendChatAction(chatId, "typing");
    // Call the ChatGPT API to generate a response
    const completionText = await fetchChatGPTWithMemory(ctx.session);
    // Reply to the user
    await ctx.reply(completionText);
    // Add response to the chat buffer
    ctx.session.chatBuffer.push({ role: "assistant", content: completionText });
    // Update the buffer for the next run and generate history with the older messages
    const bufferLength = ctx.session.chatBuffer.length;
    if ( bufferLength > CHAT_CONTEXT_SIZE) {
      const oldMessages = ctx.session.chatBuffer.splice(0, bufferLength - CHAT_CONTEXT_SIZE); // Remove the oldest messages and save them for summarization
      ctx.session.history = await summarizeConversation(ctx.session.history, oldMessages); // Update history
    }
    // Log the conversation
    console.log("*********************");
    console.log("Conversation ID: " + chatId);
    if (ctx.session.history) console.log("Summary: " + ctx.session.history);
    console.log(messagesToText(ctx.session.chatBuffer));
  }
});

export default bot;


async function displayCharacterOptions(ctx: CommandContext<Context>, characters: Character[]) {
  await ctx.reply("Choose a character:", {
    reply_markup: {
      inline_keyboard: characters.map(({name}) => [
        { text: name, callback_data: name },
      ]),
    },
  });
}