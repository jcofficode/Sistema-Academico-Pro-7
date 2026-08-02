import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLES_JC } from '../../common/constantes/roles_jc';

const ROLES_ADMITIDOS_JC = Object.values(ROLES_JC);

/** Alta de usuario desde la consola de Roles y Accesos del administrador. */
export class CrearUsuarioRbacDto_jc {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100)
  nombre_jc!: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @MaxLength(100)
  apellido_jc!: string;

  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria.' })
  @MaxLength(50)
  cedula_jc!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  correo_jc!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres.' })
  contrasena_jc!: string;

  @IsIn(ROLES_ADMITIDOS_JC, {
    message: `El rol debe ser uno de: ${ROLES_ADMITIDOS_JC.join(', ')}.`,
  })
  rol_jc!: string;

  /** Si es true, el usuario deberá cambiar la contraseña en su primer acceso. */
  @IsOptional()
  requiereCambioContrasena_jc?: boolean;
}

/** Cambio de rol de un usuario existente. */
export class AsignarRolDto_jc {
  @IsIn(ROLES_ADMITIDOS_JC, {
    message: `El rol debe ser uno de: ${ROLES_ADMITIDOS_JC.join(', ')}.`,
  })
  rol_jc!: string;
}

/** Restablecimiento de contraseña hecho por el administrador. */
export class RestablecerContrasenaDto_jc {
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(72)
  contrasena_jc!: string;

  @IsOptional()
  requiereCambioContrasena_jc?: boolean;
}

/** Activación o desactivación de una cuenta. */
export class CambiarEstadoCuentaDto_jc {
  @IsIn(['ACTIVO', 'INACTIVO', 'PENDIENTE_APROBACION'], {
    message: 'El estado debe ser ACTIVO, INACTIVO o PENDIENTE_APROBACION.',
  })
  estadoCuenta_jc!: string;
}
