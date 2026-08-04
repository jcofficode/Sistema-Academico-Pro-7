import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RegistrarNotaContingenciaDto_ga } from './dto/contingencia-nota.dto_ga';
import { CrearPlanificacionDto_ga } from './dto/crear-planificacion.dto_ga';
import { PlanesEstudioService_ga } from './planes-estudio.service_ga';

/**
 * Configuración de almacenamiento Multer para los archivos del programa oficial
 */
const configuracionAlmacenamientoMulter_ga = {
  storage: diskStorage({
    destination: './uploads/programas',
    filename: (req, file, callback) => {
      const sufijoUnico_ga = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension_ga = extname(file.originalname).toLowerCase();
      callback(null, `programa-${sufijoUnico_ga}${extension_ga}`);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    const extensionesPermitidas_ga = ['.pdf', '.docx'];
    const ext_ga = extname(file.originalname).toLowerCase();
    if (!extensionesPermitidas_ga.includes(ext_ga)) {
      return callback(
        new BadRequestException('Solo se permiten archivos en formato PDF o Word (.pdf, .docx)'),
        false,
      );
    }
    callback(null, true);
  },
};

/**
 * Controlador REST para el Módulo de Planificación Curricular (_ga)
 */
@Controller('planes-estudio_ga')
@UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
export class PlanesEstudioController_ga {
  constructor(private readonly planesEstudioService_ga: PlanesEstudioService_ga) {}

  /**
   * Carga del Archivo Oficial del Programa de Estudio (PDF / DOCX)
   */
  @Post('upload-programa')
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN')
  @UseInterceptors(FileInterceptor('programa_ga', configuracionAlmacenamientoMulter_ga))
  async subirProgramaOficial_ga(@UploadedFile() file_ga: Express.Multer.File) {
    console.log('[PlanesEstudioController_ga] Petición recibida para subida de programa oficial');
    if (!file_ga) {
      throw new BadRequestException('Debe adjuntar un archivo de programa oficial (.pdf o .docx)');
    }

    // Ruta relativa accesible vía /uploads/programas/<filename>
    const urlRelativa_ga = `/uploads/programas/${file_ga.filename}`;
    console.log(`[PlanesEstudioController_ga] Archivo subido con éxito: ${urlRelativa_ga}`);

    return {
      exito_ga: true,
      mensaje_ga: 'Programa oficial subido y almacenado correctamente',
      programaUrl_ga: urlRelativa_ga,
      nombreOriginal_ga: file_ga.originalname,
    };
  }

  /**
   * Guardado Integral de la Planificación Docente en Bloque
   */
  @Post('guardar-completo')
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN')
  async guardarPlanificacionCompleta_ga(
    @Req() req_ga: any,
    @Body() dto_ga: CrearPlanificacionDto_ga,
  ) {
    console.log('[PlanesEstudioController_ga] Petición recibida para guardar planificación completa');
    // El JWT guard registra el payload en request.usuario_ahbb (no en request.user)
    const idProfesor_ga = req_ga.usuario_ahbb?.id_usuario_ahbb || req_ga.usuario_ahbb?.sub;
    console.log(`[PlanesEstudioController_ga] Profesor ID extraído del JWT: ${idProfesor_ga}`);

    const planificacion_ga = await this.planesEstudioService_ga.guardarPlanificacionCompleta_ga(
      idProfesor_ga,
      dto_ga,
    );

    return {
      exito_ga: true,
      mensaje_ga: 'Planificación docente guardada exitosamente en bloque',
      datos_ga: planificacion_ga,
    };
  }

  /**
   * Obtiene la planificación completa de una materia y período
   */
  @Get('materia/:idMateria/periodo/:idPeriodo')
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN', 'CONTROL_ESTUDIOS', 'ALUMNO')
  async obtenerPlanificacion_ga(
    @Param('idMateria', ParseIntPipe) idMateria_ga: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
  ) {
    console.log(`[PlanesEstudioController_ga] Consultando planificación para materia ${idMateria_ga} y período ${idPeriodo_ga}`);
    try {
      const planificacion_ga = await this.planesEstudioService_ga.obtenerPlanificacionPorMateriaPeriodo_ga(
        idMateria_ga,
        idPeriodo_ga,
      );
      return { exito_ga: true, datos_ga: planificacion_ga };
    } catch {
      // Si no existe planificación, devolver null en lugar de 404 para modo Editar vs Crear
      return { exito_ga: false, datos_ga: null };
    }
  }

  /**
   * Endpoint Exclusivo de Contingencia para el Rol Jefe de Control de Estudio
   */
  @Post('contingencia-nota')
  @RolesDecorator_ahbb('CONTROL_ESTUDIOS')
  async registrarNotaContingencia_ga(
    @Req() req_ga: any,
    @Body() dto_ga: RegistrarNotaContingenciaDto_ga,
  ) {
    console.log('[PlanesEstudioController_ga] Acceso al endpoint de contingencia por Control de Estudios');
    const idUsuarioControl_ga = req_ga.usuario_ahbb?.id_usuario_ahbb || req_ga.usuario_ahbb?.sub;

    const resultado_ga = await this.planesEstudioService_ga.registrarNotaContingencia_ga(
      idUsuarioControl_ga,
      dto_ga,
    );

    return {
      exito_ga: true,
      mensaje_ga: 'Nota por contingencia registrada exitosamente por Control de Estudios',
      datos_ga: resultado_ga,
    };
  }

  /**
   * Obtiene la bandeja de revisión de planes para un período (Admin / Control de Estudios)
   */
  @Get('bandeja/periodo/:idPeriodo')
  @RolesDecorator_ahbb('ADMIN', 'CONTROL_ESTUDIOS')
  async obtenerBandejaRevision_ga(@Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number) {
    console.log(`[PlanesEstudioController_ga] Consultando bandeja de revisión para período ${idPeriodo_ga}`);
    return this.planesEstudioService_ga.obtenerBandejaRevision_ga(idPeriodo_ga);
  }

  /**
   * Aprueba o devuelve un plan de estudio entregado por un profesor
   */
  @Post('revisar/:idPlanificacion')
  @RolesDecorator_ahbb('ADMIN', 'CONTROL_ESTUDIOS')
  async revisarPlan_ga(
    @Req() req_ga: any,
    @Param('idPlanificacion', ParseIntPipe) idPlanificacion_ga: number,
    @Body('accion_ga') accion_ga: 'APROBADO' | 'DEVUELTO',
    @Body('observacion_ga') observacion_ga?: string,
  ) {
    console.log(`[PlanesEstudioController_ga] Revisando plan ${idPlanificacion_ga} → Acción: ${accion_ga}`);
    const idRevisor_ga = req_ga.usuario_ahbb?.id_usuario_ahbb || req_ga.usuario_ahbb?.sub || 1;

    const planActualizado_ga = await this.planesEstudioService_ga.revisarPlan_ga(
      idPlanificacion_ga,
      idRevisor_ga,
      accion_ga,
      observacion_ga,
    );

    return {
      exito: true,
      mensaje: `Planificación ${accion_ga === 'APROBADO' ? 'aprobada' : 'devuelta con observaciones'} exitosamente.`,
      planificacion_ga: planActualizado_ga,
    };
  }

  /**
   * Descarga la Plantilla Excel (.xlsx) Oficial para el Cronograma de Evaluación
   */
  @Get('plantilla-excel')
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN')
  descargarPlantillaExcel_ga(@Res() res_ga: Response) {
    console.log('[PlanesEstudioController_ga] Petición para descargar plantilla Excel');
    const buffer_ga = this.planesEstudioService_ga.generarPlantillaExcel_ga();

    res_ga.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res_ga.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Cronograma_UNE_ga.xlsx');
    return res_ga.send(buffer_ga);
  }

  /**
   * Importa y procesa un archivo Excel (.xlsx) con el cronograma de evaluación
   */
  @Post('importar-excel')
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN')
  @UseInterceptors(FileInterceptor('excel_ga'))
  async importarCronogramaExcel_ga(@UploadedFile() file_ga: Express.Multer.File) {
    console.log('[PlanesEstudioController_ga] Petición para importar cronograma desde Excel');
    if (!file_ga || !file_ga.buffer) {
      throw new BadRequestException('Debe adjuntar un archivo Excel (.xlsx) válido.');
    }

    return this.planesEstudioService_ga.importarCronogramaExcel_ga(file_ga.buffer);
  }

  /**
   * Exporta la planificación activa de una materia a formato Excel (.xlsx)
   */
  @Get('exportar-excel/materia/:idMateria/periodo/:idPeriodo')
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN', 'CONTROL_ESTUDIOS', 'ALUMNO')
  async exportarPlanExcel_ga(
    @Param('idMateria', ParseIntPipe) idMateria_ga: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
    @Res() res_ga: Response,
  ) {
    console.log(`[PlanesEstudioController_ga] Petición para exportar plan a Excel: materia ${idMateria_ga}, período ${idPeriodo_ga}`);
    const buffer_ga = await this.planesEstudioService_ga.exportarPlanExcel_ga(idMateria_ga, idPeriodo_ga);

    res_ga.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res_ga.setHeader('Content-Disposition', `attachment; filename=Cronograma_Materia_${idMateria_ga}_Periodo_${idPeriodo_ga}.xlsx`);
    return res_ga.send(buffer_ga);
  }
}

