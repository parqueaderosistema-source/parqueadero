import type { Request, Response } from "express";

import {
  actualizarTipoVehiculo,
  crearTipoVehiculo,
  obtenerTiposVehiculo,
  obtenerTiposVehiculoActivos,
} from "../services/tipoVehiculo.service.js";

import {
  actualizarTipoVehiculoSchema,
  crearTipoVehiculoSchema,
} from "../validators/tipoVehiculo.validator.js";

export async function listarTipos(
  _request: Request,
  response: Response,
): Promise<void> {
  const tipos = await obtenerTiposVehiculo();

  response.status(200).json({
    ok: true,
    tipos,
  });
}

export async function listarTiposActivos(
  _request: Request,
  response: Response,
): Promise<void> {
  const tipos = await obtenerTiposVehiculoActivos();

  response.status(200).json({
    ok: true,
    tipos,
  });
}

export async function crearTipo(
  request: Request,
  response: Response,
): Promise<void> {
  const resultado = crearTipoVehiculoSchema.safeParse(request.body);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Datos no válidos",
    });
    return;
  }

  try {
    const tipo = await crearTipoVehiculo(resultado.data.nombre);

    response.status(201).json({
      ok: true,
      message: "Tipo de vehículo creado correctamente",
      tipo,
    });
  } catch (error) {
    response.status(400).json({
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible crear el tipo de vehículo",
    });
  }
}

export async function actualizarTipo(
  request: Request<{ id: string }>,
  response: Response,
): Promise<void> {
  const resultado = actualizarTipoVehiculoSchema.safeParse(request.body);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Datos no válidos",
    });

    return;
  }

  try {
    const tipo = await actualizarTipoVehiculo(
      request.params.id,
      resultado.data,
    );

    response.status(200).json({
      ok: true,
      message: "Tipo de vehículo actualizado",
      tipo,
    });
  } catch (error) {
    response.status(404).json({
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el tipo de vehículo",
    });
  }
}
