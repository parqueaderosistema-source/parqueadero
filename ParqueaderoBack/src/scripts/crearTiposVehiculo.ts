import "dotenv/config";

import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { TipoVehiculoModel } from "../models/TipoVehiculo.js";

const tiposIniciales = [
  "Automóvil particular",
  "Motocicleta",
  "Camión",
  "Bus",
  "Chiva",
  "Mula",
  "Piaggio",
  "Camioneta",
  "Otro",
];

async function crearTiposVehiculo(): Promise<void> {
  try {
    await connectDatabase();

    for (const nombre of tiposIniciales) {
      await TipoVehiculoModel.updateOne(
        {
          nombre,
        },
        {
          $setOnInsert: {
            nombre,
            activo: true,
          },
        },
        {
          upsert: true,
        },
      );
    }

    console.log("");
    console.log("Tipos de vehículo creados correctamente");
    console.log("");
  } catch (error) {
    console.error("No fue posible crear los tipos de vehículo");

    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

void crearTiposVehiculo();
