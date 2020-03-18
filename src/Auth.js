/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
//import * as firebaseui from 'firebaseui';
import Router from './Router';
import page from 'page';
import {Utils} from './Utils';

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
    this.auth = firebase.auth();
        this.auth.languageCode = 'pt-BR';
    this._waitForAuthPromiseResolver = new $.Deferred();

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
    this.signOutButton.click(() => this.signOut());
    this.deleteAccountButton.click(() => this.deleteAccount());
    this.updateAll.click(() => this.updateAllAccounts());

    this.auth.onAuthStateChanged((user) => this.onAuthStateChanged(user));
  }

  configureFirebaseUi() {
    // Confgiure and add the FirebaseUI Widget
    let signInFlow = 'popup';
    // For iOS full screen apps we use the redirect auth mode.
    if (('standalone' in window.navigator)
        && window.navigator.standalone) {
      signInFlow = 'redirect';
    }

    // FirebaseUI config.
    this.uiConfig = {
      'signInFlow': signInFlow,
      'signInOptions': [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ],
      'callbacks': {
        'uiShown': function() {
          const intervalId = setInterval(() => {
            const IDPButtons = $('.firebaseui-idp-button');           
            //ajustar cor dos botões em português...
            for (var i = 0; i < IDPButtons.length; i++) {
              var button = IDPButtons[i];
              var text = button.innerText;
              console.log('text', text, 'style', button.style);
              if (text.indexOf('Fazer login com o e-mail') >= 0) {
                console.log('mudando cor');
                button.style.cssText= "background-color: rgba(240,248,255, 0.2);"
              }
            }

            const nbIDPButtonDisplayed = IDPButtons.length;
            if (nbIDPButtonDisplayed > 0) {
              clearInterval(intervalId);
              if (!$('#fp-pre-consent').is(':checked')) {
                IDPButtons.attr('disabled', 'disabled');
              }
            }
          }, 1);
        },
      },
    };
    this.firebaseUi = new firebaseui.auth.AuthUI(firebase.auth());
  }

  /**
   * Displays the signed-in user information in the UI or hides it and displays the
   * "Sign-In" button if the user isn't signed-in.
   */
  onAuthStateChanged(user) {

    if (Utils.isSupportedNotification()) {
      console.log('Push suportado!');
    } else {
      console.log('Push NÃO suportado!')
    }
    //************************************************************ */
    // Reload the page unless this is the first time being loaded and no signed-in user.
    if (this._waitForAuthPromiseResolver.state() !== 'pending' || user) {
      Router.reloadPage();
    }

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

    const install_button = document.querySelector('#bt-install');
    const div_prevdigi = document.querySelector('#div-prevdigi');
    //const div_termouso = document.querySelector('#div-termouso');    

    this._waitForAuthPromiseResolver.resolve();
    document.body.classList.remove('fp-auth-state-unknown');
    if (!user) {
      //if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      if (isInStandaloneMode) {
        install_button.style.display = 'none';   
        div_prevdigi.style.display = 'block';
        //div_termouso.style.display = 'block';              
      } else {
        install_button.style.display = 'block';  
      }
      this.userId = null;
      this.signedInUserAvatar.css('background-image', '');
      this.firebaseUi.start('#firebaseui-auth-container', this.uiConfig);
      document.body.classList.remove('fp-signed-in');
      document.body.classList.add('fp-signed-out');
      Auth.disableAdminMode();
    } else {
      //if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {      
      if (isInStandaloneMode) {  
        this.toggleAdminMode();
        install_button.style.display = 'none';
        document.body.classList.remove('fp-signed-out');
        document.body.classList.add('fp-signed-in');
        this.userId = user.uid;
        this.signedInUserAvatar.css('background-image',
            `url("${Utils.addSizeToGoogleProfilePic(user.photoURL) || '/images/silhouette.jpg'}")`);
        this.signedInUsername.text(user.displayName || 'Anonymous');
        this.usernameLink.attr('href', `/user/${user.uid}`);        
      } else {
        install_button.style.display = 'block';        
      }
    }
  }

  /**
   * Displays the Admin features if the user has the "admin=true" custom claim in its ID token. 
   */
  async toggleAdminMode() {
    try {
      const idToken = await this.auth.currentUser.getIdToken();
      const isAdmin = JSON.parse(window.atob(idToken.split('.')[1])).admin;
      if (isAdmin) {
        Auth.enableAdminMode();
      } else {
        Auth.disableAdminMode();
      }
    } catch (e) {
      console.error('Error while checking for Admin priviledges', e);
      Auth.disableAdminMode();
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
        this.auth.signOut();
        page('/');
      }
    }
  }

  signOut() {
    this.auth.signOut();
    page('/');
  }
};
