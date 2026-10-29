import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`Servidor ejecutándose en http://localhost:${port}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  }
}

void startServer();
