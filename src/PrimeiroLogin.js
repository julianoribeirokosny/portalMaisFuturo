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
        let ret = null
        let usr = this.auth.currentUser
        if (usr) { //Not empty
            if (this.validaSeLoginCelular(usr)) {
                sessionStorage.tipoLogin = 'celular'
            } else { //login por email
                sessionStorage.tipoLogin = 'email'
            }
            let temRegistroPrimeiroLogin = await this.firebaseHelper.validaRegistroLogin(usr.uid)
            if (!temRegistroPrimeiroLogin) { //se não achou registro do login no BD, precisa seguir fluxo do primeiro login
                //é primeiro login... ou pelo menos não finalizou na primeira vez...
                //porém, verifica se já não fez outro login que tenha cadastrado o email ou telefone que está tentando agora
                let usuarioOutroLogin = await this.firebaseHelper.getUsuarioListaParticipacoes(usr, sessionStorage.tipoLogin, '', '')
                if (!usuarioOutroLogin || !usuarioOutroLogin.data_ultimo_login || usuarioOutroLogin.data_ultimo_login !== '') { 
                    let loginGoogle = usr.providerData[0].providerId === "google.com"
                    ret = true    
                    if (!loginGoogle) { //se google não precisa resetar email
                        this.firebaseHelper.resetEmailVerified(usr.uid) //força reset do email pq pode ocorrer de já ter o usuário criado na estrutura de login do Firebase
                    }
                } else { 
                    //se achou em outra conta pelo e-mail ou celular do primeiro login, indica que já fez login com outra conta, cadastrando e-mail ou celular
                    this.firebaseHelper.gravaDadosPrimeiroLogin(usuarioOutroLogin, usr.uid) 
                    this.firebaseHelper.gravaLoginSucesso(usr.uid) //loga data-hora do login
                    ret = false
                }
            } else if (!this.validaSeLoginCelular(usr)) { //se for de celular não valida email
                ret =  !usr.emailVerified
            } else { //se login celular
                ret = false
            }
        }
        return ret
    }  

    async aguardaValidaLinkPrimeiroLogin() {
        if (this.auth.currentUser) {
            var intervalId = setInterval(() => {  //Aguarda até ter a verificação
                firebase.auth().currentUser.reload().then(() => {
                    this.auth = firebase.auth()
                    if (this.auth.currentUser.emailVerified) {
                        clearInterval(intervalId);
                        this.firebaseHelper.gravaLoginSucesso(this.auth.currentUser.uid) //loga data-hora do login
                        return page('/home') //joga para splash page para depois ir para a home
                    }  
                    })                
            }, 5000)
        }
    }  

    async confirmEmailFone(celular, email) {
        let usr = firebase.auth().currentUser
        let validacao
        let validemail
        let validcelular
        //ajusta padrão do celular
        celular = '+55' + celular.replace('(','').replace(')','').replace(' ','').replace('-','')        

        if(sessionStorage.tipoLogin === 'celular') {
            validemail = this.validaEmailObrigatorio(email)
            validcelular = this.validaCelularDiferenteLogin(celular)
            validacao = validemail && validcelular
        } else if (sessionStorage.tipoLogin ==='email') {
            validemail = this.validaEmailDiferenteLogin(email)
            validcelular = this.validaCelularObrigatorio(celular)
            validacao = validemail && validcelular
        }
        if(validacao) {
            sessionStorage.emailAlternativo = email
            sessionStorage.chave = '' 
            //um usuário criado pode ter 1 ou mais participações!
            let participacoes = await this.firebaseHelper.getUsuarioListaParticipacoesPrimeiroLogin(usr, celular, email)
            let listaChaves = participacoes.listaChavesRetorno
            if (!listaChaves) {
                page('/confirmacao-dados')      // pede confirmação de mais dados!
            } else { //achou ou email ou celular na lista
                sessionStorage.nome = participacoes.nome
                let chavePrincipal = Object.keys(listaChaves)[0] ? Object.keys(listaChaves)[0] : ''  //pega a primeira key com a chave            
                let primeiroLogin = {
                    chave_principal: chavePrincipal, 
                    lista_chaves: listaChaves, 
                    email_principal: usr.email && usr.email !== '' ? usr.email : email,
                    celular_principal: this.validaSeLoginCelular(usr) ? usr.phoneNumber : celular,
                    tipo_login: sessionStorage.tipoLogin,
                    celular_alternativo: this.validaSeLoginCelular(usr) ? celular : '', // só grava email alternativo se houver o emailPrincipal. Caso contrário o email alternativo será o principal...
                    email_alternativo: usr.email && usr.email !== '' ? email : '',  // só grava celular alternativo se houver o celularPrincipal. Caso contrário o celular alternativo será o principal...
                    full_name: sessionStorage.nome
                }
                this.firebaseHelper.gravaDadosPrimeiroLogin(primeiroLogin, usr.uid)            
                let loginGoogle = usr.providerData[0].providerId === "google.com"
                if (loginGoogle || sessionStorage.tipoLogin === 'celular') { //se login google não precisa enviar email de validação...
                    this.firebaseHelper.gravaLoginSucesso(usr.uid) //loga data-hora do login
                    page('/home')
                } else {
                    //let enviouEmail = await this.firebaseHelper.enviarEmailLinkValidacao('firebase')
                    let enviouEmail = await this.firebaseHelper.enviarEmailLinkValidacao('proprio', (usr.email && usr.email !== '' ? usr.email : email), sessionStorage.nome)
                    if (enviouEmail) {
                        page('/aviso-validacao')
                    } else {
                        //não registra erro aqui pq já registrou dentro de enviarEmailLinkValidacao
                        page('/erro')
                    }
                    
                }
            }
        }
    }

    async confirmDados(cpf) {        
        if(this.validaCpfObrigatorio(cpf)) {
            let usr = firebase.auth().currentUser
            let retListaParticipacoesDados = await this.firebaseHelper.getUsuarioListaParticipacoesDados(cpf)
            let listaChaves = retListaParticipacoesDados.listaChaves
            sessionStorage.nome = retListaParticipacoesDados.nome
            sessionStorage.emailCadastro = retListaParticipacoesDados.emailCadastro
            if (!listaChaves) {
                page('/erro-confirmacao-dados')
            } else {
                //grava registro primeiro login
                let chavePrincipal = Object.keys(listaChaves)[0] ? Object.keys(listaChaves)[0] : ''  //pega a primeira key com a chave            
                let primeiroLogin = {
                    chave_principal: chavePrincipal, 
                    lista_chaves: listaChaves, 
                    email_principal: usr.email && usr.email !== '' ? usr.email : sessionStorage.emailCadastro,
                    celular_principal: this.validaSeLoginCelular(usr) ? usr.phoneNumber : '',
                    tipo_login: sessionStorage.tipoLogin,
                    celular_alternativo: '',
                    email_alternativo: usr.email && usr.email !== '' ? sessionStorage.emailCadastro : '',  // só grava celular alternativo se houver o celularPrincipal. Caso contrário o celular alternativo será o principal...
                    full_name: sessionStorage.nome
                }
                this.firebaseHelper.gravaDadosPrimeiroLogin(primeiroLogin, usr.uid) 
                //this.firebaseHelper.gravaListaChaves(usr.uid, listaChaves)        
                let enviouEmail = await this.firebaseHelper.enviarEmailLinkValidacao('proprio', sessionStorage.emailCadastro, sessionStorage.nome)
                if (enviouEmail) { //envia email
                    this.firebaseHelper.resetEmailVerified(usr.uid) //força reset do email pq pode ocorrer de já ter o usuário criado na estrutura de login do Firebase
                    page('/confirmacao-dados-final')      
                } else {
                    //não registra erro aqui pq já registrou dentro de enviarEmailLinkValidacao
                    page('/erro')
                }
            }
        }
    }
    //configura tela de primeiro login de acordo com o tipo do primeiro login feito
    telaPrimeiroLoginConfig() {
        let celular = document.querySelector('#celular')
        let email = document.querySelector('#email')
        celular.addEventListener("keydown", function(event) {            
            if (event.key === "Enter") {
                event.preventDefault()
                email.focus()
            }
        })
        email.addEventListener("keydown", function(event) {            
            if (event.key === "Enter") {
                event.preventDefault()
                celular.focus()
            }
        })
        let labelCelular = document.querySelector('#label-primeiro-login-celular')
        let labelEmail = document.querySelector('#label-primeiro-login-email')
        if (this.validaSeLoginCelular(this.auth.currentUser)) {            
            $('.fp-input-celular').prop('required', 'false')
            $('.fp-input-email').prop('required', 'true')            
            labelCelular.innerHTML = 'Outro celular de contato (opcional)'
            labelEmail.innerHTML = 'E-mail (obrigatório)'            
        } else {            
            $('.fp-input-celular').prop('required', 'true')
            $('.fp-input-email').prop('required', 'false')
            labelCelular.innerHTML = 'Celular (obrigatório)'
            labelEmail.innerHTML = 'Outro e-mail de contato (opcional)'            
        }
    }

    telaConfirmacaoDadosFinalConfig() {
        if (this.auth.currentUser) { //Not empty
            let emailCadastro = sessionStorage.emailCadastro
            let emailAlternativo = sessionStorage.emailAlternativo
            let btnReenviaVerificacao = $('#btn-reenvia-verificacao')
            //let divNaoReconhece = $('#div-nao-reconhece-email')
            let msgPart1 = $('#msg-participante1')
            let msgPart2 = $('#msg-participante2')
            //let msgPart3 = $('#msg-participante3')
            if (emailCadastro === emailAlternativo) {
                msgPart1.text(`Identificamos que o e-mail ${emailAlternativo} informado já consta em nossa base da dados.`)
                msgPart2.texto(`Para a segurança de suas informações, enviamos um link de confirmação de acesso para este e-mail.`)
                msgPart3.text(`_`)            
            } else {
                btnReenviaVerificacao.click(() => {
                    this.firebaseHelper.enviarEmailLinkValidacao('proprio', emailCadastro, "")
                })    
                msgPart2.text(`Para a segurança de suas informações, enviamos um link de confirmação de acesso para seu e-mail cadastrado: ${emailCadastro}`)                
                if (emailAlternativo !== '') {
                    msgPart1.text(`Nenhum dos e-mails informados (${this.auth.currentUser.email} e ${emailAlternativo}) foram identificados em nossa base de dados.`)
                } else {
                    msgPart1.text(`O e-mail ${this.auth.currentUser.email} não foi identificado em nossos cadastros.`)
                }
            }
        }
    }

    validaSeLoginCelular(usr) {
        return usr.phoneNumber && usr.phoneNumber !== "" && (!usr.email || usr.email==="")
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
