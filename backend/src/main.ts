import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { TunnelService_ahbb } from './common/tunnel/tunnel.service_ahbb';
import { HttpExceptionFilter_ahbb } from './common/filters/http-exception.filter_ahbb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const puerto = Number(process.env.PORT) || 3000;

  // CORS dinámico: acepta localhost, frontend local y la URL del túnel
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (Postman, scripts, etc.)
      if (!origin) return callback(null, true);

      // Orígenes siempre permitidos
      const origenesPermitidos_ahbb = [
        'http://localhost:9000',
        'http://localhost:9200',
        `http://localhost:${puerto}`,
      ];

      // También permitir la URL del túnel activo
      const tunnelService = app.get(TunnelService_ahbb);
      const urlTunel = tunnelService.getUrlPublica_ahbb();
      if (urlTunel) {
        origenesPermitidos_ahbb.push(urlTunel);
      }

      if (origenesPermitidos_ahbb.includes(origin) || origin.endsWith('.loca.lt')) {
        return callback(null, true);
      }

      // En desarrollo, ser permisivo
      return callback(null, true);
    },
    credentials: true,
  });

  // Aumentar el límite del payload JSON para admitir imágenes Base64 grandes (hasta 50mb)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.setGlobalPrefix('api');

  // Validación de datos con class-validator (DTOs): previene inyecciones
  // de datos maliciosos transformando y validando cada petición entrante.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter_ahbb());
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Habilitar hooks de cierre para que Nodemon y señales de sistema
  // cierren correctamente los recursos (como el túnel de Cloudflare).
  app.enableShutdownHooks();

  await app.listen(puerto);

  // Después de que el servidor esté escuchando, iniciamos el túnel
  const tunnelService = app.get(TunnelService_ahbb);
  await tunnelService.iniciarTunel_ahbb(puerto);
}
bootstrap();
