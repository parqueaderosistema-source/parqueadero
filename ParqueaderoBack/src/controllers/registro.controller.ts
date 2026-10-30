import type { Response } from "express";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  buscarVehiculoDentroPorPlaca,
  obtenerRecaudoDelDia,
  obtenerResumenAdministrador,
  obtenerResumenDelDia,
  obtenerVehiculosDentro,
  registrarEntradaVehiculo,
  registrarSalidaVehiculo,
} from "../services/registro.service.js";

import {
  registrarEntradaSchema,
  registrarSalidaSchema,
} from "../validators/registro.validator.js";

import { responderError } from "../utils/responderError.js";

export async function registrarEntrada(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const resultado = registrarEntradaSchema.safeParse(request.body);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Los datos enviados no son válidos",
      errores: resultado.error.flatten().fieldErrors,
    });

    return;
  }

  if (!request.usuario) {
    response.status(401).json({
      ok: false,
      message: "No hay una sesión activa",
    });

    return;
  }

  try {
    const registro = await registrarEntradaVehiculo({
      ...resultado.data,
      usuarioId: request.usuario.id,
    });

    response.status(201).json({
      ok: true,
      message: "Entrada registrada correctamente",
      registro,
    });
  } catch (error) {
    responderError(response, error, "No fue posible registrar la entrada");
  }
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
  request: AuthRequest & {
    params: {
      placa: string;
    };
  },
  response: Response,
): Promise<void> {
  try {
    const registro = await buscarVehiculoDentroPorPlaca(request.params.placa);

    response.status(200).json({
      ok: true,
      registro,
    });
  } catch (error) {
    responderError(response, error, "No fue posible buscar el vehículo");
  }
}

export async function registrarSalida(
  request: AuthRequest & {
    params: {
      placa: string;
    };
  },
  response: Response,
): Promise<void> {
  if (!request.usuario) {
    response.status(401).json({
      ok: false,
      message: "No hay una sesión activa",
    });

    return;
  }

  const resultado = registrarSalidaSchema.safeParse(request.body);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Los datos enviados no son válidos",
      errores: resultado.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const registro = await registrarSalidaVehiculo({
      placa: request.params.placa,
      valorCobrado: resultado.data.valorCobrado,
      observacion: resultado.data.observacion,
      usuarioId: request.usuario.id,
    });

    response.status(200).json({
      ok: true,
      message: "Salida registrada correctamente",
      registro,
    });
  } catch (error) {
    responderError(response, error, "No fue posible registrar la salida");
  }
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
  try {
    const resumen = await obtenerResumenDelDia();

    response.status(200).json({
      ok: true,
      ...resumen,
    });
  } catch (error) {
    responderError(response, error, "No fue posible obtener el resumen del día");
  }
}

export async function resumenAdministrador(
  _request: AuthRequest,
  response: Response,
): Promise<void> {
  try {
    const resumen = await obtenerResumenAdministrador();

    response.status(200).json({
      ok: true,
      ...resumen,
    });
  } catch (error) {
    responderError(
      response,
      error,
      "No fue posible obtener el resumen del administrador",
    );
  }
}
