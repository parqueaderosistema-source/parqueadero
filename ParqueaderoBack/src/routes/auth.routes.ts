import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { login, logout, me } from "../controllers/auth.controller.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

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

router.get("/me", verificarAutenticacion, me);

export default router;
