//'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import firebaseConfig from './firebase-config.json';
import Auth from './Auth';
import Router from './Router';
import 'material-design-lite';
import { Utils } from './Utils';

// Styling
import 'material-design-icons/iconfont/material-icons.css';
import 'typeface-amaranth/index.css';
import './fonts/maisfuturo/maisfuturo-font.css';
import 'material-design-lite/material.min.css';
import 'mdl-ext/lib/mdl-ext.min.css';
import 'firebaseui/dist/firebaseui.css';
import './app.css';

const checkIfIsIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    console.log('userAgent: ', userAgent)
    return /iphone|ipad|ipod/.test(userAgent);
    //return true
}

const checkIfIsMac = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    console.log('userAgent: ', userAgent)
    return /macintosh/.test(userAgent);
    //return true
}

const checkIfIsSamsungBrowser = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /samsungbrowser/.test(userAgent);
}

const checkIfIsPwaInstalled = (isIos) => {
    if (isIos === "false") {
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
const reset = window.location.href.indexOf('reset') > 0
const pageInstall = window.location.href.indexOf('instalar') > 0

localStorage.isIos = checkIfIsIos()
localStorage.isMac = checkIfIsMac()
localStorage.isSamsungBrowser = checkIfIsSamsungBrowser()
localStorage.standaloneDetected = detectStandalone()

if (!localStorage.isPwaInstalled || localStorage.isPwaInstalled === "false" || localStorage.isPwaInstalled === "") {
    localStorage.isPwaInstalled = checkIfIsPwaInstalled(localStorage.isIos)
}

console.log('IOS?', localStorage.isIos)
console.log('MAC?', localStorage.isMac)
console.log('Samsung Browser?', localStorage.isSamsungBrowser)
console.log('PWA instalado?', localStorage.isPwaInstalled)
console.log('pageInstall?', pageInstall)
console.log('reset?', reset)
console.log('standaloneDetected?', localStorage.standaloneDetected)

if (reset) { //força limpar o cache para atualizar app
    localStorage.isPwaInstalled = ""
    localStorage.standaloneDetected = ""
    let limpouCache = false
    let excluiuSw = false
        //limpa o cache
    self.caches.keys().then(keys => {
        keys.forEach(key => {
            self.caches.delete(key)
            limpouCache = true
            console.log(key)
        })
        if (limpouCache) {
            window.location.reload();
        }
    })

    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            console.log(registration)
            excluiuSw = true
            registration.unregister();
        }
        if (excluiuSw) {
            window.location.reload(); //sim... 2 windows.reload na mesma lógica... 
        }
    });

    //self.caches.delete('html-cache')

}

//------------------------------------------------------------------------------------------------------
// BLOCO: Instalação do APP - Android
localStorage.beforeInstallPromptOK = ""
if (pageInstall && localStorage.isIos === "false") {

    if (localStorage.standaloneDetected === "false" && localStorage.isPwaInstalled === "true") {
        localStorage.isPwaInstalled === "false"
    }
    //seta evento before install prompt - somente para Android
    window.deferredPrompt = {};
    window.addEventListener('beforeinstallprompt', e => {
        if (localStorage.beforeInstallPromptOK === "false" || localStorage.beforeInstallPromptOK === "") { //necessário para prevenir que entre 2 vezes (isso estava ocorrendo no Android)
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
if (pageInstall) {
    window.addEventListener('appinstalled', e => {
        msgInicial.innerHTML = "Legal!"
        msgInstalacao.innerHTML = "Instalação concluída.<br> A partir de agora acesse nosso portal através do aplicativo instalado em seu dispositivo. "
        install_button.style.display = 'none'
        divPrevdigi.style.display = 'none'
        console.log("success app install!");
        localStorage.isPwaInstalled = "true"
    });
}

if ((localStorage.isPwaInstalled === "true" || localStorage.standaloneDetected === "true") && pageInstall) {
    //não pode continuar porque está com o App instalado e está tentando acessar via Browser
    mostraTelaAcessoBrowser()
} else if ((localStorage.isPwaInstalled === "true" && localStorage.standaloneDetected === "false") && !pageInstall) {
    mostraTelaAcessoBrowser()
} else if (localStorage.isPwaInstalled === "false" && localStorage.standaloneDetected === "false" && localStorage.isMac === "false" && !pageInstall) {
    mostraTelaAcessoBrowser()
} else if ((localStorage.isPwaInstalled === "false" && localStorage.standaloneDetected === "false" && localStorage.isMac === "true") ||
    ((localStorage.isPwaInstalled === "true" || localStorage.standaloneDetected === "true") && !pageInstall) ||
    (localStorage.isPwaInstalled === "false" && localStorage.standaloneDetected === "false" && pageInstall)) {

    // Configure Firebase.
    firebase.initializeApp(firebaseConfig.result);
    // Make firebase reachable through the console.
    window.firebase = firebase;

    // Load the app.
    $(document).ready(() => {
        console.log('==> ready:', localStorage.isPwaInstalled, localStorage.standaloneDetected, pageInstall, reset)
        if (localStorage.isMac === "true" || ((localStorage.isPwaInstalled === "true" || localStorage.standaloneDetected === "true") && !pageInstall && !reset)) {
            const auth = new Auth();
            // Starts the router.
            window.fpRouter = new Router(auth);
        } else {
            if (localStorage.isIos === "false") {
                mostraTelaInstalacao()
            } else {
                mostraTelaInstalacaoIOS()
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
    import ( /* webpackPrefetch: true */ 'universal-ga').then((analytics) => {
        analytics.initialize('UA-25993200-10');
        analytics.pageview('/');
    });

    // Start the offline indicator listener.
    Utils.startOfflineListener();
}


function detectStandalone() {
    const hash = window.location.hash;
    let standalone = false;

    if (hash.indexOf('#:standalone:') >= 0) {
        standalone = true;
        sessionStorage.setItem(':standalone:', '1');
        history.replaceState(history.state, '', '/');
    } else if (sessionStorage.getItem(':standalone:')) {
        standalone = true;
    }
    return standalone;
}

function mostraTelaAcessoBrowser() {
    $('#page-instalacao-ios').hide()
    $('#page-instalacao').hide()
    $('#page-acesso-browser').show()
}

function mostraTelaInstalacao() {
    install_button.style.display = 'block'
    divPrevdigi.style.display = 'block'
    $('#page-instalacao-ios').hide()
    $('#page-instalacao').show()
    $('#page-acesso-browser').hide()
}

function mostraTelaInstalacaoIOS() {
    $('#page-instalacao-ios').show()
    $('#page-instalacao').hide()
    $('#page-acesso-browser').hide()
}