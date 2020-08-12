'use strict'
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const mag = require('./mag.js')

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

exports.default = functions.https.onCall((data, context) => {    
    console.log('#apiMAG - iniciando...')
    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}

    return mag.run(data, functions, admin)
})


