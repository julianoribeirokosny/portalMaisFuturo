'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}

exports.default = functions.database.ref('login/{uid}/email_principal').onWrite(
  async (change, context) => {
  console.log('#setDadosLoginUsuario - iniciando.')
  console.log('===> context.params.uid', context.params.uid)
  console.log('===> change.after.val()', change.after.val())
  if (change.after.exists() && change.after.val() && change.after.val() !=="") {   
    let email = change.after.val()
    return admin.auth().updateUser(context.params.uid, {email: email})
    .then(() => { 
      console.log('#setDadosLoginUsuario - Dados do login do usuário alterados com sucesso.')
      return true
    }).catch((e) => {
      console.log('#setDadosLoginUsuario - erro ao alterar dados do login do usuário.', e)
      return false
    })
  } else {
    console.log('#setDadosLoginUsuario - nenhuma ação tomada. Campo em branco ou apgado.')
    return 
  }
})

