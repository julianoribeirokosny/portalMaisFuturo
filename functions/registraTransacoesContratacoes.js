'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}


exports.default = functions.database.ref('usuarios/{chave}/transacoes/contratacoes/{data}')
  .onWrite((change, context) => {

    if (!change.after.exists() || change.after.val()==='') {
        console.log('#registraTransacoesContratacoes - campo excluído ou apagado. Nenhum email enviado.')
        return false
    }   

    //atualiza chave de transacoes do Admin
    let ref = admin.database().ref('admin/transacoes/contratacoes/'+context.params.chave+'/'+context.params.data)
    ref.update(change.after.val())

    return true
})
