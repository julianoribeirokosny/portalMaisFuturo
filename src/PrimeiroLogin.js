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

        this.displayCelular = document.querySelector('#primeiro-login-input-celular-erro')
        this.inputCelular = document.querySelector('#celular')    

        this.displayEmail = document.querySelector('#primeiro-login-input-email-erro')
        this.inputEmail = document.querySelector('#email')

        this.displayNome = document.querySelector('#confirma-dados-input-nome-erro')
        this.inputNome = document.querySelector('#nome')

        this.displayCpf = document.querySelector('#confirma-dados-input-cpf-erro')
        this.inputCpf = document.querySelector('#cpf')

        this.displayNascimento = document.querySelector('#confirma-dados-input-nascimento-erro')
        this.inputNascimento = document.querySelector('#nascimento')
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
            tipoLogin = 'celular'
        } else { //login por email
            tipoLogin = 'email'
        }
        let validacao
        let validemail
        let validcelular
        if(tipoLogin === 'celular') {
            validemail = this.validaEmailObrigatorio(email)
            validcelular = this.validaCelularDiferenteLogin(celular)
            validacao = validemail && validcelular
        } else if (tipoLogin ==='email') {
            validemail = this.validaEmailDiferenteLogin(email)
            validcelular = this.validaCelularObrigatorio(celular)
            validacao = validemail && validcelular
        }
        if(validacao) {
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
    }

    async confirmDados(nome, cpf, nascimento) {        
        let validNome = this.validaNomeObrigatorio(nome)
        let validCpf = this.validaCpfObrigatorio(cpf)
        let validNascimento = this.validaNascimentoObrigatorio(nascimento)
        if(validNome && validCpf && validNascimento) {
            let tipoLogin
            if (this.auth.currentUser.phoneNumber && this.auth.currentUser.phoneNumber !== "") { //login celular
                tipoLogin = 'celular'
            } else { //login por email
                tipoLogin = 'email'
            }            
            let listaChaves = await this.firebaseHelper.getUsuarioListaParticipacoesDados(cpf, nome, nascimento)
            this.firebaseHelper.gravaDadosPrimeiroLogin(firebase.auth().currentUser.uid, '', '', listaChaves ? listaChaves : '', firebase.auth().currentUser.email, firebase.auth().currentUser.phoneNumber, tipoLogin)        
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
    validaCelularObrigatorio(celular) {
        this.displayCelular.style.display = 'none'
        if(celular.length <= 13) {
            this.displayCelular.innerHTML = 'Celular deve ser preenchido corretamente!'
            this.displayCelular.style.display = 'inline'
            this.inputCelular.style.borderBottom  = '#e91e63 solid 1px'
            this.inputCelular.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)'
            return false
        } else { 
            this.displayCelular.style.display = 'none'
            this.inputCelular.style.borderBottom  = '#03a9f4 solid 1px'
            this.inputCelular.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
            return true
        }
    }
    validaCelularDiferenteLogin(celular) {
        celular = '+55' + celular.replace('(','').replace(')','').replace(' ','').replace('-','')        
        this.displayCelular.style.display = 'none'        
        if((firebase.auth().currentUser.phoneNumber) && 
            (firebase.auth().currentUser.phoneNumber !== "") && 
            (firebase.auth().currentUser.phoneNumber == celular)) {
                this.displayCelular.innerHTML = 'Celular não pode ser igual ao registrado no login!'
                this.displayCelular.style.display = 'inline'
                this.inputCelular.style.borderBottom  = '#e91e63 solid 1px'
                this.inputCelular.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)'
                return false
        } else { 
            this.displayCelular.style.display = 'none'
            this.inputCelular.style.borderBottom  = '#03a9f4 solid 1px'
            this.inputCelular.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
            return true
        }      
    }
    validaEmailObrigatorio(email) {        
        this.displayEmail.style.display = 'none'
        if (email !== "" || email) {
            let user = email.substring(0, email.indexOf("@"))
            let dominio = email.substring(email.indexOf("@")+ 1, email.length)          
            if ((user.length >= 1) && 
                (user.search("@")==-1) && 
                (user.search(" ")==-1) && 
                (dominio.length >=3) && 
                (dominio.search("@")==-1) && 
                (dominio.search(" ")==-1) && 
                (dominio.search(".")!=-1) && 
                (dominio.indexOf(".") >=1)&& 
                (dominio.lastIndexOf(".") < dominio.length - 1)) { 
                    this.displayEmail.style.display = 'none' 
                    this.inputEmail.style.borderBottom  = '#03a9f4 solid 1px' 
                    this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
                    return true
            } else { 
                this.displayEmail.innerHTML = 'E-mail inválido!' 
                this.displayEmail.style.display = 'inline' 
                this.inputEmail.style.borderBottom  = '#e91e63 solid 1px' 
                this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
                return false
            }
        } else {
            this.displayEmail.innerHTML = 'E-mail obrigatório!'
            this.displayEmail.style.display = 'inline' 
            this.inputEmail.style.borderBottom  = '#e91e63 solid 1px' 
            this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
            return false
        }
    }
    validaEmailDiferenteLogin(email) {        
        this.displayEmail.style.display = 'none'
        if (email !== "" || email) {
            if (email !== firebase.auth().currentUser.email) { 
                let user = email.substring(0, email.indexOf("@"))
                let dominio = email.substring(email.indexOf("@")+ 1, email.length)          
                if ((user.length >= 1) && 
                    (user.search("@")==-1) && 
                    (user.search(" ")==-1) && 
                    (dominio.length >=3) && 
                    (dominio.search("@")==-1) && 
                    (dominio.search(" ")==-1) && 
                    (dominio.search(".")!=-1) && 
                    (dominio.indexOf(".") >=1)&& 
                    (dominio.lastIndexOf(".") < dominio.length - 1)) { 
                        this.displayEmail.style.display = 'none' 
                        this.inputEmail.style.borderBottom  = '#03a9f4 solid 1px' 
                        this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
                        return true
                } else { 
                    this.displayEmail.innerHTML = 'E-mail inválido!' 
                    this.displayEmail.style.display = 'inline' 
                    this.inputEmail.style.borderBottom  = '#e91e63 solid 1px' 
                    this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
                    return false                    
                }
            } else { 
                this.displayEmail.innerHTML = 'Este e-mail não pode ser igual ao e-mail de login.' 
                this.displayEmail.style.display = 'inline' 
                this.inputEmail.style.borderBottom  = '#e91e63 solid 1px' 
                this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
                return false
            }       
        }
        else {
            this.displayEmail.style.display = 'none' 
            this.inputEmail.style.borderBottom  = '#03a9f4 solid 1px' 
            this.inputEmail.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
            return true
        }
    }
    validaNomeObrigatorio(nome) {
        this.displayNome.style.display = 'none'
        if(nome.length < 5) {
            this.displayNome.innerHTML = 'Favor incluir o nome completo'
            this.displayNome.style.display = 'inline' 
            this.inputNome.style.borderBottom  = '#e91e63 solid 1px' 
            this.inputNome.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
            return false
        } else {
            this.displayNome.style.display = 'none' 
            this.inputNome.style.borderBottom  = '#03a9f4 solid 1px' 
            this.inputNome.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
            return true
        }
    }
    validaCpfObrigatorio(cpf) {
        this.displayCpf.style.display = 'none'        
        if(cpf.length < 14) {
            this.displayCpf.innerHTML = 'CPF incorreto!'
            this.displayCpf.style.display = 'inline' 
            this.inputCpf.style.borderBottom  = '#e91e63 solid 1px' 
            this.inputCpf.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
            return false
        } else {
            this.displayCpf.style.display = 'none' 
            this.inputCpf.style.borderBottom  = '#03a9f4 solid 1px' 
            this.inputCpf.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
            return true
        }
    }
    validaNascimentoObrigatorio(nascimento) {
        this.displayNascimento.style.display = 'none'        
        if(nascimento.length < 10) {
            this.displayNascimento.innerHTML = 'Data de nascimento incorreta!'
            this.displayNascimento.style.display = 'inline' 
            this.inputNascimento.style.borderBottom  = '#e91e63 solid 1px' 
            this.inputNascimento.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #e91e63 4%)' 
            return false
        } else {
            this.displayNascimento.style.display = 'none' 
            this.inputNascimento.style.borderBottom  = '#03a9f4 solid 1px' 
            this.inputNascimento.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 96%, #03a9f4 4%)'
            return true
        }
    }
}
