import { Character } from "./character.ts";
import { Message } from "./openai/openai.ts";

// Define the shape of each Chat session.
export interface SessionData {
  character: Character;
  chatBuffer: Message[];
}
