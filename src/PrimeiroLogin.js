'use strict';

import firebase from 'firebase/app';
import 'firebase/auth';
import page from 'page';
import $ from 'jquery';
import VMasker from 'vanilla-masker';

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

        this.montaMascaras()
    }  

    async verificaPrimeiroLogin() {
        let ret = false
        if (this.auth.currentUser) { //Not empty
            console.log('====> emailVerified', this.auth.currentUser.emailVerified)
            let temRegistroPrimeiroLogin = await this.firebaseHelper.validaRegistroPrimeiroLogin(this.auth.currentUser.uid)
            if (!temRegistroPrimeiroLogin) {
                ret = true
            } else if (this.auth.currentUser.phoneNumber === '') { //se for de celular não valida email
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
        //ajusta padrão do celular
        celular = '+55' + celular.replace('(','').replace(')','').replace(' ','').replace('-','')        

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
            sessionStorage.emailAlternativo = email
            //um usuário criado pode ter 1 ou mais participações!
            let listaChaves = await this.firebaseHelper.getUsuarioListaParticipacoes(firebase.auth().currentUser, tipoLogin, celular, email)
            this.firebaseHelper.gravaDadosPrimeiroLogin(firebase.auth().currentUser.uid, celular, email, listaChaves ? listaChaves : '', firebase.auth().currentUser.email, firebase.auth().currentUser.phoneNumber, tipoLogin)        
            if (!listaChaves) {
                page('/confirmacao-dados')      // pede confirmação de mais dados!
            } else { //achou ou email ou celular na lista
                let loginGoogle = this.auth.currentUser.providerData[0].providerId === "google.com"
                if (loginGoogle || tipoLogin === 'celular') { //se login google não precisa enviar email de validação...
                    await this.firebaseHelper.gravaEfetivacaoPrimeiroLogin(this.auth.currentUser.uid)
                    page('/home')
                } else {
                    page('/aviso-validacao')
                }
            }
        }
    }

    async confirmDados(cpf) {        
        if(this.validaCpfObrigatorio(cpf)) {
            let tipoLogin
            if (this.auth.currentUser.phoneNumber && this.auth.currentUser.phoneNumber !== "") { //login celular
                tipoLogin = 'celular'
            } else { //login por email
                tipoLogin = 'email'
            }   
            let retListaParticipacoesDados = await this.firebaseHelper.getUsuarioListaParticipacoesDados(cpf)
            let listaChaves = retListaParticipacoesDados[1]
            sessionStorage.emailCadastro = retListaParticipacoesDados[0]
            if (!listaChaves) {
                page('/erro-confirmacao-dados')
            } else {
                this.firebaseHelper.gravaListaChaves(firebase.auth().currentUser.uid, listaChaves)        
                this.firebaseHelper.enviarEmailLinkValidacao('proprio', emailCadastro) //envia email
                page('/confirmacao-dados-final')      
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

    telaConfirmacaoDadosFinalConfig() {
        if (this.auth.currentUser) { //Not empty
            let emailCadastro = sessionStorage.emailCadastro
            let emailAlternativo = sessionStorage.emailAlternativo
            let btnReenviaVerificacao = $('#btn-reenvia-verificacao')
            let btnNaoReconhece = $('#btn-nao-reconhece-email')
            let divNaoReconhece = $('#div-nao-reconhece-email')
            let msgPart1 = $('#msg-participante1')
            let msgPart2 = $('#msg-participante2')
            let msgPart3 = $('#msg-participante3')
            if (emailCadastro === emailAlternativo) {
                msgPart1.text(`Identificamos que o e-mail ${emailAlternativo} informado já consta em nossa base da dados.`)
                msgPart2.texto(`Para a segurança de suas informações, enviamos um link de confirmação de acesso para este e-mail.`)
                msgPart3.text(`_`)            
                divNaoReconhece.hide()            
            } else {
                divNaoReconhece.show()
                btnReenviaVerificacao.click(() => {
                    this.firebaseHelper.enviarEmailLinkValidacao('proprio', emailCadastro)
                })    
                msgPart3.text(`Não reconhece ou não usa mais o e-mail ${emailCadastro}?`)
                msgPart2.text(`Para a segurança de suas informações, enviamos um link de confirmação de acesso para seu e-mail cadastrado: ${emailCadastro}`)                
                if (emailAlternativo !== '') {
                    msgPart1.text(`Nenhum dos e-mails informados (${this.auth.currentUser.email} e ${emailAlternativo}) foram identificados em nossa base de dados.`)
                } else {
                    msgPart1.text(`O e-mail ${this.auth.currentUser.email} não foi identificado em nossos cadastros.`)
                }
            }
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

    montaMascaras() {
        let celularMask = ['(99) 9999-9999', '(99) 99999-9999'];
        var celular = document.querySelector('#celular');    
        VMasker(celular).maskPattern(celularMask[0]);
        celular.addEventListener('input', this.inputHandler.bind(undefined, celularMask, 14), false);
    
        let cpfMask = '999.999.999-99'
        var cpf = document.querySelector('#cpf');    
        VMasker(cpf).maskPattern(cpfMask);    
    }

    inputHandler(masks, max, event) {
        var c = event.target;
        var v = c.value.replace(/\D/g, '');
        var m = c.value.length > max ? 1 : 0;
        VMasker(c).unMask();
        VMasker(c).maskPattern(masks[m]);
        c.value = VMasker.toPattern(v, masks[m]);
    }
    
}
