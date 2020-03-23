'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import {MaterialUtils} from './Utils';
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
    this.auth = auth;

    // Dom elements.
    this.pagesElements = $('[id^=page-]');

    // Load the rest of the app - which is split - asynchroneously to speed up initial load.
    const loadComponents = import(/* webpackPrefetch: true */ './async-loaded-components');

    // Shortcuts to async loaded components.
    const loadUser = async (userId) => (await loadComponents).userPage.loadUser(userId);
    const showHome = async () => (await loadComponents).home.showHome();
    const verificaPrimeiroLogin = async () => (await loadComponents).home.verificaPrimeiroLogin();
    //const clearFeed = async () => (await loadComponents).feed.clear();

    // Configuring middlwares.
    page(Router.setLinkAsActive);

    // Configuring routes.
    page('/', () => {
      this.displayPage('splash');
      this.redirectHomeIfSignedIn(); 
    });
    page('/home', async () => {
      if (await verificaPrimeiroLogin()) {
        this.displayPage('primeiro-login');
      } else {
        showHome();       
        this.displayPage('home', true);        
      }
    });    
    page('/about', () => {
      this.displayPage('about');
    });
    page('/simulador-emprestimo', () => {
      this.displayPage('simulador-emprestimo');
    });
    page('/rentabilidade', () => {
      this.displayPage('rentabilidade');
    });
    page('/simulador-seguro', () => {
      this.displayPage('simulador-seguro');
    });    
    page('/confirmacao-dados', () => {
      this.displayPage('confirmacao-dados');      
    });
    page('/terms', () => {this.displayPage('terms');});
    page('/user/:userId', (context) => {loadUser(context.params.userId); this.displayPage('user-info');});
    page('*', () => page('/'));
    // Start routing.
    page();
  }

  /**
   * Faz o display da página
   * if `onlyAuthed` for setado como true a splash page será demonstrada ao invés da página 
   * (para o caso do usuário não estar logado)
   * A "page" é o elemento com o ID "page-<id>" na DOM.
   */
  async displayPage(pageId, onlyAuthed) {
    if (onlyAuthed) { 
      await this.auth.waitForAuth;
      if (!firebase.auth().currentUser) {
        return page('/');
      }
    }

    this.pagesElements.each((index, element) => {
      if (element.id === 'page-' + pageId) {  
        $('#'+element.id).show()
      } else if (element.id === 'page-splash' && onlyAuthed) {
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
      const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test( userAgent );
      }
      // Detects if device is in standalone mode
      let isInStandaloneMode
      if (isIos()) {
        isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
      } else {
        isInStandaloneMode = (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      }
      //if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {      
      if (isInStandaloneMode) {
        page('/home');
      }
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
