'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import {MaterialUtils} from './Utils';
import {Erros} from './Erros';
import page from 'page';
import FirebaseHelper from './FirebaseHelper';

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
    this.firebaseHelper = new FirebaseHelper();

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
      if (localStorage.isPwaInstalled === "true" || localStorage.standaloneDetected === "true" || localStorage.isMac === "true") {
        this.displayPage('splash-login');
        this.redirectHomeIfSignedIn()  
      }
    });
    page('/home', async () => {
      verificaPrimeiroLogin().then((primeiroLogin) => {
        if (primeiroLogin===null) {
          Erros.registraErro(this.auth.currentUser.uid, 'auth', 'showHome', 'primeiroLogin === null')
          return page('/erro')  
        } else if (primeiroLogin) {
          telaPrimeiroLoginConfig()
          this.displayPage('primeiro-login');
        } else {
          this.validaVersaoApp().then((ok) => {
            if (ok) {
              showHome();       
              this.displayPage('home', true);        
            } else {
              Erros.registraErro(this.auth.currentUser.uid, 'appUpdate', 'redirectHomeIfSignedIn', 'Não foi possível verificar versão do App')
              return page('/erro')  
            }
          })
        }
      }).catch((e) => {
        console.log('Erro!', e)
      })
    });
    page('/instalacao-ios', () => {
      this.displayPage('instalacao-ios');
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
    page('/mais-amigos', () => {
      this.displayPage('mais-amigos')
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
    let pagina = document.querySelector(`#divFixedHeader`)
    pagina.scrollTop = 0
    //Router.scrollToTop();
  }

  /**
   * Redireciona para o home caso o usuário esteja logado.
   */
  async redirectHomeIfSignedIn() {
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

  async validaVersaoApp() {
    //valida se há nova versão do App e limpa o cache  
    console.log('==> localStorage.versao', localStorage.versao)
    let versao = await this.firebaseHelper.getVersao()
    console.log('==> versao', versao)
    if (localStorage.versao !== versao) {
      localStorage.versao = versao
      console.log('==> Limpando cache para atualização do App.')
      let p1 = new Promise((resolve) => {
        //limpa o cache
        self.caches.keys().then(keys => { 
          keys.forEach(key => {
            self.caches.delete(key)  
            console.log(key)
          }) 
          resolve(true)
        })
      })
      let p2 = new Promise((resolve) => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for(let registration of registrations) {  
            console.log(registration)
            registration.unregister();
          }
          resolve(true)
        });  
      })
      await Promise.all([p1, p2])
      return true
    } else {
      return true
    }
  }

};
