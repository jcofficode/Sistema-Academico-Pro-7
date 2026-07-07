INSERT INTO "td_producto_ahbb" ("nombre_ahbb", "descripcion_ahbb", "precio_ahbb", "stock_ahbb", "categoria_ahbb", "imagen_ahbb", "estado_producto_ahbb", "creadoEn_ahbb", "actualizadoEn_ahbb") VALUES 
('Suéter Azul H&B', 'Suéter cómodo, ideal para el frío en los pasillos de la academia. Color Azul Oficial H&B.', 25.00, 50, 'ropa', '/img/SueterH&B_Azul.jpg', 'activo', NOW(), NOW()),
('Suéter Rojo H&B', 'Suéter cómodo, ideal para el frío en los pasillos de la academia. Color Rojo H&B.', 25.00, 45, 'ropa', '/img/SueterH&B_Rojo.jpg', 'activo', NOW(), NOW()),
('Suéter Mostaza H&B', 'Suéter cómodo estilo urbano. Color Mostaza.', 25.00, 30, 'ropa', '/img/SueterH&B_mostaza.jpg', 'activo', NOW(), NOW()),
('Franela Azul H&B', 'Franela fresca 100% algodón. Color Azul Oficial H&B.', 15.00, 100, 'ropa', '/img/franelaH&B_Azul.jpg', 'activo', NOW(), NOW()),
('Franela Roja H&B', 'Franela fresca 100% algodón. Color Rojo Vibrante.', 15.00, 100, 'ropa', '/img/franelaH&B_Rojo.jpg', 'activo', NOW(), NOW()),
('Franela Mostaza H&B', 'Franela fresca 100% algodón. Color Mostaza.', 15.00, 100, 'ropa', '/img/franelaH&B_mostaza.jpg', 'activo', NOW(), NOW()),
('Lapicero H&B Azul', 'Bolígrafo oficial de la Academia H&B. Cuerpo Azul.', 2.50, 300, 'papeleria', '/img/lapiceroH&B_Azul.jpg', 'activo', NOW(), NOW()),
('Lapicero H&B Rojo', 'Bolígrafo oficial de la Academia H&B. Cuerpo Rojo.', 2.50, 300, 'papeleria', '/img/lapiceroH&B_Rojo.jpg', 'activo', NOW(), NOW()),
('Lapicero H&B Mostaza', 'Bolígrafo oficial de la Academia H&B. Cuerpo Mostaza.', 2.50, 300, 'papeleria', '/img/lapiceroH&B_mostaza.jpg', 'activo', NOW(), NOW())
ON CONFLICT DO NOTHING;
