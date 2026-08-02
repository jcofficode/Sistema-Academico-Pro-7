import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditoriaService_jc } from './auditoria.service_jc';
import {
  ACCIONES_JC,
  ETIQUETAS_ACCION_JC,
  MODULOS_AUDITORIA_JC,
  resolverRegla_jc,
} from './constantes/acciones-auditoria_jc';

/** Métodos que modifican estado y, por tanto, se auditan. */
const METODOS_AUDITABLES_JC = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** Campos que jamás deben quedar escritos en la bitácora. */
const CAMPOS_SENSIBLES_JC = [
  'contrasena',
  'contrasena_ahbb',
  'contrasenaActual_ahbb',
  'contrasenaNueva_ahbb',
  'contrasena_jc',
  'password',
  'token',
];

/**
 * AuditoriaInterceptor_jc — Auditoría automática de todo el sistema.
 *
 * Se registra globalmente, de modo que **cualquier** petición que modifique
 * datos queda en la bitácora aunque su módulo no esté instrumentado. Los
 * endpoints que necesitan contexto académico se marcan como `delegado` en el
 * catálogo de reglas: allí el servicio de negocio escribe la entrada detallada
 * y el interceptor se aparta para no duplicar.
 */
@Injectable()
export class AuditoriaInterceptor_jc implements NestInterceptor {
  constructor(private readonly auditoriaService_jc: AuditoriaService_jc) {}

  intercept(contexto_jc: ExecutionContext, siguiente_jc: CallHandler): Observable<any> {
    if (contexto_jc.getType() !== 'http') {
      return siguiente_jc.handle();
    }

    const peticion_jc = contexto_jc.switchToHttp().getRequest();
    const metodo_jc = String(peticion_jc.method ?? '').toUpperCase();

    if (!METODOS_AUDITABLES_JC.includes(metodo_jc)) {
      return siguiente_jc.handle();
    }

    // La ruta llega con el prefijo global /api: se retira para que las reglas
    // del catálogo se escriban con la ruta "de negocio".
    const ruta_jc = String(peticion_jc.originalUrl ?? peticion_jc.url ?? '')
      .split('?')[0]
      .replace(/^\/api/, '');

    const regla_jc = resolverRegla_jc(metodo_jc, ruta_jc);
    if (regla_jc?.delegado) {
      return siguiente_jc.handle();
    }

    const inicio_jc = Date.now();
    const usuario_jc = peticion_jc.usuario_ahbb;

    const registrar_jc = (resultado_jc: 'EXITO' | 'ERROR', estadoHttp_jc: number) => {
      const accion_jc = regla_jc?.accion ?? ACCIONES_JC.OPERACION_GENERICA;
      const descripcion_jc = regla_jc
        ? regla_jc.descripcion
        : `realizó una operación (${metodo_jc} ${ruta_jc})`;

      // Los intentos rechazados se etiquetan con el nombre de la acción para
      // que la frase siga leyéndose bien ("intento rechazado — Carga de notas").
      const descripcionFinal_jc =
        resultado_jc === 'ERROR'
          ? `intento rechazado — ${ETIQUETAS_ACCION_JC[accion_jc] ?? `${metodo_jc} ${ruta_jc}`}`
          : descripcion_jc;

      void this.auditoriaService_jc.registrarConAutor_jc(usuario_jc?.sub, {
        modulo_jc: regla_jc?.modulo ?? MODULOS_AUDITORIA_JC.SISTEMA,
        accion_jc,
        descripcion_jc: descripcionFinal_jc,
        resultado_jc,
        metodo_jc,
        ruta_jc,
        estadoHttp_jc,
        duracionMs_jc: Date.now() - inicio_jc,
        ip_jc: this.obtenerIp_jc(peticion_jc),
        detalle_jc: this.depurarCuerpo_jc(peticion_jc.body),
        // En el inicio de sesión todavía no hay usuario autenticado: se deja
        // constancia del correo intentado para no perder el rastro.
        identidadDeclarada_jc: usuario_jc
          ? undefined
          : this.identidadDeclarada_jc(peticion_jc.body),
      });
    };

    return siguiente_jc.handle().pipe(
      tap({
        next: () => {
          const respuesta_jc = contexto_jc.switchToHttp().getResponse();
          registrar_jc('EXITO', respuesta_jc?.statusCode ?? 200);
        },
        error: (error_jc) => {
          registrar_jc('ERROR', error_jc?.status ?? 500);
        },
      }),
    );
  }

  /**
   * Identidad que el propio cuerpo de la petición declara. Sirve para el
   * inicio de sesión, donde aún no hay token: así la bitácora muestra
   * "juan@correo.com inició sesión" en lugar de un autor vacío.
   */
  private identidadDeclarada_jc(cuerpo_jc: any): string | undefined {
    const correo_jc = cuerpo_jc?.correo_ahbb ?? cuerpo_jc?.correo;
    return typeof correo_jc === 'string' && correo_jc.length > 0
      ? correo_jc
      : undefined;
  }

  /** Toma la IP real cuando la aplicación corre detrás de un proxy inverso. */
  private obtenerIp_jc(peticion_jc: any): string {
    const reenviada_jc = peticion_jc.headers?.['x-forwarded-for'];
    if (typeof reenviada_jc === 'string' && reenviada_jc.length > 0) {
      return reenviada_jc.split(',')[0].trim();
    }
    return peticion_jc.ip ?? peticion_jc.socket?.remoteAddress ?? 'desconocida';
  }

  /**
   * Copia superficial del cuerpo sin credenciales ni adjuntos, y acotada en
   * tamaño para que la bitácora no crezca sin control.
   */
  private depurarCuerpo_jc(cuerpo_jc: any): Record<string, unknown> | null {
    if (!cuerpo_jc || typeof cuerpo_jc !== 'object' || Array.isArray(cuerpo_jc)) {
      return null;
    }

    const depurado_jc: Record<string, unknown> = {};
    for (const [clave_jc, valor_jc] of Object.entries(cuerpo_jc)) {
      if (CAMPOS_SENSIBLES_JC.includes(clave_jc)) {
        depurado_jc[clave_jc] = '«oculto»';
        continue;
      }
      if (typeof valor_jc === 'object' && valor_jc !== null) {
        const serializado_jc = JSON.stringify(valor_jc);
        depurado_jc[clave_jc] =
          serializado_jc.length > 400
            ? `${serializado_jc.slice(0, 400)}…`
            : valor_jc;
        continue;
      }
      depurado_jc[clave_jc] = valor_jc;
    }
    return Object.keys(depurado_jc).length > 0 ? depurado_jc : null;
  }
}
