import { Request, Response, NextFunction } from 'express';

type Validador = (valor: unknown) => boolean;

interface Esquema {
  campos: Record<string, Validador>;
  obligatorios?: string[];
}

const texto = (maximo: number): Validador => (valor) =>
  typeof valor === 'string' &&
  valor.trim().length > 0 &&
  valor.trim().length <= maximo;

const email: Validador = (valor) =>
  typeof valor === 'string' &&
  valor.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

const contraseniaNueva: Validador = (valor) =>
  typeof valor === 'string' &&
  valor.length >= 8 &&
  valor.length <= 128;

const contraseniaLogin: Validador = (valor) =>
  typeof valor === 'string' &&
  valor.length > 0 &&
  valor.length <= 128;

const booleano: Validador = (valor) => typeof valor === 'boolean';

const enteroPositivo: Validador = (valor) =>
  typeof valor === 'number' &&
  Number.isSafeInteger(valor) &&
  valor > 0;

const enteroNoNegativo: Validador = (valor) =>
  typeof valor === 'number' &&
  Number.isSafeInteger(valor) &&
  valor >= 0;

const dinero: Validador = (valor) =>
  typeof valor === 'number' &&
  Number.isFinite(valor) &&
  valor >= 0;

const nivelPermisos: Validador = (valor) =>
  valor === 0 || valor === 1;

const estadosPedido = [
  'Pendiente',
  'En preparación',
  'En camino',
  'Entregado',
  'Cancelado',
];

const estadoPedido: Validador = (valor) =>
  typeof valor === 'string' && estadosPedido.includes(valor);

const itemsPedido: Validador = (valor) => {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > 50) {
    return false;
  }

  const ids: number[] = [];

  for (const item of valor) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return false;
    }

    const datos = item as Record<string, unknown>;
    const campos = Object.keys(datos);

    if (
      campos.length !== 2 ||
      !campos.includes('pizzaId') ||
      !campos.includes('cantidad') ||
      !enteroPositivo(datos.pizzaId) ||
      !enteroPositivo(datos.cantidad) ||
      (datos.cantidad as number) > 100
    ) {
      return false;
    }

    ids.push(datos.pizzaId as number);
  }

  return new Set(ids).size === ids.length;
};

const camposCliente = {
  nombre: texto(100),
  apellido: texto(100),
  email,
  contrasenia: contraseniaNueva,
  nivel_permisos: nivelPermisos,
  estado: booleano,
  domicilio: texto(255),
};

const camposRepartidor = {
  nombre: texto(100),
  apellido: texto(100),
  email,
  contrasenia: contraseniaNueva,
  nivel_permisos: nivelPermisos,
  estado: booleano,
  matricula: texto(50),
  monto_propina_total: dinero,
};

function esquemaPara(req: Request): Esquema | undefined {
  const ruta = req.path.replace(/\/$/, '');
  const metodo = req.method;

  if (ruta === '/auth/login' && metodo === 'POST') {
    return {
      campos: { email, contrasenia: contraseniaLogin },
      obligatorios: ['email', 'contrasenia'],
    };
  }

  if (ruta === '/clientes' && metodo === 'POST') {
    return {
      campos: camposCliente,
      obligatorios: Object.keys(camposCliente),
    };
  }

  if (/^\/clientes\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    const { nivel_permisos, ...permitidos } = camposCliente;
    return { campos: permitidos };
  }

  if (ruta === '/repartidores' && metodo === 'POST') {
    return {
      campos: camposRepartidor,
      obligatorios: [
        'nombre',
        'apellido',
        'email',
        'contrasenia',
        'nivel_permisos',
        'estado',
        'matricula',
      ],
    };
  }

  if (
    /^\/repartidores\/[^/]+$/.test(ruta) &&
    (metodo === 'PUT' || metodo === 'PATCH')
  ) {
    const {
      nivel_permisos,
      monto_propina_total,
      ...permitidos
    } = camposRepartidor;

    return { campos: permitidos };
  }

  if (ruta === '/pedidos' && metodo === 'POST') {
    return {
      campos: {
        retiro: booleano,
        clienteId: enteroPositivo,
        items: itemsPedido,
      },
      obligatorios: ['retiro', 'items'],
    };
  }

  if (/^\/pedidos\/[^/]+\/asignar-envio$/.test(ruta) && metodo === 'POST') {
    return {
      campos: { repartidorId: enteroPositivo, costo: dinero },
      obligatorios: ['repartidorId', 'costo'],
    };
  }

  if (/^\/pedidos\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    return {
      campos: { retiro: booleano, estado: estadoPedido },
    };
  }

  if (ruta === '/pizzas' && metodo === 'POST') {
    return {
      campos: {
        nombre: texto(100),
        precio: dinero,
        vegetariana: booleano,
        disponible: booleano,
      },
      obligatorios: ['nombre', 'precio', 'vegetariana', 'disponible'],
    };
  }

  if (/^\/pizzas\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    return {
      campos: {
        nombre: texto(100),
        precio: dinero,
        vegetariana: booleano,
        disponible: booleano,
      },
    };
  }

  if (ruta === '/ingredientes' && metodo === 'POST') {
    return {
      campos: { nombre: texto(100), stock: enteroNoNegativo },
      obligatorios: ['nombre', 'stock'],
    };
  }

  if (/^\/ingredientes\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    return {
      campos: { nombre: texto(100), stock: enteroNoNegativo },
    };
  }

  if (ruta === '/detalle-pedido' && metodo === 'POST') {
    return {
      campos: {
        pedidoId: enteroPositivo,
        pizzaId: enteroPositivo,
        cantidad: enteroPositivo,
      },
      obligatorios: ['pedidoId', 'pizzaId', 'cantidad'],
    };
  }

  if (/^\/detalle-pedido\/[^/]+\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    return {
      campos: { cantidad: enteroPositivo },
      obligatorios: ['cantidad'],
    };
  }

  if (ruta === '/ingrediente-pizza' && metodo === 'POST') {
    return {
      campos: {
        pizzaId: enteroPositivo,
        ingredienteId: enteroPositivo,
        cantidad: enteroPositivo,
      },
      obligatorios: ['pizzaId', 'ingredienteId', 'cantidad'],
    };
  }

  if (/^\/ingrediente-pizza\/[^/]+\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    return {
      campos: { cantidad: enteroPositivo },
      obligatorios: ['cantidad'],
    };
  }

  if (ruta === '/envios' && metodo === 'POST') {
    return {
      campos: {
        pedidoId: enteroPositivo,
        costo: dinero,
        monto_propina: dinero,
      },
      obligatorios: ['pedidoId', 'costo', 'monto_propina'],
    };
  }

  if (/^\/envios\/[^/]+$/.test(ruta) && metodo === 'PUT') {
    return {
      campos: {
        pedidoId: enteroPositivo,
        costo: dinero,
        monto_propina: dinero,
      },
    };
  }

  return undefined;
}

export function validarEntrada(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const esquema = esquemaPara(req);

  if (!esquema) {
    return next();
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      message: 'El cuerpo debe ser un objeto JSON',
    });
  }

  for (const campo of esquema.obligatorios ?? []) {
    if (req.body[campo] === undefined) {
      return res.status(400).json({
        message: `Falta el campo ${campo}`,
      });
    }
  }

  const camposRecibidos = Object.keys(req.body);

  if (camposRecibidos.length === 0) {
    return res.status(400).json({
      message: 'Debe enviar al menos un campo',
    });
  }

  for (const campo of camposRecibidos) {
    if (
      !Object.prototype.hasOwnProperty.call(esquema.campos, campo) ||
      !esquema.campos[campo](req.body[campo])
    ) {
      return res.status(400).json({
        message: `Campo inválido o no permitido: ${campo}`,
      });
    }
  }

  return next();
}