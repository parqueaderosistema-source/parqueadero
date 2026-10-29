import bcrypt from "bcryptjs";

import { UsuarioModel } from "../models/Usuario.js";

export async function autenticarUsuario(correo: string, password: string) {
  const usuario = await UsuarioModel.findOne({
    correo: correo.toLowerCase().trim(),
  }).select("+passwordHash");

  if (!usuario) {
    return null;
  }

  if (!usuario.activo) {
    return null;
  }

  const passwordCorrecta = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordCorrecta) {
    return null;
  }

  usuario.ultimoAcceso = new Date();
  await usuario.save();

  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}
