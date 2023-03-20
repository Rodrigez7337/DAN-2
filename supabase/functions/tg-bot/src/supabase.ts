import { Database } from "./database.types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";
import { supabaseKey, supabaseUrl } from "../config.ts";

export type Character = Database["public"]["Tables"]["characters"]["Row"];

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
 );

export async function getCharacters() {
  const { data: characters } = await supabase
  .from('characters')
  .select('*')
  .order('name', { ascending: true }); 
  // const characterList = characters!.map((c) => c.name);
  return characters;
}