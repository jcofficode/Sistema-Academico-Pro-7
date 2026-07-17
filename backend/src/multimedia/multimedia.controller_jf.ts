import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  Res,
  Headers,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpStatus,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { MultimediaService_jf } from './multimedia.service_jf';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';
import type { Response } from 'express';
import {
  CrearBloqueDto_jf,
  ActualizarBloqueDto_jf,
  CrearLeccionDto_jf,
  ActualizarLeccionDto_jf,
  GuardarProgresoDto_jf,
  GuardarEvaluacionDto_jf,
  IntentarEvaluacionDto_jf,
  CrearSalaVideollamadaDto_jf,
} from './dto/multimedia.dto_jf';

@Controller('multimedia')
@UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
export class MultimediaController_jf {
  constructor(private readonly multimediaService: MultimediaService_jf) {}

  // ─── BLOQUES ──────────────────────────────────────────────────

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('bloques')
  async crearBloque(
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: CrearBloqueDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.crearBloque(usuarioId, datos);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Put('bloques/:id')
  async actualizarBloque(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: ActualizarBloqueDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.actualizarBloque(id, usuarioId, datos);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Delete('bloques/:id')
  async eliminarBloque(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.eliminarBloque(id, usuarioId);
  }

  // ─── LECCIONES ─────────────────────────────────────────────────

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('lecciones')
  async crearLeccion(
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: CrearLeccionDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.crearLeccion(usuarioId, datos);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Put('lecciones/:id')
  async actualizarLeccion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: ActualizarLeccionDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.actualizarLeccion(id, usuarioId, datos);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Delete('lecciones/:id')
  async eliminarLeccion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.eliminarLeccion(id, usuarioId);
  }

  // ─── SUBIR VIDEO MULTIPART ─────────────────────────────────────

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('lecciones/:id/subir-video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'lecciones_jf');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
          return cb(new BadRequestException('Solo se permiten archivos de video.'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 Megabytes máximo
      },
    }),
  )
  async subirVideo(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo de video requerido.');
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.guardarVideoLeccion(id, usuarioId, file);
  }

  // ─── STREAMING DE VIDEO CON RANGE ──────────────────────────────

  @Get('lecciones/:id/video')
  async streamVideo(
    @Param('id', ParseIntPipe) id: number,
    @Headers('range') range: string,
    @Req() req: RequestConUsuario_ahbb,
    @Res() res: any,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    const leccion = await this.multimediaService.obtenerLeccionParaStream(id, usuarioId);

    if (!leccion || !leccion.urlArchivo_jf) {
      return res.status(HttpStatus.NOT_FOUND).json({ mensaje: 'Video no encontrado en esta lección.' });
    }

    const videoPath = join(process.cwd(), leccion.urlArchivo_jf);

    if (!fs.existsSync(videoPath)) {
      return res.status(HttpStatus.NOT_FOUND).json({ mensaje: 'El archivo físico de video no existe.' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, {
          'Content-Range': `bytes */${fileSize}`,
        });
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(HttpStatus.PARTIAL_CONTENT, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(HttpStatus.OK, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  }

  // ─── CONSULTAR CONTENIDO DE CURSO ──────────────────────────────

  @Get('cursos/:id_curso/contenido')
  async obtenerContenidoCurso(
    @Param('id_curso', ParseIntPipe) idCurso: number,
    @Req() req: RequestConUsuario_ahbb,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    const rol = req.usuario_ahbb?.rol || 'ALUMNO';
    return this.multimediaService.obtenerContenidoCurso(idCurso, usuarioId, rol);
  }

  // ─── REGISTRAR PROGRESO LECCIÓN ────────────────────────────────

  @RolesDecorator_ahbb('ALUMNO')
  @Post('lecciones/:id/progreso')
  async registrarProgresoLeccion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: GuardarProgresoDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.registrarProgresoLeccion(
      id,
      usuarioId,
      datos.completada_jf,
      datos.porcentajeVisto_jf,
    );
  }

  // ─── EVALUACIONES ──────────────────────────────────────────────

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('evaluaciones')
  async guardarEvaluacion(
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: GuardarEvaluacionDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.guardarEvaluacion(usuarioId, datos);
  }

  @RolesDecorator_ahbb('ALUMNO')
  @Post('evaluaciones/:id/intentar')
  @HttpCode(HttpStatus.OK)
  async resolverEvaluacion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: IntentarEvaluacionDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.resolverEvaluacion(id, usuarioId, datos.respuestasAlumnoJson_jf);
  }

  // ─── VIDEOLLAMADAS (SALA DE CONFERENCIAS) ──────────────────────

  @Get('cursos/:id_curso/salas-videollamadas')
  async obtenerSalasCurso(
    @Param('id_curso', ParseIntPipe) idCurso: number,
    @Req() req: RequestConUsuario_ahbb,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    const rol = req.usuario_ahbb?.rol || 'ALUMNO';
    return this.multimediaService.obtenerSalasCurso(idCurso, usuarioId, rol);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('salas-videollamadas')
  async crearSalaVideollamada(
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: CrearSalaVideollamadaDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.crearSalaVideollamada(usuarioId, datos);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('salas-videollamadas/crear')
  async crearVideollamada(
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: CrearSalaVideollamadaDto_jf,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.crearSalaVideollamada(usuarioId, datos);
  }

  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Patch('salas-videollamadas/:id/estado')
  async actualizarEstadoSala(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
    @Body() datos: { estado: string },
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    return this.multimediaService.actualizarEstadoSala(id, usuarioId, datos.estado);
  }

  @Get('salas-videollamadas/:id/acceso')
  async accederASala(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario_ahbb,
  ) {
    const usuarioId = Number(req.usuario_ahbb?.sub);
    const rol = req.usuario_ahbb?.rol || 'ALUMNO';
    return this.multimediaService.accederASala(id, usuarioId, rol);
  }
}
