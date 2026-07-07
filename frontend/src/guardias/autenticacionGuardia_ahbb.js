const obtenerUsuarioActivo_ahbb = () => {
  // El token está en sessionStorage (más seguro que localStorage)
  // El perfil del usuario NO se guarda en disco por seguridad (PII)
  // Solo verificamos que exista un token de sesión válido
  const token_ahbb = sessionStorage.getItem('certificaciones_token_ahbb');
  return token_ahbb ? true : null;
};

const obtenerRolUsuario_ahbb = () => {
  // El rol del usuario ya no se persiste en disco
  // El guard de roles se maneja mediante el store de Pinia en las vistas
  return null;
};

export const guardiaNavegacion_ahbb = (
  destino_ahbb,
  _origen_ahbb,
  siguiente_ahbb,
) => {
  const esPublica_ahbb = destino_ahbb.meta.publica_ahbb === true;
  const usuario_ahbb = obtenerUsuarioActivo_ahbb();
  const estaAutenticado_ahbb = usuario_ahbb !== null;

  if (esPublica_ahbb && !estaAutenticado_ahbb) {
    siguiente_ahbb();
    return;
  }

  if (
    estaAutenticado_ahbb &&
    (destino_ahbb.name === 'login' || destino_ahbb.name === 'registro')
  ) {
    siguiente_ahbb({ name: 'dashboard' });
    return;
  }

  if (esPublica_ahbb && estaAutenticado_ahbb) {
    siguiente_ahbb();
    return;
  }

  if (!estaAutenticado_ahbb) {
    siguiente_ahbb({ name: 'login' });
    return;
  }

  // El control de roles por vista se delega al store de Pinia (el perfil está en memoria)
  siguiente_ahbb();
};

