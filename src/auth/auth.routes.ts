import { Router } from 'express';
import { login, register } from './auth.controller.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { loginSchema, registerSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', validarConSchema(loginSchema, 'loginInput'), login);
authRouter.post('/register', validarConSchema(registerSchema, 'registerInput'), register);