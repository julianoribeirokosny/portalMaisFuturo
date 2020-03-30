'use strict';

/**
 * Carga de dados oriundos do Postgree
 */
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'pgCarga') {
  exports.pgCarga = require('./pgCarga').default;
}


if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'resetEmailVerified') {
  exports.resetEmailVerified = require('./resetEmailVerified').default;
}

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'setUserClaimsUsuario') {
  exports.setUserClaimsUsuario = require('./setUserClaimsUsuario').default;
}

