import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import type { Rol } from "../config/roles.js";
import { UsuarioModel } from "../models/Usuario.js";

export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}

/**
 * Hash de una contraseña que nadie conoce. Se compara cuando el correo
 * no existe para que la respuesta tarde lo mismo y no revele
 * qué correos están registrados.
 */
const HASH_FICTICIO = bcrypt.hashSync("parqueadero-usuario-inexistente", 12);

function aUsuarioSesion(usuario: {
  _id: Types.ObjectId;
  nombre: string;
  correo: string;
  rol: Rol;
}): UsuarioSesion {
  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}

/**
 * Devuelve los datos públicos del usuario de la sesión.
 * Retorna null si el id no es válido, el usuario no existe o está desactivado.
 */
export async function obtenerUsuarioActivoPorId(
  id: string,
): Promise<UsuarioSesion | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const usuario = await UsuarioModel.findOne({
    _id: id,
    activo: true,
  })
    .select("nombre correo rol")
    .lean();

  return usuario ? aUsuarioSesion(usuario) : null;
}

export async function autenticarUsuario(
  correo: string,
  password: string,
): Promise<UsuarioSesion | null> {
  const usuario = await UsuarioModel.findOne({
    correo: correo.toLowerCase().trim(),
  }).select("+passwordHash");

  const passwordCorrecta = await bcrypt.compare(
    password,
    usuario?.passwordHash ?? HASH_FICTICIO,
  );

  if (!usuario || !usuario.activo || !passwordCorrecta) {
    return null;
  }

  usuario.ultimoAcceso = new Date();
  await usuario.save();

  return aUsuarioSesion(usuario);
}
