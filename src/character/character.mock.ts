import { Character, getCharacters } from "./character.ts";

const characters: Character[] = await getCharacters();
console.log(characters);
