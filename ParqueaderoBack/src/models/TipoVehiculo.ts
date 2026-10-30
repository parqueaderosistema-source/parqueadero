import { Schema, model, type InferSchemaType } from "mongoose";

const tipoVehiculoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    // Si es true, al registrar la entrada se debe escribir
    // el tipo real del vehículo (ej. el tipo «Otro»).
    permitePersonalizado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type TipoVehiculo = InferSchemaType<typeof tipoVehiculoSchema>;

export const TipoVehiculoModel = model("TipoVehiculo", tipoVehiculoSchema);
