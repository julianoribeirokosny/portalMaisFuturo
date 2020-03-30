'use strict';

import firebase from 'firebase/app';
import 'firebase/auth';
import page from 'page';

export default class PrimeiroLogin {
    
    constructor(firebaseHelper) {
        this.firebaseHelper = firebaseHelper;    
        // Firebase SDK.
        this.auth = firebase.auth();
    }  

    async verificaPrimeiroLogin() {
        let ret = false
        if (this.auth.currentUser) { //empty
            console.log('====> emailVerified', this.auth.currentUser.emailVerified)
            let temRegistroPrimeiroLogin = await this.firebaseHelper.validaRegistroPrimeiroLogin(this.auth.currentUser.uid)
            ret = !this.auth.currentUser.emailVerified || !temRegistroPrimeiroLogin
        }
        return ret
    }  

    async aguardaValidaLinkPrimeiroLogin() {
        if (this.auth.currentUser) {
            var intervalId = setInterval(() => {  //Aguarda até ter a verificação
                this.auth.currentUser.reload()
                if (this.auth.currentUser.emailVerified) {
                clearInterval(intervalId);
                console.log('**** VERIFICADO!!!!!')
                this.firebaseHelper.gravaEfetivacaoPrimeiroLogin(this.auth.currentUser.uid)
                return page('/') //joga para splash page para depois ir para a home
                }  
            }, 5000)
        }
    }  
}
