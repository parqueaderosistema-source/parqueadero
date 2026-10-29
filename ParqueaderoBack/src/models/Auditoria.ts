import { Schema, model, Types, type InferSchemaType } from "mongoose";

const auditoriaSchema = new Schema(
  {
    usuario: {
      type: Types.ObjectId,
      ref: "Usuario",
      default: null,
    },

    accion: {
      type: String,
      required: true,
      trim: true,
    },

    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    datos: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

auditoriaSchema.index({
  createdAt: -1,
});

export type Auditoria = InferSchemaType<typeof auditoriaSchema>;

export const AuditoriaModel = model("Auditoria", auditoriaSchema);
