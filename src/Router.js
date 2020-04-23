'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import {MaterialUtils} from './Utils';
import {Utils} from './Utils';
import {Erros} from './Erros';
import page from 'page';

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
      } else { 
        this.displayPage('splash-instalacao');
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
    page('/confirmacao-dados-final', () => {
      telaConfirmacaoDadosFinalConfig()
      this.displayPage('confirmacao-dados-final')
      aguardaValidaLinkPrimeiroLogin()
    });

    page('/erro', () => {
      Erros.displayMensagemErro()
      this.displayPage('erro')
    })
    page('/terms', () => {this.displayPage('terms');});
    page('/user/:userId', (context) => {loadUser(context.params.userId); this.displayPage('user-info');});
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
    this.pagesElements.each((index, element) => {
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
