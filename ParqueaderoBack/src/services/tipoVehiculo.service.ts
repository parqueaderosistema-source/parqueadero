import { TipoVehiculoModel } from "../models/TipoVehiculo.js";

export async function obtenerTiposVehiculo() {
  return TipoVehiculoModel.find().sort({ nombre: 1 }).lean();
}

export async function obtenerTiposVehiculoActivos() {
  return TipoVehiculoModel.find({
    activo: true,
  })
    .sort({ nombre: 1 })
    .lean();
}

export async function crearTipoVehiculo(nombre: string) {
  const nombreNormalizado = nombre.trim();

  const existente = await TipoVehiculoModel.findOne({
    nombre: {
      $regex: `^${nombreNormalizado}$`,
      $options: "i",
    },
  });

  if (existente) {
    throw new Error("Ya existe un tipo de vehículo con ese nombre");
  }

  return TipoVehiculoModel.create({
    nombre: nombreNormalizado,
    activo: true,
  });
}

export async function actualizarTipoVehiculo(
  id: string,
  datos: {
    nombre?: string;
    activo?: boolean;
  },
) {
  const tipo = await TipoVehiculoModel.findById(id);

  if (!tipo) {
    throw new Error("Tipo de vehículo no encontrado");
  }

  if (datos.nombre !== undefined) {
    tipo.nombre = datos.nombre.trim();
  }

  if (datos.activo !== undefined) {
    tipo.activo = datos.activo;
  }

  await tipo.save();

  return tipo;
}
