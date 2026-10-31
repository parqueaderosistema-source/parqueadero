import { TipoVehiculoModel } from "../models/TipoVehiculo.js";
import { HttpError } from "../utils/httpError.js";
import { COLLATION_SIN_MAYUSCULAS, esErrorDuplicado } from "../utils/mongo.js";
import { registrarAuditoria } from "./auditoria.service.js";

const MENSAJE_DUPLICADO = "Ya existe un tipo de vehículo con ese nombre";

/**
 * .lean() no aplica los defaults del esquema: los tipos guardados
 * antes de existir permitePersonalizado no traen el campo.
 */
function conPermitePersonalizado<T extends { permitePersonalizado?: boolean | null }>(
  tipo: T,
) {
  return {
    ...tipo,
    permitePersonalizado: tipo.permitePersonalizado ?? false,
  };
}

/**
 * Busca otro tipo con el mismo nombre sin distinguir mayúsculas ni tildes.
 * Usa collation en lugar de una regex con el texto del usuario
 * (evita inyección de expresiones regulares).
 */
async function existeNombre(nombre: string, excluirId?: string) {
  const existente = await TipoVehiculoModel.findOne({
    nombre,
    ...(excluirId ? { _id: { $ne: excluirId } } : {}),
  })
    .collation(COLLATION_SIN_MAYUSCULAS)
    .select("_id")
    .lean();

  return existente !== null;
}

export async function obtenerTiposVehiculo() {
  const tipos = await TipoVehiculoModel.find().sort({ nombre: 1 }).lean();

  return tipos.map(conPermitePersonalizado);
}

export async function obtenerTiposVehiculoActivos() {
  const tipos = await TipoVehiculoModel.find({
    activo: true,
  })
    .sort({ nombre: 1 })
    .lean();

  return tipos.map(conPermitePersonalizado);
}

export async function crearTipoVehiculo(nombre: string, usuarioId: string) {
  const nombreNormalizado = nombre.trim();

  if (await existeNombre(nombreNormalizado)) {
    throw new HttpError(409, MENSAJE_DUPLICADO);
  }

  const tipo = await TipoVehiculoModel.create({
    nombre: nombreNormalizado,
    activo: true,
  }).catch((error: unknown) => {
    if (esErrorDuplicado(error)) {
      throw new HttpError(409, MENSAJE_DUPLICADO);
    }

    throw error;
  });

  await registrarAuditoria({
    usuarioId,
    accion: "TIPO_VEHICULO_CREADO",
    descripcion: `Tipo de vehículo creado: ${tipo.nombre}`,
    datos: { tipoVehiculoId: tipo._id, nombre: tipo.nombre },
  });

  return conPermitePersonalizado(tipo.toObject());
}

export async function actualizarTipoVehiculo(
  id: string,
  datos: {
    nombre?: string;
    activo?: boolean;
  },
  usuarioId: string,
) {
  const tipo = await TipoVehiculoModel.findById(id);

  if (!tipo) {
    throw new HttpError(404, "Tipo de vehículo no encontrado");
  }

  const nombreAnterior = tipo.nombre;

  if (datos.nombre !== undefined) {
    const nombreNormalizado = datos.nombre.trim();

    if (await existeNombre(nombreNormalizado, id)) {
      throw new HttpError(409, MENSAJE_DUPLICADO);
    }

    tipo.nombre = nombreNormalizado;
  }

  if (datos.activo !== undefined) {
    tipo.activo = datos.activo;
  }

  await tipo.save().catch((error: unknown) => {
    if (esErrorDuplicado(error)) {
      throw new HttpError(409, MENSAJE_DUPLICADO);
    }

    throw error;
  });

  await registrarAuditoria({
    usuarioId,
    accion: "TIPO_VEHICULO_ACTUALIZADO",
    descripcion: `Tipo de vehículo actualizado: ${tipo.nombre}`,
    datos: {
      tipoVehiculoId: tipo._id,
      nombreAnterior,
      cambios: datos,
    },
  });

  return conPermitePersonalizado(tipo.toObject());
}
