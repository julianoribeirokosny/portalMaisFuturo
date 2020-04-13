'use strict';

import $ from 'jquery';
import FirebaseHelper from './FirebaseHelper';
import { Utils } from './Utils';

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
    let codErro = Utils.dateFormat(new Date(), true, false)+'-'+type
    sessionStorage.erro = codErro
    let firebaseHelper = new FirebaseHelper();
    firebaseHelper.logErros(uid, codErro, origem)
  }
}