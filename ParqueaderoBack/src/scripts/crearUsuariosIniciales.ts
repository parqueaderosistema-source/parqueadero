import "dotenv/config";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { UsuarioModel } from "../models/Usuario.js";

function generarPassword(): string {
  return `${randomBytes(12).toString("base64url")}A1!`;
}

async function crearUsuariosIniciales(): Promise<void> {
  try {
    await connectDatabase();

    const administradorExistente = await UsuarioModel.findOne({
      rol: "administrador",
    });

    const trabajadorExistente = await UsuarioModel.findOne({
      rol: "trabajador",
    });

    if (administradorExistente && trabajadorExistente) {
      console.log("Los usuarios iniciales ya existen.");
      return;
    }

    if (!administradorExistente) {
      const passwordAdministrador = generarPassword();

      const passwordHash = await bcrypt.hash(passwordAdministrador, 12);

      await UsuarioModel.create({
        nombre: "Administrador",
        correo: process.env.ADMIN_EMAIL ?? "admin@parqueadero.com",
        passwordHash,
        rol: "administrador",
        activo: true,
      });

      console.log("");
      console.log("ADMINISTRADOR CREADO");
      console.log(
        `Correo: ${process.env.ADMIN_EMAIL ?? "admin@parqueadero.com"}`,
      );
      console.log(`Contraseña temporal: ${passwordAdministrador}`);
      console.log("");
    }

    if (!trabajadorExistente) {
      const passwordTrabajador = generarPassword();

      const passwordHash = await bcrypt.hash(passwordTrabajador, 12);

      await UsuarioModel.create({
        nombre: "Trabajador",
        correo: process.env.TRABAJADOR_EMAIL ?? "trabajador@parqueadero.com",
        passwordHash,
        rol: "trabajador",
        activo: true,
      });

      console.log("");
      console.log("TRABAJADOR CREADO");
      console.log(
        `Correo: ${
          process.env.TRABAJADOR_EMAIL ?? "trabajador@parqueadero.com"
        }`,
      );
      console.log(`Contraseña temporal: ${passwordTrabajador}`);
      console.log("");
    }
  } catch (error) {
    console.error("Error creando usuarios iniciales.");

    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

void crearUsuariosIniciales();
