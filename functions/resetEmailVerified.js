'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}


exports.default = functions.database.ref('login/{uid}/resetEmailVerified').onWrite(
  async (change, context) => {
  if (change.after.exists() && change.after.val()) {   
    admin.auth().updateUser(context.params.uid, {
      emailVerified: false
    })
    let ref = admin.database().ref(`login/${context.params.uid}`)
    ref.update({resetEmailVerified: ''})
  }
})

