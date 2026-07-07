import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';

/**
 * TunnelService_ahbb — Gestiona un túnel público (localtunnel)
 * para exponer el servidor local a internet.
 *
 * La URL pública generada se inyecta dinámicamente en los servicios
 * que necesitan URLs accesibles desde cualquier red (QR de facturas, etc.).
 */
@Injectable()
export class TunnelService_ahbb implements OnModuleDestroy {
  private readonly logger_ahbb = new Logger(TunnelService_ahbb.name);
  private urlPublica_ahbb: string | null = null;
  private tunnel_ahbb: any = null;

  /** Devuelve la URL pública del túnel, o null si aún no se ha iniciado. */
  getUrlPublica_ahbb(): string | null {
    return this.urlPublica_ahbb;
  }

  /**
   * Construye la URL completa de un recurso público a partir
   * de la ruta relativa (sin /api prefix).
   * Si el túnel no está activo, usa un fallback con localhost.
   */
  construirUrl_ahbb(rutaRelativa: string): string {
    const base =
      this.urlPublica_ahbb || `http://localhost:${process.env.PORT ?? 3000}`;
    // Asegurar que la ruta comience con /
    const ruta = rutaRelativa.startsWith('/')
      ? rutaRelativa
      : `/${rutaRelativa}`;
    return `${base}${ruta}`;
  }

  /**
   * Inicia el túnel localtunnel en el puerto especificado.
   * Reintenta automáticamente en caso de fallo.
   */
  async iniciarTunel_ahbb(puerto: number): Promise<string> {
    // Si ya hay un túnel activo, lo cerramos antes de iniciar uno nuevo
    if (this.tunnel_ahbb) {
      this.logger_ahbb.log('Reiniciando túnel existente...');
      await this.onModuleDestroy();
    }

    try {
      // Importación dinámica de cloudflared
      const { Tunnel, install, bin } = await import('cloudflared');

      this.logger_ahbb.log(`Verificando binario de cloudflared...`);
      if (!fs.existsSync(bin)) {
        this.logger_ahbb.log(
          `Instalando binario de cloudflared (esto puede tardar un momento)...`,
        );
        await install(bin);
      }

      this.logger_ahbb.log(
        `Iniciando túnel de Cloudflare en el puerto ${puerto}...`,
      );

      const localUrl = `http://localhost:${puerto}`;
      this.tunnel_ahbb = Tunnel.quick(localUrl);

      return new Promise((resolve, reject) => {
        // Capturar la URL generada por Cloudflare
        this.tunnel_ahbb.once('url', (url: string) => {
          this.urlPublica_ahbb = url;
          this.logger_ahbb.log(
            `═══════════════════════════════════════════════════════`,
          );
          this.logger_ahbb.log(`   TÚNEL PÚBLICO CLOUDFLARE ACTIVO`);
          this.logger_ahbb.log(`   URL: ${this.urlPublica_ahbb}`);
          this.logger_ahbb.log(
            `═══════════════════════════════════════════════════════`,
          );
          resolve(url);
        });

        // Manejar errores durante el inicio
        this.tunnel_ahbb.once('error', (err: any) => {
          this.logger_ahbb.error(
            `Error al iniciar el túnel de Cloudflare: ${err}`,
          );
          reject(err);
        });

        // Manejar eventos de desconexión o salida
        this.tunnel_ahbb.on('exit', (code: number) => {
          this.logger_ahbb.warn(
            `El proceso de cloudflared terminó con código ${code}.`,
          );
          this.urlPublica_ahbb = null;
        });
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger_ahbb.error(
        `No se pudo iniciar el túnel de Cloudflare: ${msg}`,
      );
      this.logger_ahbb.warn(
        'El servidor continuará funcionando en modo local.',
      );
      this.logger_ahbb.warn('Los QR apuntarán a localhost.');
      return `http://localhost:${puerto}`;
    }
  }

  /** Cierra el túnel al destruir el módulo. */
  async onModuleDestroy() {
    if (this.tunnel_ahbb) {
      this.logger_ahbb.log('Cerrando túnel de Cloudflare...');
      // Intentar detener el proceso de forma segura
      try {
        this.tunnel_ahbb.stop();
      } catch (e) {
        this.logger_ahbb.error(`Error al cerrar el túnel: ${e}`);
      }
      this.tunnel_ahbb = null;
      this.urlPublica_ahbb = null;
    }
  }
}
