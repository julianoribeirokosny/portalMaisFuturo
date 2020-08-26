'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pipefy = require('./pipefy.js')

try {
    admin.initializeApp();
} catch (e) { 
    console.error('Erro ao inicializar o firebase', e) 
}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

exports.default = functions.runWith(runtimeOpts).https.onCall((data, context) => {
    console.log('#apiPipefy - iniciando...')
    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}

    return pipefy.run(data, functions, admin)
})

