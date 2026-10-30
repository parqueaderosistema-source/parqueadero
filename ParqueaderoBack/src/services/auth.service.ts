import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { UsuarioModel } from "../models/Usuario.js";

/**
 * Devuelve los datos públicos del usuario de la sesión.
 * Retorna null si el id no es válido, el usuario no existe o está desactivado.
 */
export async function obtenerUsuarioActivoPorId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const usuario = await UsuarioModel.findOne({
    _id: id,
    activo: true,
  })
    .select("nombre correo rol")
    .lean();

  if (!usuario) {
    return null;
  }

  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}

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
