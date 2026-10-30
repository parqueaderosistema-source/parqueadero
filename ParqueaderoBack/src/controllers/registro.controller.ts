import type { Response } from "express";

import {
  usuarioDeSesion,
  type AuthRequest,
} from "../middlewares/auth.middleware.js";

import {
  buscarVehiculoDentroPorPlaca,
  obtenerVehiculosDentro,
  registrarEntradaVehiculo,
  registrarSalidaVehiculo,
} from "../services/registro.service.js";

import {
  obtenerRecaudoDelDia,
  obtenerResumenAdministrador,
  obtenerResumenDelDia,
} from "../services/resumen.service.js";

import { validar } from "../utils/validar.js";

import {
  placaParamsSchema,
  registrarEntradaSchema,
  registrarSalidaSchema,
} from "../validators/registro.validator.js";

export async function registrarEntrada(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const datos = validar(registrarEntradaSchema, request.body);

  const registro = await registrarEntradaVehiculo({
    ...datos,
    usuarioId: usuarioDeSesion(request).id,
  });

  response.status(201).json({
    ok: true,
    message: "Entrada registrada correctamente",
    registro,
  });
}

export async function listarVehiculosDentro(
  _request: AuthRequest,
  response: Response,
): Promise<void> {
  const registros = await obtenerVehiculosDentro();

  response.status(200).json({
    ok: true,
    total: registros.length,
    registros,
  });
}

export async function buscarPorPlaca(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const { placa } = validar(placaParamsSchema, request.params);

  const registro = await buscarVehiculoDentroPorPlaca(placa);

  response.status(200).json({
    ok: true,
    registro,
  });
}

export async function registrarSalida(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const { placa } = validar(placaParamsSchema, request.params);

  const datos = validar(registrarSalidaSchema, request.body);

  const registro = await registrarSalidaVehiculo({
    placa,
    valorCobrado: datos.valorCobrado,
    observacion: datos.observacion,
    usuarioId: usuarioDeSesion(request).id,
  });

  response.status(200).json({
    ok: true,
    message: "Salida registrada correctamente",
    registro,
  });
}

export async function recaudoHoy(
  _request: AuthRequest,
  response: Response,
): Promise<void> {
  const recaudo = await obtenerRecaudoDelDia();

  response.status(200).json({
    ok: true,
    ...recaudo,
  });
}

export async function resumenHoy(
  _request: AuthRequest,
  response: Response,
): Promise<void> {
  const resumen = await obtenerResumenDelDia();

  response.status(200).json({
    ok: true,
    ...resumen,
  });
}

export async function resumenAdministrador(
  _request: AuthRequest,
  response: Response,
): Promise<void> {
  const resumen = await obtenerResumenAdministrador();

  response.status(200).json({
    ok: true,
    ...resumen,
  });
}
