'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}

exports.default = functions.database.ref('login/{uid}/chavePrincipal').onWrite(
  async (change, context) => {
  console.log('#setUserClaimsUsuario - iniciando.')
  if (change.after.exists() && change.after.val() && change.after.val() !=="") {   
    console.log('===> context.params.uid', context.params.uid)
    console.log('===> change.after.val()', change.after.val())
    return admin.auth().setCustomUserClaims(context.params.uid, {
      chavePrincipal: change.after.val()
    }).then(() => {
      console.log('#setUserClaimsUsuario - userClaims setada com sucesso.')
    })
  } else {
    console.log('#setUserClaimsUsuario - nenhuma ação tomada. Campo em branco ou apgado.')
    return 
  }
})

