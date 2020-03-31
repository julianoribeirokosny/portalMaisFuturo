'use strict';

import firebase from 'firebase/app';
import 'firebase/auth';
import page from 'page';
import $ from 'jquery';

export default class PrimeiroLogin {
    
    constructor(firebaseHelper) {
        this.firebaseHelper = firebaseHelper;    
        // Firebase SDK.
        this.auth = firebase.auth();
    }  

    async verificaPrimeiroLogin() {
        let ret = false
        if (this.auth.currentUser) { //Not empty
            console.log('====> emailVerified', this.auth.currentUser.emailVerified)
            let temRegistroPrimeiroLogin = await this.firebaseHelper.validaRegistroPrimeiroLogin(this.auth.currentUser.uid)
            if (!temRegistroPrimeiroLogin) {
                ret = true
            } else {
                ret = !this.auth.currentUser.emailVerified
            }
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

    async confirmEmailFone(celular, email) {

        let tipoLogin 
        if (this.auth.currentUser.phoneNumber && this.auth.currentUser.phoneNumber !== "") { //login celular
            if (!email || email === "") {
                alert('O preenchimento do campo e-mail é obrigatório!')
                return
            } 
            if ('+55'+celular === firebase.auth().currentUser.phoneNumber) {
                alert('O outro celular para contato não pode ser igual ao número do celular do login do aplicativo.')
                return
            }

            tipoLogin = 'celular'
        } else { //login por email
            if (!celular || celular === "") {
                alert('O preenchimento do campo celular é obrigatório!')
                return
            } 
            if (email === firebase.auth().currentUser.email) {
                alert('O e-mail alternativo não pode ser igual ao e-mail de login do aplicativo.')
                return
            } 

            tipoLogin = 'email'
        }
        
        //um usuário criado pode ter 1 ou mais participações!
        let listaChaves = await this.firebaseHelper.getUsuarioListaParticipacoes(firebase.auth().currentUser, tipoLogin, celular, email)
        this.firebaseHelper.gravaDadosPrimeiroLogin(firebase.auth().currentUser.uid, celular, email, listaChaves ? listaChaves : '', firebase.auth().currentUser.email, firebase.auth().currentUser.phoneNumber, tipoLogin)
        if (!listaChaves) {
            page('/confirmacao-dados')      // pede confirmação de mais dados!
        } else { //achou ou email ou celular na lista
            let loginGoogle = this.auth.currentUser.providerData[0].providerId === "google.com"
            if (loginGoogle) { //se login google não precisa enviar email de validação...
                await this.firebaseHelper.gravaEfetivacaoPrimeiroLogin(this.auth.currentUser.uid)
                page('/home')
            } else {
                //NECESSÁRIO para aguardar gravação do email quando o login for via celular
                var intervalId = setInterval(() => {  //Aguarda até ter a verificação
                    this.auth.currentUser.reload()
                    if (this.auth.currentUser.email) {
                        clearInterval(intervalId);
                        this.firebaseHelper.enviarEmailLinkValidacao()
                        page('/aviso-validacao')      
                    }  
                }, 3000)
            }
        }
    }

    //configura tela de primeiro login de acordo com o tipo do primeiro login feito
    telaPrimeiroLoginConfig() {
        console.log('===>firebase.auth().currentUser', this.auth.currentUser)
        if (this.auth.currentUser.phoneNumber && this.auth.currentUser.phoneNumber !== "") {
            $('.fp-input-celular').attr('placeholder', 'Outro celular de contato (opcional)')
            $('.fp-input-email').attr('placeholder', 'E-mail (obrigatório)')
            $('.fp-input-celular').prop('required', 'false')
            $('.fp-input-email').prop('required', 'true')
        } else {
            $('.fp-input-celular').attr('placeholder', 'Celular (obrigatório)')
            $('.fp-input-email').attr('placeholder', 'Outro e-mail de contato (opcional)')
            $('.fp-input-celular').prop('required', 'true')
            $('.fp-input-email').prop('required', 'false')
        }
    }
    
}
