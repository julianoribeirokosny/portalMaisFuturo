'use strict';

import $ from 'jquery';
import FirebaseHelper from './FirebaseHelper';
import {Utils} from './Utils';

export class Erros {
  static displayMensagemErro() {
    let erro = $('#mensagem-erro')  
    if (sessionStorage.erro) {
      erro.text('Erro: '+sessionStorage.erro)
    } else {
      erro.text('Erro: #001')
    }
  }

  static registraErro(uid, type, origem) {
    let data = Utils.dateFormat(new Date(), true, true)
    sessionStorage.erro = data+'-'+type
    let firebaseHelper = new FirebaseHelper();
    firebaseHelper.logErros(uid, data, type, origem)
  }
}