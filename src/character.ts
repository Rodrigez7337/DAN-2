export interface Character {
  name: string;
  instruction: string;
}

export const characters: Character[] = await getCharacters();

async function getCharacters(): Promise<Character[]> {
  const characters: Character[] = [];
  const characterFilesPath = "./characters";
  for await (const entry of Deno.readDir(characterFilesPath)) {
    if (entry.isFile) {
      const filename = entry.name;
      const character: Character = {
        name: filename.slice(0, filename.lastIndexOf(".")),
        instruction: await Deno.readTextFile(
          `${characterFilesPath}/${filename}`,
        ),
      };
      characters.push(character);
    }
  }

  return characters;
}