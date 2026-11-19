import { MigrationInterface, QueryRunner } from 'typeorm';
export class SembrarCategoriasEditorial1794650401000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'INSERT INTO `categoria` (`id`,`nombre`,`slug`,`destacada`,`imagen_url`,`orden`) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        1,
        'Mujer',
        'mujer',
        true,
        'https://cdn.stylenow.cl/categorias/mujer.jpg',
        1,
      ],
    );
    await q.query(
      'INSERT INTO `categoria` (`id`,`nombre`,`slug`,`destacada`,`imagen_url`,`orden`) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        2,
        'Hombre',
        'hombre',
        true,
        'https://cdn.stylenow.cl/categorias/hombre.jpg',
        2,
      ],
    );
    await q.query(
      'INSERT INTO `categoria` (`id`,`nombre`,`slug`,`destacada`,`imagen_url`,`orden`) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        3,
        'Accesorios',
        'accesorios',
        true,
        'https://cdn.stylenow.cl/categorias/accesorios.jpg',
        3,
      ],
    );
    await q.query(
      'INSERT INTO `categoria` (`id`,`nombre`,`slug`,`destacada`,`imagen_url`,`orden`) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        4,
        'Calzado',
        'calzado',
        false,
        'https://cdn.stylenow.cl/categorias/calzado.jpg',
        4,
      ],
    );
    await q.query(
      'INSERT INTO `coleccion` (`id`,`nombre`,`descripcion`,`imagen_url`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        1,
        'Look urbano',
        'Prendas comodas en tonos neutros para el dia a dia.',
        'https://cdn.stylenow.cl/colecciones/look-urbano.jpg',
      ],
    );
    await q.query(
      'INSERT INTO `coleccion` (`id`,`nombre`,`descripcion`,`imagen_url`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        2,
        'Primavera en lino',
        'Telas livianas y colores claros para los dias de sol.',
        'https://cdn.stylenow.cl/colecciones/primavera-lino.jpg',
      ],
    );
    await q.query(
      'INSERT INTO `coleccion` (`id`,`nombre`,`descripcion`,`imagen_url`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        3,
        'Oficina relajada',
        'Camisas y basicos que van de la reunion al after office.',
        'https://cdn.stylenow.cl/colecciones/oficina-relajada.jpg',
      ],
    );
    await q.query(
      'INSERT INTO `post` (`id`,`titulo`,`contenido`,`imagen_url`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        1,
        'Como combinar tus basicos de temporada',
        'Tres combinaciones simples para renovar tu closet sin comprar de mas.',
        'https://cdn.stylenow.cl/comunidad/basicos-temporada.jpg',
      ],
    );
    await q.query(
      'INSERT INTO `post` (`id`,`titulo`,`contenido`,`imagen_url`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        2,
        'Guia rapida para cuidar el lino',
        'Lavado en frio, secado a la sombra y plancha tibia para que dure mas.',
        'https://cdn.stylenow.cl/comunidad/cuidado-lino.jpg',
      ],
    );
    await q.query(
      'INSERT INTO `post` (`id`,`titulo`,`contenido`,`imagen_url`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        3,
        'Accesorios que cambian un look',
        'Un bolso o un cinturon pueden transformar la misma tenida en otra.',
        'https://cdn.stylenow.cl/comunidad/accesorios.jpg',
      ],
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DELETE FROM post WHERE id IN (1,2,3)');
    await q.query('DELETE FROM coleccion WHERE id IN (1,2,3)');
    await q.query('DELETE FROM categoria WHERE id IN (1,2,3,4)');
  }
}
