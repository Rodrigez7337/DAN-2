import { Context, SessionFlavor } from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import { SessionData } from "../src/session.ts";

// Flavor the context type to include sessions.
export type MyContext = Context & SessionFlavor<SessionData>;