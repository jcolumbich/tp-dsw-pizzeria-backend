import { Router } from 'express';
import { login, registrar } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/registro', registrar);