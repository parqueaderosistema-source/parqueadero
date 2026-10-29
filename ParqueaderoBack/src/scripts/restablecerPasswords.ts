import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { UsuarioModel } from "../models/Usuario.js";

async function establecerPasswords(): Promise<void> {
  try {
    await connectDatabase();

    const passwordAdmin = process.env.ADMIN_PASSWORD;

    const passwordTrabajador = process.env.TRABAJADOR_PASSWORD;

    if (!passwordAdmin) {
      throw new Error("ADMIN_PASSWORD no está configurada en .env");
    }

    if (!passwordTrabajador) {
      throw new Error("TRABAJADOR_PASSWORD no está configurada en .env");
    }

    if (passwordAdmin.length < 10) {
      throw new Error(
        "La contraseña del administrador debe tener mínimo 10 caracteres",
      );
    }

    if (passwordTrabajador.length < 10) {
      throw new Error(
        "La contraseña del trabajador debe tener mínimo 10 caracteres",
      );
    }

    const hashAdmin = await bcrypt.hash(passwordAdmin, 12);

    const hashTrabajador = await bcrypt.hash(passwordTrabajador, 12);

    const administrador = await UsuarioModel.findOneAndUpdate(
      {
        rol: "administrador",
      },
      {
        $set: {
          passwordHash: hashAdmin,
          activo: true,
        },
      },
      {
        new: true,
      },
    );

    const trabajador = await UsuarioModel.findOneAndUpdate(
      {
        rol: "trabajador",
      },
      {
        $set: {
          passwordHash: hashTrabajador,
          activo: true,
        },
      },
      {
        new: true,
      },
    );

    if (!administrador) {
      throw new Error("No se encontró la cuenta del administrador");
    }

    if (!trabajador) {
      throw new Error("No se encontró la cuenta del trabajador");
    }

    console.log("");
    console.log("Contraseñas establecidas correctamente");
    console.log("");
    console.log(`Administrador: ${administrador.correo}`);
    console.log(`Trabajador: ${trabajador.correo}`);
    console.log("");
    console.log(
      "Las contraseñas permanecerán iguales hasta que sean modificadas manualmente.",
    );
  } catch (error) {
    console.error("No fue posible establecer las contraseñas.");

    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

void establecerPasswords();
