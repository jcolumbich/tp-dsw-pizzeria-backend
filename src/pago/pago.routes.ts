import { Router } from 'express';
import { verificarToken } from '../auth/auth.middleware.js';
import { recibirWebhook, obtenerEstado, verificarRetorno } from './pago.controller.js';

export const pagoRouter = Router();
// MP autentica las notificaciones con su firma; el resto requiere la sesión del cliente.
pagoRouter.post('/webhook', recibirWebhook);
pagoRouter.use(verificarToken);
pagoRouter.get('/pedido/:id', obtenerEstado);
pagoRouter.post('/pedido/:id/verificar', verificarRetorno);
