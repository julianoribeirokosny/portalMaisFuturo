'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import {MaterialUtils} from './Utils';
import {Utils} from './Utils';
import {Erros} from './Erros';
import page from 'page';

//var express = require('express')
//var cors = require('cors')
//var app = express()

// var corsOptions = {
//   origin: 'http://localhost:5000',
//   optionsSuccessStatus: 200
// }

//app.use(cors(corsOptions))

/**
 * Handles the pages/routing.
 */
export default class Router {
  /**
   * Inicializa o controller/router do Portal MaisFuturo.
   * @constructor
   */
  constructor(auth) {
    this.authCl = auth
    this.auth = firebase.auth()

    // Dom elements.
    this.pagesElements = $('[id^=page-]');

    // Carrega metodos gerais dos JS.
    const loadComponents = import(/* webpackPrefetch: true */ './async-loaded-components');
    
    const loadUser = async (userId) => (await loadComponents).userPage.loadUser(userId);
    const showHome = async () => (await loadComponents).home.showHome();
    const verificaPrimeiroLogin = async () => (await loadComponents).primeiroLogin.verificaPrimeiroLogin();
    const telaPrimeiroLoginConfig = async () => (await loadComponents).primeiroLogin.telaPrimeiroLoginConfig();
    const aguardaValidaLinkPrimeiroLogin = async () => (await loadComponents).primeiroLogin.aguardaValidaLinkPrimeiroLogin();
    const telaConfirmacaoDadosFinalConfig = async () => (await loadComponents).primeiroLogin.telaConfirmacaoDadosFinalConfig();

    // Configuring middlwares.
    page(Router.setLinkAsActive);

    // Configuring routes.
    page('/', () => {
      if (Utils.validaAppInstalado()) {
        this.displayPage('splash-login');
        this.redirectHomeIfSignedIn();  
      }
    });
    page('/home', async () => {
      if (await verificaPrimeiroLogin()) {
        telaPrimeiroLoginConfig()
        this.displayPage('primeiro-login');
      } else {
        showHome();       
        this.displayPage('home', true);        
      }
    });    
    page('/signout', () => {
      this.displayPage('splash-login');
    });
    page('/about', () => {
      this.displayPage('about');
    });    
    page('/rentabilidade', () => {
      this.displayPage('rentabilidade');
      console.log('===> ')
    });
    page('/simulador-seguro', () => {
      this.displayPage('simulador-seguro');
    });
    page('/simulador-emprestimo', () => {
      this.displayPage('simulador-emprestimo');
    });
    page('/simulador-renda', () => {
      this.displayPage('simulador-renda');
    });
    page('/contratacao-aberta', () => {
      this.displayPage('contratacao-aberta');
    });    
    page('/aviso-validacao', () => {
      this.displayPage('aviso-validacao')
      aguardaValidaLinkPrimeiroLogin()
    });
    page('/confirmacao-dados', () => {
      this.displayPage('confirmacao-dados')
    });
    page('/erro-confirmacao-dados', () => {
      this.displayPage('erro-confirmacao-dados')
    });
    page('/confirmacao-dados-final', () => {
      telaConfirmacaoDadosFinalConfig()
      this.displayPage('confirmacao-dados-final')
      aguardaValidaLinkPrimeiroLogin()
    });
    page('/cadastro', () => {
      this.displayPage('cadastro')
    });
    page('/servicos', () => {
      this.displayPage('servicos')
    });
    page('/em-construcao', () => {
      this.displayPage('em-construcao')
    });
    page('/historico-contribuicao', () => {
      this.displayPage('historico-contribuicao')
    });    
    page('/erro', () => {
      Erros.displayMensagemErro()
      this.displayPage('erro')
    })
    page('/terms', () => {this.displayPage('terms');});
    page('/user/:userId', (context) => {loadUser(context.params.userId); this.displayPage('troca-chave');});
    page('*', () => {
      page('/')
    });
    // Start routing.
    page();
  }

  /**
   * Faz o display da página
   * if `onlyAuthed` for setado como true a splash page será demonstrada ao invés da página 
   * (para o caso do usuário não estar logado)
   * A "page" é o elemento com o ID "page-<id>" na DOM.
   */
  async displayPage(pageId) {
    //sessionStorage.paginaAtual = pageId
    let divbuttonhome = document.querySelector('#divbuttonhome')
    let divavatar = document.querySelector('#divavatar')    
    if(pageId === 'home') {
      divbuttonhome.style.display = 'none'
      divavatar.style.display = 'block'
    } else {
      divbuttonhome.style.display = 'block'
      divavatar.style.display = 'none'
    }

    //console.log('PAGE_ID =====> ',pageId)
    this.pagesElements.each((index, element) => {
      //console.log('ELEMENT.ID =====> ',element.id)
      if (element.id === 'page-' + pageId) {  
        $('#'+element.id).show()
      } else if (element.id === 'page-splash-login') {
        $(element).fadeOut(1000);
        $('#'+element.id).fadeOut(1000);
      } else {
        $('#'+element.id).hide()
      }
    });

    MaterialUtils.closeDrawer();
    // Scroll to top.
    Router.scrollToTop();
  }

  /**
   * Redireciona para o home caso o usuário esteja logado.
   */
  redirectHomeIfSignedIn() {
    if (firebase.auth().currentUser) {
        page('/home');
    }
  }

  /**
   * Reload da página atual
   */
  static reloadPage() {
    let path = window.location.pathname;
    if (path === '') {
      path = '/';
    }
    page(path);
  }

  /**
   * Scrolls the page to top.
   */
  static scrollToTop() {
    $('html,body').animate({scrollTop: 0}, 0);
  }

  /**
   * Page.js middleware that highlights the correct menu item/link.
   */
  static setLinkAsActive(context, next) {
    const canonicalPath = context.canonicalPath;
    if (canonicalPath === '') {
      canonicalPath = '/';
    }
    $('.is-active').removeClass('is-active');
    $(`[href="${canonicalPath}"]`).addClass('is-active');
    next();
  }

};
