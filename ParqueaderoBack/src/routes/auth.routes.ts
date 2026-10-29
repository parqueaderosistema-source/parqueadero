import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { login, logout } from "../controllers/auth.controller.js";

import {
  verificarAutenticacion,
  type AuthRequest,
} from "../middlewares/auth.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message:
      "Demasiados intentos de inicio de sesión. Intente nuevamente más tarde.",
  },
});

router.post("/login", loginLimiter, login);

router.post("/logout", logout);

router.get("/me", verificarAutenticacion, (request: AuthRequest, response) => {
  response.status(200).json({
    ok: true,
    usuario: request.usuario,
  });
});

export default router;
