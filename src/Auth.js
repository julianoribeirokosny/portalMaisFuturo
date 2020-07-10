'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
//import * as firebaseui from 'firebaseui';
import Router from './Router';
import page from 'page';
import {Utils} from './Utils';
import FirebaseHelper from './FirebaseHelper';
import PrimeiroLogin from './PrimeiroLogin';

/**
 * Handles the user auth flows and updating the UI depending on the auth state.
 */
export default class Auth {
  /**
   * Returns a Promise that completes when auth is ready.
   * @return Promise
   */
  get waitForAuth() {
    return this._waitForAuthPromiseResolver.promise();
  }

  /**
   * Initializes Friendly Pix's auth.
   * Binds the auth related UI components and handles the auth flow.
   * @constructor
   */
  constructor() {
    // Firebase SDK
    //firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
    this.auth = firebase.auth()
    this.auth.languageCode = 'pt-BR';
    this._waitForAuthPromiseResolver = new $.Deferred();
    this.firebaseHelper = new FirebaseHelper();
    this.primeiroLogin = new PrimeiroLogin(this.firebaseHelper);

    // Pointers to DOM Elements
    const signedInUserContainer = $('.fp-signed-in-user-container');
    this.signedInUserAvatar = $('.fp-avatar', signedInUserContainer);
    this.signedInUsername = $('.fp-username', signedInUserContainer);
    this.signOutButton = $('.fp-sign-out');
    this.deleteAccountButton = $('.fp-delete-account');
    this.usernameLink = $('.fp-usernamelink');
    this.updateAll = $('.fp-update-all');
    this.uploadButton = $('button#add');
    this.mobileUploadButton = $('button#add-floating');
    this.preConsentCheckbox = $('#fp-pre-consent');
    this.confirmDadosButton = $('.fp-confirm-dados')
    this.cancelarDadosButton = $('.fp-cancelar-dados')
    this.confirmVoltarButton = $('.fp-confirm-voltar')
    this.avisoValidacaoButton = $('.fp-aviso-validacao')
    this.confirmDadosButton2 = $('.fp-confirm-dados2')   

    // Configure Firebase UI.
    this.configureFirebaseUi();

    // Event bindings
    this.preConsentCheckbox.change(() => {
      const checked = this.preConsentCheckbox.is(':checked');
      const IDPButtons = $('.firebaseui-idp-button');
      if (checked) {
        IDPButtons.removeAttr('disabled');
      } else {
        IDPButtons.attr('disabled', 'disabled');
      }
    });
    this.signOutButton.click(() => this.firebaseHelper.signOut());
    this.deleteAccountButton.click(() => this.deleteAccount());
    this.updateAll.click(() => this.updateAllAccounts());
    this.auth.onAuthStateChanged((user) => this.onAuthStateChanged(user));
    this.avisoValidacaoButton.click(async () => {
      //if (! await this.firebaseHelper.enviarEmailLinkValidacao('firebase')) {
      let nome = sessionStorage.nome && sessionStorage.nome !== '' ? sessionStorage.nome : ''
      if (! await this.firebaseHelper.enviarEmailLinkValidacao('proprio', sessionStorage.emailCadastro, nome)) {
        page('/erro')  
      } else {
        page('/aviso-validacao')  
      }
      
    })
    this.confirmDadosButton.click(() => {      
      let celular = document.querySelector('#celular').value
      let email = document.querySelector('#email').value      
      this.primeiroLogin.confirmEmailFone(celular, email);
    });
    this.cancelarDadosButton.click(() => {
      this.firebaseHelper.signOut()
    });
    this.confirmVoltarButton.click(() => {
      page('/primeiro-login')
    });
    this.confirmDadosButton2.click(() => {
      let cpf = $('.fp-input-cpf').val()
      this.primeiroLogin.confirmDados(cpf);
    });
  }  

  configureFirebaseUi() {
    // Confgiure and add the FirebaseUI Widget
    let signInFlow = 'popup';
    // For iOS full screen apps we use the redirect auth mode.
    console.log(`'standalone' in window.navigator `, 'standalone' in window.navigator)
    if (('standalone' in window.navigator)
        && window.navigator.standalone) {
      signInFlow = 'redirect';
    }

    // FirebaseUI config.
    //firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    this.uiConfig = {
      'signInSuccessUrl': '/',
      'signInFlow': signInFlow,
      'signInOptions': [
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: {
            prompt: 'select_account' //força sempre pedir o usuário do Google na entrada/login
          }
        },        
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        {provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          defaultCountry: 'BR',
          recaptchaParameters: {
            type: 'image', // 'audio'
            size: 'invisible', // 'invisible' or 'compact'
            badge: 'bottomright' //' bottomright' or 'inline' applies to invisible.
          },
        }
      ],
      'callbacks': {
        'uiShown': function() {
          //const IDPButtons = $('.firebaseui-idp-button');           
          //IDPButtons.attr('disabled', 'disabled');

          /*const intervalId = setInterval(() => {
            const IDPButtons = $('.firebaseui-idp-button');           
            const nbIDPButtonDisplayed = IDPButtons.length;
            if (nbIDPButtonDisplayed > 0) {
              clearInterval(intervalId);
              if (!$('#fp-pre-consent').is(':checked')) {
                IDPButtons.attr('disabled', 'disabled');
              }
            }
          }, 1);*/
        },
      },
    };
    this.firebaseUi = new firebaseui.auth.AuthUI(firebase.auth());
  }

  /**
   * Displays the signed-in user information in the UI or hides it and displays the
   * "Sign-In" button if the user isn't signed-in.
   */
  async onAuthStateChanged(user) {
    console.log('onAuthStateChanged -> Auth')
    if (Utils.isSupportedNotification()) {
      console.log('Push suportado!');
    } else {
      console.log('Push NÃO suportado!')
    }
    //************************************************************ */
    // Reload the page unless this is the first time being loaded and no signed-in user.
    if (this._waitForAuthPromiseResolver.state() !== 'pending' || user) {
      this.validaVersaoApp().then((ok) => {
        if (ok) {    
          console.log('===> Reloading Page!')
          Router.reloadPage();
        } else {
          Erros.registraErro(this.auth.currentUser.uid, 'appUpdate', 'redirectHomeIfSignedIn', 'Não foi possível verificar versão do App')
          return page('/erro')  
        }
      })
      //return
    }

    const div_install = document.querySelector('#div-install');
    if (localStorage.isPwaInstalled === "true" || localStorage.standaloneDetected === "true") {
      div_install.style.display = 'none';   
    }

    this._waitForAuthPromiseResolver.resolve();
    document.body.classList.remove('fp-auth-state-unknown');
    if (!user) {
      this.userId = null;
      this.signedInUserAvatar.css('background-image', '');
      this.firebaseUi.start('#firebaseui-auth-container', this.uiConfig);
      //this.firebaseUi.disableAutoSignIn();      
      document.body.classList.remove('fp-signed-in');
      document.body.classList.add('fp-signed-out');
      Auth.disableAdminMode();
    } else {
      debugger      
      if (!sessionStorage.chave || sessionStorage.chave === "undefined" || sessionStorage.chave === '' || sessionStorage.chave === '[object Promise]') {
          sessionStorage.chave = await this.firebaseHelper.getUsuarioChavePrincipal(user.uid)
      }
      let photoUrl = user.photoURL
      let stringURL = `gs://portalmaisfuturo-teste.appspot.com/usuarios/${sessionStorage.chave}/avatar.jpg`

      const avatarStorage = (url) => {
          photoUrl = url ? url :  photoUrl
          this.signedInUserAvatar.css('background-image', `url("${Utils.addSizeToGoogleProfilePic(photoUrl) || '/images/silhouette.jpg'}")`)
      }
      this.firebaseHelper.downloadStorageFile(stringURL,avatarStorage)      
      this.toggleAdminMode();
      document.body.classList.remove('fp-signed-out');
      document.body.classList.add('fp-signed-in');
      this.userId = user.uid;
      this.signedInUsername.text(user.displayName || 'Anonymous');
      this.usernameLink.attr('href', `/user/${user.uid}`);   
    }
  }

  /**
   * Displays the Admin features if the user has the "admin=true" custom claim in its ID token. 
   */
  async toggleAdminMode() {    
    try {    
      //debugger
      // Auth.disableAdminMode()
      // const idToken = await this.auth.currentUser.getIdToken();
      // let split = idToken.split('.')[1]
      // let wind = window.atob(split)
      const isAdmin = undefined// JSON.parse(wind).admin;
      if (isAdmin) {
        Auth.enableAdminMode()
      } else {
        Auth.disableAdminMode()
      }
    } catch (e) {
      console.error('Error while checking for Admin priviledges', e)
      Auth.disableAdminMode()
    }
  }

  /**
   * Turn the UI into admin mode.
   */
  static enableAdminMode() {
    document.body.classList.add('fp-admin');
  }

  /**
   * Switch off admin mode in the UI.
   */
  static disableAdminMode() {
    document.body.classList.remove('fp-admin');
  }

  async deleteAccount() {
    try {
      await this.auth.currentUser.delete();
      window.alert('Account deleted');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        window.alert('You need to have recently signed-in to delete your account.\n' +
            'Please sign-in and try again.');
        if (this.auth) {
          this.auth.signOut();
        }
        page('/');
      }
    }
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
      return Promise.all([p1, p2]).then(() => {
        return true
      })
    } else {
      return true
    }
  }


};
