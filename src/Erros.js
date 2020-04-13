'use strict';

import $ from 'jquery';
import FirebaseHelper from './FirebaseHelper';

export class Erros {
  static displayMensagemErro() {
    let erro = $('#mensagem-erro')  
    if (sessionStorage.erro) {
      erro.text('Erro: '+sessionStorage.erro)
    } else {
      erro.text('Erro: #001')
    }
  }

  static registraErro(type, origem) {
    let codErro = Utils.dateFormat(new Date(), true, false)+'-'+type
    sessionStorage.erro = codErro
    FirebaseHelper.logErros(codErro, origem)
  }
}