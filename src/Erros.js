'use strict';

import $ from 'jquery';
import FirebaseHelper from './FirebaseHelper';
const utils = require('../functions/utilsFunctions')

export class Erros {
  static displayMensagemErro() {
    let erro = $('#mensagem-erro')  
    if (sessionStorage.erro) {
      erro.text('Erro: '+sessionStorage.erro)
    } else {
      erro.text('Erro: #001')
    }
  }

  static registraErro(uid, type, origem, erro) {
    let data = utils.dateFormat(new Date(), true, true, false)
    sessionStorage.erro = data+'-'+type
    let firebaseHelper = new FirebaseHelper();
    firebaseHelper.logErros(uid, data, type, origem, erro)
  }
}