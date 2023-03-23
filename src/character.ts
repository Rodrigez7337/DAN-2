export interface Character {
    name: string;
    instruction: string;
}

export async function getCharacters(): Promise<Character[]> {
    const characters: Character[] = [];
    for await (const entry of Deno.readDir("./characters")) {
        if (entry.isFile) {
            const filename = entry.name;
            const characterName = filename.slice(0, filename.lastIndexOf("."));
            const character: Character = {
                name: characterName,
                instruction: await Deno.readTextFile(`./characters/${entry.name}`),
            }
            characters.push(character);
        }
    }

    return characters;
}