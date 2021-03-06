'use strict';
 
/**
 * Carga de dados oriundos do Postgree
 */
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'pgCarga') {
  exports.pgCarga = require('./pgCarga').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'previdenciaDigitalCarga') {
  exports.previdenciaDigitalCarga = require('./previdenciaDigitalCarga').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'pgCargaHistContrib') {
  exports.pgCargaHistContrib = require('./pgCargaHistContrib').default;
} 
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'resetEmailVerified') {
  exports.resetEmailVerified = require('./resetEmailVerified').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'setDadosLoginUsuario') {
  exports.setDadosLoginUsuario = require('./setDadosLoginUsuario').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'setUserClaims') {
  exports.setUserClaims = require('./setUserClaims').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'solicitaEnvioEmail') {
  exports.solicitaEnvioEmail = require('./solicitaEnvioEmail').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'validaEmailLinkKey') {
  exports.validaEmailLinkKey = require('./validaEmailLinkKey').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'registraTransacoesContratacoes') {
  exports.registraTransacoesContratacoes = require('./registraTransacoesContratacoes').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'registraTransacoesCadastro') {
  exports.registraTransacoesCadastro = require('./registraTransacoesCadastro').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'buscaDadosSinqia') {
  exports.buscaDadosSinqia = require('./buscaDadosSinqia').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'apiPrevidenciaDigital') {
  exports.apiPrevidenciaDigital = require('./apiPrevidenciaDigital').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'apiPipefy') {
  exports.apiPipefy = require('./apiPipefy').default;
}
 
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'apiMAG') {
  exports.apiMAG = require('./apiMAG').default;
}

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'scheduleStatusBoleto') {
  exports.scheduleStatusBoleto = require('./scheduleStatusBoleto').default;
}