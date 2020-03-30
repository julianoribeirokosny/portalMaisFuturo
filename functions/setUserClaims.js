'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}

exports.default = functions.database.ref('login/{uid}/chave_principal').onWrite(
  async (change, context) => {
  console.log('#setUserClaims - iniciando.')
  console.log('===> context.params.uid', context.params.uid)
  console.log('===> change.after.val()', change.after.val())
  if (change.after.exists() && change.after.val() && change.after.val() !=="") {   
    return admin.auth().setCustomUserClaims(context.params.uid, {
      chavePrincipal: change.after.val()
    }).then(() => { 
      console.log('#setUserClaims - userClaims setada com sucesso.')
      return true
    }).catch((e) => {
      console.log('#setUserClaims - erro ao setar userClaims.', e)
      return false
    })
  } else {
    console.log('#setUserClaims - nenhuma ação tomada. Campo em branco ou apgado.')
    return 
  }
})

