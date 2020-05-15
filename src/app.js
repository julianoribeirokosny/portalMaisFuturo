/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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
import firebaseConfig from './firebase-config.json';
import Auth from './Auth';
import Router from './Router';
import 'material-design-lite';
import {Utils} from './Utils';
import pwaInstallPrompt from "pwa-install-prompt";
 
// Styling
import 'material-design-icons/iconfont/material-icons.css';
import 'typeface-amaranth/index.css';
import './fonts/maisfuturo/maisfuturo-font.css';
import 'material-design-lite/material.min.css';
import 'mdl-ext/lib/mdl-ext.min.css';
import 'firebaseui/dist/firebaseui.css';
import './app.css';

/**
 * This loads the critical path of the app to speed up first draw.
 * The following components are initially loaded:
 *  - IP Filter for EU countries features.
 *  - CSS styling.
 *  - Auth to know if the user is signed-in.
 *  - The App's router which can display the Splash page.
 *  - Enable Offline.
 * 
 * The rest of the app is loaded asynchroneously and passed to the router.
 * Google Analytics is asynchroneously loaded.
 */
 
const isIos = Utils.isIos()
var appInstalado = Utils.validaAppInstalado()
var beforeInstallPromptOK = false

const install_button = document.querySelector('#bt-install');
const divPrevdigi = document.querySelector('#div-prevdigi');
const div_install = document.querySelector('#div-install');
const bt_install_text = document.querySelector('#bt-install-text');
const msgInstalacao = document.querySelector('#msg-instalacao');
const msgInicial = document.querySelector('#msg-inicial');

//------------------------------------------------------------------------------------------------------
// BLOCO: Instalação do APP
window.deferredPrompt = {};
window.addEventListener('beforeinstallprompt', e => {
  if (!beforeInstallPromptOK) { //necessário para prevenir que entre 2 vezes (isso estava ocorrendo no Android)
    beforeInstallPromptOK = true
    bt_install_text.innerHTML = 'Instalar o aplicativo'
    // prevent default event
    e.preventDefault();
    // store install avaliable event
    window.deferredPrompt = e;
  }
});

// Configure Firebase.
firebase.initializeApp(firebaseConfig.result);
// Make firebase reachable through the console.
window.firebase = firebase;

// Load the app.
$(document).ready(() => {
  console.log('beforeInstallPromptOK || isIos || appInstalado', beforeInstallPromptOK , isIos , appInstalado)
  if (appInstalado) { //fluxo normal do app após a instalação
    const auth = new Auth();
    // Starts the router.
    window.fpRouter = new Router(auth);  
  } else {
    div_install.style.display = 'block'    
    install_button.style.display = 'block'
  }

  if (isIos || appInstalado) {
    install_button.style.display = 'none'
  }

});

// Register the Service Worker that enables offline.
if ('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  $(window).on('load', () => {
    window.navigator.serviceWorker.register('/workbox-sw.js');
  });
}

// Initialize Google Analytics.
import(/* webpackPrefetch: true */ 'universal-ga').then((analytics) => {
  analytics.initialize('UA-25993200-10');
  analytics.pageview('/');
});

// Start the offline indicator listener.
Utils.startOfflineListener();

// get button with id
if (!isIos) {
  install_button.addEventListener('click', e => {
    promptAddHome()
  });
  // if the app can be installed emit beforeinstallprompt
  // do action when finished install
  window.addEventListener('appinstalled', e => {
    msgInicial.innerHTML = "Legal!"
    msgInstalacao.innerHTML = "Instalação concluída.<br> A partir de agora acesse nosso portal através do aplicativo instalado em seu dispositivo. "
    install_button.style.display = 'none'
    divPrevdigi.style.display = 'none'
    console.log("success app install!");
  });
}
  
function promptAddHome() {
  if (!window.deferredPrompt) {
    console.log('-> !window.deferredPrompt')
    return
  }
  console.log('-> true window.deferredPrompt')
  window.deferredPrompt.prompt();
  console.log('-> Prompt')
  window.deferredPrompt.userChoice.then(choiceResult => {
    console.log('-> userChoice.then')
    console.log('-> choiceResult.outcome', choiceResult.outcome)
    if (choiceResult.outcome === 'accepted') {
      // user accept the prompt
      console.log('OK');
    } else {
      console.log('User dismissed the prompt');
    }
    window.deferredPrompt = null;
  });  
}