import { Character, defaultCharacter } from "./character/character.ts";
import { Message } from "./openai/openai.ts";

// Define the shape of each Chat session.
export interface SessionData {
    character: Character;
    history: string; // TODO: will make use of retrieval plugin
    chatBuffer: Message[];
  }

// Define the initial session value.
export function createInitialSessionData(): SessionData {
    return {
      character: defaultCharacter,
      history: "",
      chatBuffer: [],
    };
  }