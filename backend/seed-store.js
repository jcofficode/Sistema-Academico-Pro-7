const { PrismaClient } = require('./dist/src/generated/prisma_ahbb/index.js');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de productos del catálogo...');

  const productos = [
    {
      nombre_ahbb: 'Suéter Azul H&B',
      descripcion_ahbb: 'Suéter cómodo, ideal para el frío en los pasillos de la academia. Color Azul Oficial H&B.',
      precio_ahbb: '25.00',
      stock_ahbb: 50,
      categoria_ahbb: 'ropa',
      imagen_ahbb: '/img/SueterH&B_Azul.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Suéter Rojo H&B',
      descripcion_ahbb: 'Suéter cómodo, ideal para el frío en los pasillos de la academia. Color Rojo H&B.',
      precio_ahbb: '25.00',
      stock_ahbb: 45,
      categoria_ahbb: 'ropa',
      imagen_ahbb: '/img/SueterH&B_Rojo.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Suéter Mostaza H&B',
      descripcion_ahbb: 'Suéter cómodo estilo urbano. Color Mostaza.',
      precio_ahbb: '25.00',
      stock_ahbb: 30,
      categoria_ahbb: 'ropa',
      imagen_ahbb: '/img/SueterH&B_mostaza.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Franela Azul H&B',
      descripcion_ahbb: 'Franela fresca 100% algodón. Color Azul Oficial H&B.',
      precio_ahbb: '15.00',
      stock_ahbb: 100,
      categoria_ahbb: 'ropa',
      imagen_ahbb: '/img/franelaH&B_Azul.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Franela Roja H&B',
      descripcion_ahbb: 'Franela fresca 100% algodón. Color Rojo Vibrante.',
      precio_ahbb: '15.00',
      stock_ahbb: 100,
      categoria_ahbb: 'ropa',
      imagen_ahbb: '/img/franelaH&B_Rojo.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Franela Mostaza H&B',
      descripcion_ahbb: 'Franela fresca 100% algodón. Color Mostaza.',
      precio_ahbb: '15.00',
      stock_ahbb: 100,
      categoria_ahbb: 'ropa',
      imagen_ahbb: '/img/franelaH&B_mostaza.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Lapicero H&B Azul',
      descripcion_ahbb: 'Bolígrafo oficial de la Academia H&B. Cuerpo Azul.',
      precio_ahbb: '2.50',
      stock_ahbb: 300,
      categoria_ahbb: 'papeleria',
      imagen_ahbb: '/img/lapiceroH&B_Azul.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Lapicero H&B Rojo',
      descripcion_ahbb: 'Bolígrafo oficial de la Academia H&B. Cuerpo Rojo.',
      precio_ahbb: '2.50',
      stock_ahbb: 300,
      categoria_ahbb: 'papeleria',
      imagen_ahbb: '/img/lapiceroH&B_Rojo.jpg',
      estado_producto_ahbb: 'activo'
    },
    {
      nombre_ahbb: 'Lapicero H&B Mostaza',
      descripcion_ahbb: 'Bolígrafo oficial de la Academia H&B. Cuerpo Mostaza.',
      precio_ahbb: '2.50',
      stock_ahbb: 300,
      categoria_ahbb: 'papeleria',
      imagen_ahbb: '/img/lapiceroH&B_mostaza.jpg',
      estado_producto_ahbb: 'activo'
    }
  ];

  for (const prod of productos) {
    const existing = await prisma.td_producto_ahbb.findFirst({
      where: { nombre_ahbb: prod.nombre_ahbb }
    });

    if (existing) {
      await prisma.td_producto_ahbb.update({
        where: { id_producto_ahbb: existing.id_producto_ahbb },
        data: prod
      });
      console.log(`Actualizado: ${prod.nombre_ahbb}`);
    } else {
      await prisma.td_producto_ahbb.create({
        data: prod
      });
      console.log(`Creado: ${prod.nombre_ahbb}`);
    }
  }

  console.log('¡Productos cargados exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
