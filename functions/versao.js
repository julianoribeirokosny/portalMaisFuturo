'use strict';
const functions = require('firebase-functions');

exports.default = functions.https.onRequest((req, res) => {
    const versao = require('./versao.json')
    console.log(`Controle de versão - Portal Mais Futuro: `, versao.versao)
    return res.status(200).send(versao.versao)
})