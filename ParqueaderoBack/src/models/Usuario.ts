import { Schema, model, type InferSchemaType } from "mongoose";

const usuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    correo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    rol: {
      type: String,
      enum: ["administrador", "trabajador"],
      required: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    ultimoAcceso: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type Usuario = InferSchemaType<typeof usuarioSchema>;

export const UsuarioModel = model("Usuario", usuarioSchema);
