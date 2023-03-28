export interface Character {
  name: string;
  instruction: string;
}

export async function getCharacters(): Promise<Character[]> {
  const characters: Character[] = [];
  const characterFilesPath = "./src/character/characters";
  for await (const entry of Deno.readDir(characterFilesPath)) {
    if (entry.isFile) {
      const filename = entry.name;
      const characterName = filename.slice(0, filename.lastIndexOf("."));
      const character: Character = {
        name: characterName,
        instruction: await Deno.readTextFile(
          `${characterFilesPath}/${entry.name}`,
        ),
      };
      characters.push(character);
    }
  }

  return characters;
}

export const characters: Character[] = await getCharacters();
export const defaultCharacter: Character = characters.find((c) =>
  c.name === "DAN"
)!;
