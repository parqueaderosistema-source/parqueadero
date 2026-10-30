import type { Request, Response } from "express";

import {
  usuarioDeSesion,
  type AuthRequest,
} from "../middlewares/auth.middleware.js";

import {
  actualizarTipoVehiculo,
  crearTipoVehiculo,
  obtenerTiposVehiculo,
  obtenerTiposVehiculoActivos,
} from "../services/tipoVehiculo.service.js";

import { validar } from "../utils/validar.js";

import {
  actualizarTipoVehiculoSchema,
  crearTipoVehiculoSchema,
  tipoVehiculoParamsSchema,
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
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const { nombre } = validar(crearTipoVehiculoSchema, request.body);

  const tipo = await crearTipoVehiculo(nombre, usuarioDeSesion(request).id);

  response.status(201).json({
    ok: true,
    message: "Tipo de vehículo creado correctamente",
    tipo,
  });
}

export async function actualizarTipo(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const { id } = validar(tipoVehiculoParamsSchema, request.params);

  const datos = validar(actualizarTipoVehiculoSchema, request.body);

  const tipo = await actualizarTipoVehiculo(
    id,
    datos,
    usuarioDeSesion(request).id,
  );

  response.status(200).json({
    ok: true,
    message: "Tipo de vehículo actualizado",
    tipo,
  });
}
