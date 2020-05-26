//'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import firebaseConfig from './firebase-config.json';
import Auth from './Auth';
import Router from './Router';
import 'material-design-lite';
import {Utils} from './Utils';

// Styling
import 'material-design-icons/iconfont/material-icons.css';
import 'typeface-amaranth/index.css';
import './fonts/maisfuturo/maisfuturo-font.css';
import 'material-design-lite/material.min.css';
import 'mdl-ext/lib/mdl-ext.min.css';
import 'firebaseui/dist/firebaseui.css';
import './app.css';

console.log('INICIANDO APP.JS 14')

const checkIfIsIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test( userAgent );
}

const checkIfIsSamsungBrowser = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /samsungbrowser/.test( userAgent );  
}

const checkIfIsPwaInstalled = (isIos) => { 
  if (isIos==="false") {
    var displayModes = ["fullscreen", "standalone", "minimal-ui"]; 
    return displayModes.some((displayMode) => window.matchMedia('(display-mode: ' + displayMode + ')').matches) || window.navigator.standalone === true;   
  } else {
    return ('standalone' in window.navigator) && (window.navigator.standalone);
  }
}

const install_button = document.querySelector('#bt-install');
const divPrevdigi = document.querySelector('#div-prevdigi');
const div_install = document.querySelector('#div-install');
const bt_install_text = document.querySelector('#bt-install-text');
const msgInstalacao = document.querySelector('#msg-instalacao');
const msgInicial = document.querySelector('#msg-inicial');

localStorage.isIos = checkIfIsIos()
localStorage.isSamsungBrowser = checkIfIsSamsungBrowser()

if (!localStorage.isPwaInstalled || localStorage.isPwaInstalled==="false" || localStorage.isPwaInstalled === "") {
  localStorage.isPwaInstalled = checkIfIsPwaInstalled(localStorage.isIos) || detectStandalone()
}

console.log('IOS?', localStorage.isIos)
console.log('Samsung Browser?', localStorage.isSamsungBrowser)
console.log('PWA instalado?', localStorage.isPwaInstalled)

//------------------------------------------------------------------------------------------------------
// BLOCO: Instalação do APP - Android
localStorage.beforeInstallPromptOK = ""
if (localStorage.isIos === "false") {
  //seta evento before install prompt - somente para Android
  window.deferredPrompt = {};
  window.addEventListener('beforeinstallprompt', e => {
    if (localStorage.beforeInstallPromptOK==="false" || localStorage.beforeInstallPromptOK ==="") { //necessário para prevenir que entre 2 vezes (isso estava ocorrendo no Android)
      localStorage.beforeInstallPromptOK = "true"
      bt_install_text.innerHTML = 'Instalar o aplicativo'
      // prevent default event
      e.preventDefault();
      // store install avaliable event
      window.deferredPrompt = e;
    }
  })

  //seta click listener para o botão de instalação
  install_button.addEventListener('click', e => {
    if (!window.deferredPrompt) {
      return
    }

    window.deferredPrompt.prompt().then(() => {
      window.deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('OK');
        } else {
          console.log('User dismissed the prompt');
        }
        window.deferredPrompt = null;
      });  
    });  

    if (localStorage.isSamsungBrowser) {
      var intervalId = setInterval(() => { 
        clearInterval(intervalId);
      }, 3000)
      install_button.style.display = 'none'
      divPrevdigi.style.display = 'none'    
    }
  });

}

//seta evento para verificar se App instalado
window.addEventListener('appinstalled', e => {
  msgInicial.innerHTML = "Legal!"
  msgInstalacao.innerHTML = "Instalação concluída.<br> A partir de agora acesse nosso portal através do aplicativo instalado em seu dispositivo. "
  install_button.style.display = 'none'
  divPrevdigi.style.display = 'none'
  console.log("success app install!");
});


// Configure Firebase.
firebase.initializeApp(firebaseConfig.result);
// Make firebase reachable through the console.
window.firebase = firebase;

// Load the app.
$(document).ready(() => {
  if (localStorage.isPwaInstalled==="true") {
    const auth = new Auth();
    // Starts the router.
    window.fpRouter = new Router(auth);  
  } else {  
    if (localStorage.isIos==="false") {
      install_button.style.display = 'block'
      divPrevdigi.style.display = 'block'
    }  else {
      install_button.style.display = 'none'
    }  
    div_install.style.display = 'block'  
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

function detectStandalone() {
  const hash = window.location.hash;
  let standalone = false;

  if (hash === '#:standalone:') {
    // first run (open app) in standalone mode
    // cache state in sessionStorage

    standalone = true;
    sessionStorage.setItem(':standalone:', '1');
    // remove hash part from the url before actual app start,
    // in case if your app uses hash (#) routing
    history.replaceState(history.state, '', '/');
  } else if (sessionStorage.getItem(':standalone:')) {
    // second and subsequent runs (reloads)
    // sessionStorage is unique per tab and Home Screen app is just a
    // chrome-less tab. So it's safe to assume
    // that user is still in standalone mode

    standalone = true;
  } else {
    // neither first, nor subsequent standalone runs, normal mode
    // do nothing
  }
  return standalone;
}
