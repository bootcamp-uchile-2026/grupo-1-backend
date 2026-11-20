/**
 * Contrato del esquema fisico MySQL de StyleNow.
 *
 * Describe tabla por tabla lo que dejan creado las 14 migraciones versionadas
 * (columnas, clave primaria, indices, claves foraneas y restricciones CHECK).
 * Lo consumen dos pruebas:
 *
 * - esquema-typeorm.e2e-spec.ts: contrasta las entidades TypeORM con este
 *   contrato sin abrir conexion.
 * - esquema.mysql.e2e-spec.ts: contrasta INFORMATION_SCHEMA del laboratorio
 *   MySQL desechable con este contrato.
 *
 * El esquema se cambia solo con migraciones nuevas, escritas a mano: las
 * entidades no declaran todas las FK, UNIQUE ni CHECK, por lo que
 * `typeorm migration:generate` propondria eliminarlas. Toda migracion nueva
 * debe actualizar este contrato en el mismo cambio.
 */

/** Accion referencial. InnoDB evalua NO ACTION igual que RESTRICT. */
export type AccionReferencial = 'RESTRICT' | 'CASCADE' | 'SET NULL';

export interface ColumnaEsperada {
  nombre: string;
  /** COLUMN_TYPE de MySQL normalizado (ver normalizarTipoMysql). */
  tipo: string;
  nulo?: boolean;
  autoIncremento?: boolean;
  /** Solo se declara cuando difiere del cotejamiento de la tabla. */
  cotejamiento?: string;
}

export interface IndiceEsperado {
  nombre: string;
  columnas: string[];
  unico: boolean;
}

export interface ForaneaEsperada {
  /** Nombre explicito en la migracion; sin nombre MySQL genera <tabla>_ibfk_N. */
  nombre?: string;
  columnas: string[];
  tablaReferida: string;
  columnasReferidas: string[];
  alBorrar: AccionReferencial;
  alActualizar: AccionReferencial;
}

export interface TablaEsperada {
  /** Migracion que crea la tabla (o que la altera por ultima vez). */
  migracion: string;
  columnas: ColumnaEsperada[];
  clavePrimaria: string[];
  /** Indices UNIQUE e indices secundarios con nombre explicito. */
  indices: IndiceEsperado[];
  foraneas: ForaneaEsperada[];
  /** CHECK con nombre explicito. */
  checksConNombre: string[];
  /** Total de CHECK de la tabla, con y sin nombre. */
  totalChecks: number;
}

/** Cotejamiento por defecto de todas las tablas de dominio. */
export const COTEJAMIENTO_TABLAS = 'utf8mb4_0900_ai_ci';

/** Migraciones en orden de ejecucion, por nombre de clase. */
export const MIGRACIONES_ESPERADAS = [
  'CrearCategoriasEditorial1794650400000',
  'SembrarCategoriasEditorial1794650401000',
  'CrearProductos1794950400000',
  'SembrarProductos1794950401000',
  'CrearIdentidad1795050400000',
  'SembrarIdentidad1795050401000',
  'CrearComercio1795150400000',
  'SembrarComercio1795150401000',
  'CrearAlertas1795250400000',
  'CrearLooks1795250401000',
  'CrearLogistica1795250402000',
  'CrearPostventa1795250403000',
  'SembrarP41795250404000',
  'CrearCargasImagenes1795350400000',
  'IntegridadComercio1795450400000',
] as const;

/**
 * Quita el ancho de presentacion de los enteros (BOOLEAN se informa como
 * tinyint(1)) y pasa a minusculas, para comparar tipos de forma estable.
 */
export function normalizarTipoMysql(columnType: string): string {
  return columnType
    .toLowerCase()
    .trim()
    .replace(/^(tinyint|smallint|mediumint|int|bigint)\(\d+\)/, '$1');
}

/** Normaliza DELETE_RULE / UPDATE_RULE de INFORMATION_SCHEMA. */
export function normalizarAccion(regla: string): AccionReferencial {
  const valor = regla.toUpperCase();
  if (valor === 'NO ACTION' || valor === 'RESTRICT') return 'RESTRICT';
  if (valor === 'CASCADE' || valor === 'SET NULL') return valor;
  throw new Error('Accion referencial no admitida: ' + regla);
}

const id = (nombre = 'id'): ColumnaEsperada => ({
  nombre,
  tipo: 'int unsigned',
  autoIncremento: true,
});
const col = (
  nombre: string,
  tipo: string,
  extra: Omit<ColumnaEsperada, 'nombre' | 'tipo'> = {},
): ColumnaEsperada => ({ nombre, tipo, ...extra });
const fk = (
  columnas: string[],
  tablaReferida: string,
  columnasReferidas: string[] = ['id'],
  nombre?: string,
): ForaneaEsperada => ({
  ...(nombre ? { nombre } : {}),
  columnas,
  tablaReferida,
  columnasReferidas,
  alBorrar: 'RESTRICT',
  alActualizar: 'RESTRICT',
});
const unico = (nombre: string, columnas: string[]): IndiceEsperado => ({
  nombre,
  columnas,
  unico: true,
});
const indice = (nombre: string, columnas: string[]): IndiceEsperado => ({
  nombre,
  columnas,
  unico: false,
});

const M01 = '1794650400000-crear-categorias-editorial';
const M02 = '1794950400000-crear-productos';
const M03 = '1795050400000-crear-identidad';
const M04 = '1795150400000-crear-comercio';
const P4A = '1795250400000-crearalertas';
const P4L = '1795250401000-crearlooks';
const P4G = '1795250402000-crearlogistica';
const P4P = '1795250403000-crearpostventa';
const P5 = '1795350400000-crear-cargas-imagenes';
const MP701 = '1795450400000-integridad-comercio';

export const ESQUEMA_ESPERADO: Record<string, TablaEsperada> = {
  // Catalogo y editorial. coleccion y post son contenido editorial
  // independiente: no tienen relaciones de negocio con otras tablas.
  categoria: {
    migracion: M01,
    columnas: [
      id(),
      col('nombre', 'varchar(80)'),
      col('slug', 'varchar(80)'),
      col('imagen_url', 'varchar(500)'),
      col('destacada', 'tinyint'),
      col('orden', 'smallint unsigned'),
    ],
    clavePrimaria: ['id'],
    indices: [
      unico('uq_categoria_slug', ['slug']),
      indice('ix_categoria_destacada_orden', ['destacada', 'orden']),
    ],
    foraneas: [],
    checksConNombre: [],
    totalChecks: 0,
  },
  coleccion: {
    migracion: M01,
    columnas: [
      id(),
      col('nombre', 'varchar(150)'),
      col('descripcion', 'text'),
      col('imagen_url', 'varchar(500)'),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [],
    checksConNombre: [],
    totalChecks: 0,
  },
  post: {
    migracion: M01,
    columnas: [
      id(),
      col('titulo', 'varchar(150)'),
      col('contenido', 'text'),
      col('imagen_url', 'varchar(500)'),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [],
    checksConNombre: [],
    totalChecks: 0,
  },
  producto: {
    migracion: M02,
    columnas: [
      col('id', 'bigint unsigned'),
      col('categoria_id', 'int unsigned'),
      col('nombre', 'longtext'),
      col('precio', 'decimal(20,0)'),
      col('imagen_url', 'longtext'),
      col('novedad', 'tinyint'),
      col('oferta', 'tinyint'),
      col('descripcion', 'longtext'),
      col('calificacion', 'double'),
      col('guia_tallas', 'longtext'),
    ],
    clavePrimaria: ['id'],
    indices: [indice('ix_producto_categoria', ['categoria_id'])],
    foraneas: [
      fk(['categoria_id'], 'categoria', ['id'], 'fk_producto_categoria'),
    ],
    checksConNombre: [
      'ck_producto_0',
      'ck_producto_1',
      'ck_producto_2',
      'ck_producto_3',
      'ck_producto_4',
    ],
    totalChecks: 5,
  },
  variante: {
    migracion: P4A,
    columnas: [
      col('id', 'bigint unsigned'),
      col('producto_id', 'bigint unsigned'),
      col('color', 'longtext'),
      col('talla', 'longtext'),
      col('stock', 'bigint unsigned'),
      col('posicion', 'int unsigned'),
    ],
    clavePrimaria: ['id'],
    indices: [
      unico('uq_variante_posicion', ['producto_id', 'posicion']),
      // Destino de las FK compuestas (variante_id, producto_id).
      unico('uq_p4_variante_producto', ['id', 'producto_id']),
    ],
    foraneas: [fk(['producto_id'], 'producto', ['id'], 'fk_variante_producto')],
    checksConNombre: ['ck_variante_0', 'ck_variante_1'],
    totalChecks: 2,
  },
  producto_imagen: {
    migracion: M02,
    columnas: [
      col('producto_id', 'bigint unsigned'),
      col('posicion', 'int unsigned'),
      col('url', 'longtext'),
    ],
    clavePrimaria: ['producto_id', 'posicion'],
    indices: [],
    foraneas: [
      fk(['producto_id'], 'producto', ['id'], 'fk_producto_imagen_producto'),
    ],
    checksConNombre: [],
    totalChecks: 0,
  },
  producto_color: {
    migracion: M02,
    columnas: [
      col('producto_id', 'bigint unsigned'),
      col('posicion', 'int unsigned'),
      col('color', 'longtext'),
    ],
    clavePrimaria: ['producto_id', 'posicion'],
    indices: [],
    foraneas: [
      fk(['producto_id'], 'producto', ['id'], 'fk_producto_color_producto'),
    ],
    checksConNombre: [],
    totalChecks: 0,
  },
  producto_talla: {
    migracion: M02,
    columnas: [
      col('producto_id', 'bigint unsigned'),
      col('posicion', 'int unsigned'),
      col('talla', 'longtext'),
    ],
    clavePrimaria: ['producto_id', 'posicion'],
    indices: [],
    foraneas: [
      fk(['producto_id'], 'producto', ['id'], 'fk_producto_talla_producto'),
    ],
    checksConNombre: [],
    totalChecks: 0,
  },

  // Identidad
  usuario: {
    migracion: M03,
    columnas: [
      id(),
      col('nombre', 'mediumtext'),
      col('apellido', 'mediumtext'),
      col('email', 'varchar(320)', { cotejamiento: 'utf8mb4_bin' }),
      col('telefono', 'mediumtext', { nulo: true }),
    ],
    clavePrimaria: ['id'],
    indices: [unico('uq_usuario_email', ['email'])],
    foraneas: [],
    checksConNombre: [],
    totalChecks: 0,
  },
  credencial: {
    migracion: M03,
    columnas: [
      col('usuario_id', 'int unsigned'),
      col('correo', 'varchar(320)', { cotejamiento: 'utf8mb4_bin' }),
      col('hash_contrasena', 'varchar(255)', { cotejamiento: 'ascii_bin' }),
      col('actualizada_en', 'datetime(3)'),
    ],
    clavePrimaria: ['usuario_id'],
    indices: [unico('uq_credencial_correo', ['correo'])],
    foraneas: [fk(['usuario_id'], 'usuario', ['id'], 'fk_credencial_usuario')],
    checksConNombre: ['ck_credencial_hash'],
    totalChecks: 1,
  },
  direccion: {
    migracion: M03,
    columnas: [
      id(),
      col('usuario_id', 'int unsigned'),
      col('nombre', 'mediumtext'),
      col('calle', 'mediumtext'),
      col('numero', 'mediumtext'),
      col('departamento', 'mediumtext', { nulo: true }),
      col('comuna', 'mediumtext'),
      col('region', 'mediumtext'),
      col('principal', 'tinyint'),
    ],
    clavePrimaria: ['id'],
    indices: [indice('ix_direccion_usuario', ['usuario_id'])],
    foraneas: [fk(['usuario_id'], 'usuario', ['id'], 'fk_direccion_usuario')],
    checksConNombre: ['ck_direccion_principal'],
    totalChecks: 1,
  },
  permiso_usuario: {
    migracion: P5,
    columnas: [
      col('usuario_id', 'int unsigned'),
      col('permiso', 'varchar(80)', { cotejamiento: 'ascii_bin' }),
    ],
    clavePrimaria: ['usuario_id', 'permiso'],
    indices: [],
    foraneas: [fk(['usuario_id'], 'usuario')],
    checksConNombre: [],
    totalChecks: 0,
  },

  // Comercio
  carrito: {
    migracion: M04,
    columnas: [id(), col('usuario_id', 'int unsigned')],
    clavePrimaria: ['id'],
    indices: [unico('uq_carrito_usuario', ['usuario_id'])],
    foraneas: [fk(['usuario_id'], 'usuario')],
    checksConNombre: [],
    totalChecks: 0,
  },
  carrito_item: {
    migracion: M04,
    columnas: [
      col('carrito_id', 'int unsigned'),
      col('variante_id', 'bigint unsigned'),
      col('cantidad', 'bigint unsigned'),
      col('posicion', 'int unsigned'),
    ],
    clavePrimaria: ['carrito_id', 'variante_id'],
    indices: [unico('uq_carrito_posicion', ['carrito_id', 'posicion'])],
    foraneas: [fk(['carrito_id'], 'carrito'), fk(['variante_id'], 'variante')],
    checksConNombre: [],
    totalChecks: 1,
  },
  favorito: {
    migracion: M04,
    columnas: [
      // Orden de insercion para listar favoritos; no forma parte de la PK.
      id('orden'),
      col('usuario_id', 'int unsigned'),
      col('producto_id', 'bigint unsigned'),
    ],
    clavePrimaria: ['usuario_id', 'producto_id'],
    indices: [unico('orden', ['orden'])],
    foraneas: [fk(['usuario_id'], 'usuario'), fk(['producto_id'], 'producto')],
    checksConNombre: [],
    totalChecks: 0,
  },
  pedido: {
    migracion: M04,
    columnas: [
      id(),
      col('usuario_id', 'int unsigned'),
      col('numero_pedido', 'varchar(80)'),
      col('estado', 'varchar(30)'),
      col('fecha', 'datetime(3)'),
      col('costo_envio', 'decimal(20,0)'),
      col('metodo_pago', 'longtext'),
      col('checkout', 'json', { nulo: true }),
      col('clave_idempotencia', 'varchar(128)', {
        nulo: true,
        cotejamiento: 'ascii_bin',
      }),
      col('huella', 'varchar(64)', { nulo: true }),
    ],
    clavePrimaria: ['id'],
    indices: [
      unico('uq_pedido_numero', ['numero_pedido']),
      unico('uq_pedido_idempotencia', ['usuario_id', 'clave_idempotencia']),
    ],
    foraneas: [fk(['usuario_id'], 'usuario')],
    checksConNombre: ['ck_pedido_estado'],
    totalChecks: 2,
  },
  pedido_item: {
    migracion: MP701,
    columnas: [
      id(),
      col('pedido_id', 'int unsigned'),
      col('producto_id', 'bigint unsigned'),
      col('variante_id', 'bigint unsigned'),
      col('posicion', 'int unsigned'),
      col('nombre', 'longtext'),
      col('cantidad', 'bigint unsigned'),
      col('precio_unitario', 'decimal(20,0)'),
    ],
    clavePrimaria: ['id'],
    indices: [
      unico('uq_pedido_posicion', ['pedido_id', 'posicion']),
      // Destino de la FK compuesta de solicitud_postventa.
      unico('uq_p4_item_pedido', ['id', 'pedido_id']),
    ],
    foraneas: [
      fk(['pedido_id'], 'pedido'),
      fk(['producto_id'], 'producto'),
      fk(['variante_id'], 'variante'),
      // El producto copiado en la linea debe ser el de su variante.
      fk(
        ['variante_id', 'producto_id'],
        'variante',
        ['id', 'producto_id'],
        'fk_pedido_item_variante_producto',
      ),
    ],
    checksConNombre: [],
    totalChecks: 2,
  },

  // Alertas y looks
  alerta: {
    migracion: P4A,
    columnas: [
      id(),
      col('usuario_id', 'int unsigned'),
      col('tipo', 'varchar(20)'),
      col('producto_id', 'bigint unsigned'),
      col('variante_id', 'bigint unsigned', { nulo: true }),
      col('precio_objetivo', 'double', { nulo: true }),
      col('estado', 'varchar(20)'),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [
      fk(['usuario_id'], 'usuario'),
      fk(['producto_id'], 'producto'),
      fk(['variante_id'], 'variante'),
      // Garantiza que la variante pertenece al producto de la alerta.
      fk(['variante_id', 'producto_id'], 'variante', ['id', 'producto_id']),
    ],
    checksConNombre: [],
    totalChecks: 4,
  },
  look_conjunto: {
    migracion: P4L,
    columnas: [
      id(),
      // NULL identifica los looks editoriales (sin creador).
      col('creador_usuario_id', 'int unsigned', { nulo: true }),
      col('nombre', 'longtext'),
      col('precio_total', 'decimal(20,0)'),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [fk(['creador_usuario_id'], 'usuario')],
    checksConNombre: [],
    totalChecks: 1,
  },
  look_ocurrencia: {
    migracion: P4L,
    columnas: [
      col('look_id', 'int unsigned'),
      col('posicion', 'int unsigned'),
      col('variante_id', 'bigint unsigned'),
    ],
    clavePrimaria: ['look_id', 'posicion'],
    indices: [],
    foraneas: [
      fk(['look_id'], 'look_conjunto'),
      fk(['variante_id'], 'variante'),
    ],
    checksConNombre: [],
    totalChecks: 0,
  },
  look_guardado: {
    migracion: P4L,
    columnas: [
      col('usuario_id', 'int unsigned'),
      col('look_id', 'int unsigned'),
    ],
    clavePrimaria: ['usuario_id', 'look_id'],
    indices: [],
    foraneas: [fk(['usuario_id'], 'usuario'), fk(['look_id'], 'look_conjunto')],
    checksConNombre: [],
    totalChecks: 0,
  },

  // Logistica
  envio: {
    migracion: P4G,
    columnas: [
      id(),
      col('pedido_id', 'int unsigned'),
      col('estado', 'varchar(20)'),
      col('despachado_en', 'datetime(3)', { nulo: true }),
    ],
    clavePrimaria: ['id'],
    indices: [unico('pedido_id', ['pedido_id'])],
    foraneas: [fk(['pedido_id'], 'pedido')],
    checksConNombre: [],
    totalChecks: 2,
  },
  envio_evento: {
    migracion: P4G,
    columnas: [
      id(),
      col('envio_id', 'int unsigned'),
      col('anterior', 'varchar(20)', { nulo: true }),
      col('nuevo', 'varchar(20)'),
      col('actor_id', 'int unsigned'),
      col('fecha', 'datetime(3)'),
      col('motivo', 'text', { nulo: true }),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [fk(['envio_id'], 'envio'), fk(['actor_id'], 'usuario')],
    checksConNombre: ['ck_envio_evento_anterior', 'ck_envio_evento_nuevo'],
    totalChecks: 2,
  },
  pedido_cancelacion: {
    migracion: P4G,
    columnas: [
      col('pedido_id', 'int unsigned'),
      col('actor_id', 'int unsigned'),
      col('fecha', 'datetime(3)'),
      col('motivo', 'text', { nulo: true }),
      col('restituido', 'tinyint'),
    ],
    clavePrimaria: ['pedido_id'],
    indices: [],
    foraneas: [fk(['pedido_id'], 'pedido'), fk(['actor_id'], 'usuario')],
    checksConNombre: [],
    totalChecks: 1,
  },
  inventario_pedido: {
    migracion: P4G,
    columnas: [
      col('pedido_id', 'int unsigned'),
      col('variante_id', 'bigint unsigned'),
      col('cantidad', 'bigint unsigned'),
      col('restituido', 'tinyint'),
    ],
    clavePrimaria: ['pedido_id', 'variante_id'],
    indices: [],
    foraneas: [fk(['pedido_id'], 'pedido'), fk(['variante_id'], 'variante')],
    checksConNombre: [],
    totalChecks: 2,
  },

  // Postventa
  solicitud_postventa: {
    migracion: P4P,
    columnas: [
      id(),
      col('pedido_id', 'int unsigned'),
      col('pedido_item_id', 'int unsigned'),
      col('tipo', 'varchar(20)'),
      col('estado', 'varchar(20)'),
      col('motivo', 'longtext'),
      col('nueva_variante_id', 'bigint unsigned', { nulo: true }),
      col('metodo_entrega', 'longtext'),
      col('fecha_solicitud', 'datetime(3)'),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [
      fk(['pedido_id'], 'pedido'),
      fk(['pedido_item_id'], 'pedido_item'),
      // Garantiza que el item pertenece al pedido de la solicitud.
      fk(['pedido_item_id', 'pedido_id'], 'pedido_item', ['id', 'pedido_id']),
      fk(['nueva_variante_id'], 'variante'),
    ],
    checksConNombre: [],
    totalChecks: 3,
  },
  postventa_evento: {
    migracion: P4P,
    columnas: [
      id(),
      col('solicitud_id', 'int unsigned'),
      col('estado', 'varchar(20)'),
      col('actor_id', 'int unsigned', { nulo: true }),
      col('fecha', 'datetime(3)'),
      col('resolucion', 'text', { nulo: true }),
    ],
    clavePrimaria: ['id'],
    indices: [],
    foraneas: [
      fk(['solicitud_id'], 'solicitud_postventa'),
      fk(['actor_id'], 'usuario'),
    ],
    checksConNombre: ['ck_postventa_evento_estado'],
    totalChecks: 1,
  },
  postventa_idempotencia: {
    migracion: P4P,
    columnas: [
      col('usuario_id', 'int unsigned'),
      col('clave', 'varchar(128)', { cotejamiento: 'ascii_bin' }),
      col('solicitud_id', 'int unsigned'),
      col('huella', 'char(64)'),
    ],
    clavePrimaria: ['usuario_id', 'clave'],
    indices: [],
    foraneas: [
      fk(['usuario_id'], 'usuario'),
      fk(['solicitud_id'], 'solicitud_postventa'),
    ],
    checksConNombre: [],
    totalChecks: 0,
  },

  // Imagenes
  carga_imagen: {
    migracion: P5,
    columnas: [
      col('archivo', 'varchar(50)', { cotejamiento: 'ascii_bin' }),
      col('producto_id', 'bigint unsigned'),
      col('actor_id', 'int unsigned'),
      col('estado', 'varchar(20)'),
      col('sha256', 'char(64)', { cotejamiento: 'ascii_general_ci' }),
      col('bytes', 'int unsigned'),
      col('creada_en', 'datetime(3)'),
    ],
    clavePrimaria: ['archivo'],
    indices: [indice('ix_carga_estado_fecha', ['estado', 'creada_en'])],
    foraneas: [fk(['producto_id'], 'producto'), fk(['actor_id'], 'usuario')],
    checksConNombre: [],
    totalChecks: 2,
  },
};

/** Clave estable de una FK para comparar sin depender de su nombre. */
export function claveForanea(
  tabla: string,
  f: Pick<ForaneaEsperada, 'columnas' | 'tablaReferida' | 'columnasReferidas'>,
): string {
  return `${tabla}(${f.columnas.join(',')})->${f.tablaReferida}(${f.columnasReferidas.join(',')})`;
}
