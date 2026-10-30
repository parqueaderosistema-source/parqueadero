import { Schema, model, Types, type InferSchemaType } from "mongoose";

const registroParqueaderoSchema = new Schema(
  {
    placa: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    tipoVehiculo: {
      type: Types.ObjectId,
      ref: "TipoVehiculo",
      required: true,
    },

    tipoVehiculoNombre: {
      type: String,
      required: true,
      trim: true,
    },

    // Texto escrito por el trabajador cuando el tipo
    // permite personalizado (ej. «Otro» → "Triciclo").
    tipoVehiculoPersonalizado: {
      type: String,
      trim: true,
      maxlength: 40,
      default: null,
    },

    fechaHoraEntrada: {
      type: Date,
      required: true,
      default: Date.now,
    },

    tiempoEstimado: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    fechaHoraSalida: {
      type: Date,
      default: null,
    },

    valorCobrado: {
      type: Number,
      min: 0,
      default: null,
    },

    estado: {
      type: String,
      enum: ["dentro", "retirado", "anulado"],
      default: "dentro",
      required: true,
    },

    observacion: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    registradoEntradaPor: {
      type: Types.ObjectId,
      ref: "Usuario",
      required: true,
    },

    registradoSalidaPor: {
      type: Types.ObjectId,
      ref: "Usuario",
      default: null,
    },

    // Anulación (solo administrador). El registro no se borra.
    anuladoPor: {
      type: Types.ObjectId,
      ref: "Usuario",
      default: null,
    },

    fechaAnulacion: {
      type: Date,
      default: null,
    },

    motivoAnulacion: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Búsqueda rápida por placa
registroParqueaderoSchema.index({
  placa: 1,
  estado: 1,
});

// Historial por fechas
registroParqueaderoSchema.index({
  fechaHoraEntrada: -1,
});

registroParqueaderoSchema.index({
  fechaHoraSalida: -1,
});

// Evita que una placa tenga dos entradas abiertas al mismo tiempo
registroParqueaderoSchema.index(
  { placa: 1 },
  {
    unique: true,
    partialFilterExpression: {
      estado: "dentro",
    },
  },
);

export type RegistroParqueadero = InferSchemaType<
  typeof registroParqueaderoSchema
>;

export const RegistroParqueaderoModel = model(
  "RegistroParqueadero",
  registroParqueaderoSchema,
);
