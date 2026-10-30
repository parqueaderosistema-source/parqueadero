import dns from "node:dns";
import mongoose from "mongoose";

import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  // Solo si se configuró: cambia el DNS de todo el proceso.
  if (env.MONGODB_DNS_SERVERS.length > 0) {
    dns.setServers(env.MONGODB_DNS_SERVERS);
  }

  await mongoose.connect(env.MONGODB_URI);

  console.log("MongoDB conectado correctamente");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
