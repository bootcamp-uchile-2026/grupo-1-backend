export const SEMILLA_P4 = {
  alertas: [
    {
      usuarioId: 1,
      alerta: {
        id: 1,
        tipo: 'precio',
        productoId: 1,
        precioObjetivo: 29990,
        estado: 'activa',
      },
    },
    {
      usuarioId: 1,
      alerta: {
        id: 2,
        tipo: 'reposicion',
        productoId: 3,
        varianteId: 302,
        estado: 'activa',
      },
    },
    {
      usuarioId: 2,
      alerta: {
        id: 3,
        tipo: 'precio',
        productoId: 2,
        precioObjetivo: 19990,
        estado: 'activa',
      },
    },
  ],
  looks: [
    {
      id: 1,
      nombre: 'Look urbano',
      productos: [
        {
          productoId: 1,
          varianteId: 101,
        },
        {
          productoId: 2,
          varianteId: 201,
        },
      ],
      precioTotal: 69980,
    },
    {
      id: 2,
      nombre: 'Neutros esenciales',
      productos: [
        {
          productoId: 1,
          varianteId: 102,
        },
        {
          productoId: 3,
          varianteId: 301,
        },
      ],
      precioTotal: 64980,
    },
    {
      id: 3,
      nombre: 'Fin de semana',
      productos: [
        {
          productoId: 2,
          varianteId: 202,
        },
        {
          productoId: 3,
          varianteId: 302,
        },
      ],
      precioTotal: 54980,
    },
  ],
  solicitudes: [
    {
      id: 1,
      pedidoId: 1001,
      pedidoItemId: 5001,
      tipo: 'cambio',
      estado: 'aprobada',
      motivo: 'La talla me quedo grande',
      nuevaVarianteId: 101,
      metodoEntrega: 'retiro_domicilio',
      fechaSolicitud: '2026-10-06T12:00:00.000Z',
    },
    {
      id: 2,
      pedidoId: 2001,
      pedidoItemId: 6001,
      tipo: 'devolucion',
      estado: 'solicitada',
      motivo: 'No era el color que esperaba',
      metodoEntrega: 'sucursal',
      fechaSolicitud: '2026-10-05T16:45:00.000Z',
    },
  ],
} as const;
