import { Bot, Context, MemorySessionStorage, session, SessionFlavor } from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import { Queue } from "https://deno.land/x/datastructure@1.2.1/queue/queue.ts";
import { botToken } from "../config.ts";
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

// create a queue for webhook tasks
const webhookQueue = new Queue();

// Use the session middleware to keep track of chats
bot.use(session({
  initial: createInitialSessionData,
  storage: new MemorySessionStorage(30 * 60 * 1000) // session data gets deleted after 30 min of inactivity
}));

bot.command("start", async (ctx) => {
  await ctx.reply("Welcome to DAN, a chatbot powered by ChatGPT! As DAN, I am an AI assistant to help you with anything you need. I have many alter egos specialized at different tasks. To chat with any of them, click the buttons below. Enjoy!");
  await displayCharacterOptions(ctx.chat.id, characters);
});

bot.command("chooseCharacter", async (ctx) => {
  await displayCharacterOptions(ctx.chat.id, characters);
});

bot.on("callback_query:data", async (ctx) => {
  const characterName = ctx.callbackQuery.data;
  ctx.session = resetCharacter(characters.find((c) => c.name === characterName)!);
  await ctx.reply(`I am now ${ctx.session.character.name}!`);
});

// Listen for messages
bot.on("message", (ctx) => {
  const messageText = ctx.message?.text?.trim();
  if (messageText) {
    const chatId = ctx.chat.id;
    const chat = ctx.session;
    // Update the chat buffer with the user's message
    chat.chatBuffer.push({ role: "user", content: messageText });
    // Add a new task to the queue with the chat data
    webhookQueue.enqueue({ key: chatId, value: chat });
    }
});

export default bot;

// call the worker function periodically
setInterval(processWebhookTask, 1000);


// Define the initial session value.
function createInitialSessionData(): SessionData {
  return {
    character: defaultCharacter,
    history: "",
    chatBuffer: []
  };
}

// Reset the session data when the user chooses a new character
function resetCharacter(character: Character): SessionData {
  return {
    character: character || defaultCharacter,
    history: "",
    chatBuffer: []
  }
}

async function displayCharacterOptions(chatId: number, characters: Character[]) {
  await bot.api.sendMessage(chatId, "Choose a character:", {
    reply_markup: {
      inline_keyboard: characters.map(({name}) => [
        { text: name, callback_data: name },
      ]),
    },
  });
}

// create a worker function that processes tasks from the queue
async function processWebhookTask() {
  // get and remove the front element of the queue
  const dq = webhookQueue.dequeue();
  // check if the queue is not empty
  if (dq) {
    const { key: chatId, value: chat } = dq;
    // Show the typing indicator as the bot is generating a response
    await bot.api.sendChatAction(chatId, "typing");
    // Call the ChatGPT API to generate a response
    const completionText = await fetchChatGPTWithMemory(chat);
    // Reply to the user
    await bot.api.sendMessage(chatId, completionText);
    // Add response to the chat buffer
    chat.chatBuffer.push({ role: "assistant", content: completionText });
    // Update the buffer for the next run and generate history with the older messages
    const bufferLength = chat.chatBuffer.length;
    if ( bufferLength > CHAT_CONTEXT_SIZE) {
      const oldMessages = chat.chatBuffer.splice(0, bufferLength - CHAT_CONTEXT_SIZE); // Remove the oldest messages and save them for summarization
      chat.history = await summarizeConversation(chat.history, oldMessages); // Update history
    }
    // Log the conversation
    console.log(`****Conversation ID: ${chatId}****`);
    if (chat.history) console.log("Summary: " + chat.history);
    console.log(messagesToText(chat.chatBuffer));
  }
}