'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}


exports.default = functions.database.ref('login/{uid}/resetEmailVerified').onWrite(
  async (change, context) => {
  console.log('===: change.after.exists(), change.after.val(), ', change.after.exists(), change.after.val())
  if (change.after.exists() && change.after.val()!=='') {   
    console.log('===: setando emailVerified para false')
    admin.auth().updateUser(context.params.uid, {
      emailVerified: false
    }).then(() => {
      console.log('===> email verified setado para false!')
    }).catch((e) => {
      console.log('===> Erro!', e)
    })
    console.log('===: removendo chave resetEmailVerified')    
    let ref = admin.database().ref(`login/${context.params.uid}`)
    ref.child('resetEmailVerified').remove()
    //ref.update({resetEmailVerified: ''})
  }
})

