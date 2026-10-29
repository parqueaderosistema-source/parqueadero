import dns from "node:dns";
import mongoose from "mongoose";

// DNS públicos para evitar problemas de resolución SRV en algunas redes
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI no está configurada");
  }

  await mongoose.connect(mongoUri);

  console.log("MongoDB conectado correctamente");
}
