'use strict';

import vSelect from 'vue-select'
import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';
import FirebaseHelper from '../../FirebaseHelper'

import firebase from "firebase/app";
import "firebase/functions";   
const functions = firebase.functions();
const apiPrevidenciaDigital = functions.httpsCallable('apiPrevidenciaDigital')

const img_boleto = require('../../../public/images/Boleto.png')
const img_check = require('../../../public/images/Check.png')
const img_download_historico = require('../../../public/images/Download_historico.png')
const icon_extrato_contribuicoes = require('../../../public/images/ExtratoContribuicoes-IconS.png')


export default {
    template: historicoContribuicao, 
    components: {
        vSelect
    },   
    data: function() {
        return { 
            chave:'',
            historico: '',
            firebaseHelper: new FirebaseHelper(),     
            titulo: 'Histórico de<br/>contribuição',
            showDialog: false,
            img_boleto: img_boleto,
            img_check: img_check,
            img_download_historico: img_download_historico,
            icon_extrato_contribuicoes: icon_extrato_contribuicoes,
            vencimento: null,
            datasValidade: [],
            response: {
                data: {
                    _embedded:{
                        charges:[
                            {
                                id: '',
                                code: 0,
                                reference: '',
                                dueDate: '',
                                link: '', 
                                checkoutUrl: '',
                                installmentLink: '',
                                payNumber: '',
                                amount: 0,
                                billetDetails: {
                                    bankAccount: '', 
                                    ourNumber: '', 
                                    barcodeNumber: '', 
                                    portfolio: '', 
                                },
                                _links: {
                                    self: {
                                        href: ''
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            urlCobranca: 'https://us-east1-previdenciadigital-dev.cloudfunctions.net/adi/cobranca',
            cobranca: {
                'descricao': '', 
                'chave': '',
                'dataBase': '',
                'origemCobranca': 0,
                'valor': '',
                'vencimento': '',
                'diasAposVencimento': 0, 
                'tipoCobranca': 0,
                'nome': '',
                'cpf': '',
                'email': '',
                'notificar': true 
            }
        }
    },        
    created(){
        this.chave = sessionStorage.chave
        this.uid = sessionStorage.uid
        this.gerarDatasValidade()
        this.getHistoricoContribuicao()
    },
    watch: {   
        vencimento(newVal){
            if(newVal) {
                this.$refs.prosseguir.style.pointerEvents = 'visible'
                this.$refs.prosseguir.style.opacity = 1
            } else {                
                this.$refs.prosseguir.style.pointerEvents = 'none'
                this.$refs.prosseguir.style.opacity = 0.6
            }

        }
    },
    methods: {
        gerarDatasValidade(){
            var today = new Date()     
            var date =  new Date()
            for (var i = 0; i < 10; i++) {
                date.setDate(today.getDate()+i);
                var dd = date.getDate()
                var mm = date.getMonth() + 1        
                var yyyy = date.getFullYear()
                if (dd < 10) { 
                    dd = '0' + dd
                } 
                if (mm < 10) { 
                    mm = '0' + mm
                } 
                this.datasValidade.push(`${dd}/${mm}/${yyyy}`)                
            }
        },
        getHistoricoContribuicao () {
            if (!sessionStorage.historicoContribuicao || sessionStorage.historicoContribuicao === '') {
                this.firebaseHelper.getHistoricoContribuicao(this.chave).then((data) => {
                    if (data) {
                        sessionStorage.historicoContribuicao = JSON.stringify(data)
                        this.historico = data
                    }
                })    
            } else {
                this.historico = JSON.parse(sessionStorage.historicoContribuicao)
            }
        },
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },
        extrato() {
            //comportamento diferente para IOS -> Safari -> Iphone
            var windowRef
            let isIOS = localStorage.isIos==="true"
            let isMac = localStorage.isMac==="true"
            const extratoShow = (url) => {
                if (isIOS || isMac) {
                    windowRef.location = url
                } else {
                    window.open(url, '_blank');
                }
            }
            if (isIOS || isMac) {
                windowRef = window.open();   
            }
            this.firebaseHelper.downloadStorageFile(`gs://${sessionStorage.nomeProjeto}.appspot.com/login/${this.uid}/${this.chave}/extratoParticipante.pdf`, extratoShow)
        }, 
        selecionarBoleto(item) {
            let usuario = JSON.parse(sessionStorage.participante)
            this.cobranca.descricao = `CONTRIBUIÇÃO ${item.anoMes}`, 
            this.cobranca.chave = item.chave,
            this.cobranca.dataBase = item.anoMes,
            this.cobranca.origemCobranca = 'Segunda via',
            this.cobranca.valor = item.valor,
            this.cobranca.vencimento = this.vencimento,
            this.cobranca.diasAposVencimento = 29, //configuração
            this.cobranca.tipoCobranca = 'BOLETO',
            this.cobranca.nome = usuario.data.cadastro.informacoes_pessoais.nome,
            this.cobranca.cpf = usuario.data.cadastro.informacoes_pessoais.cpf,
            this.cobranca.email = usuario.data.cadastro.informacoes_pessoais.email,
            this.cobranca.notificar = true //configuração            
            this.$refs.vencimentoModal.style.display = "block"
        },
        emitirBoleto() {
            var self = this
            self.cobranca.vencimento = self.vencimento 
            self.cobranca.valor = parseFloat(self.cobranca.valor.replace(',','.'))
            console.log('self.cobranca', self.cobranca)         
            self.$refs.vencimentoModal.style.display = "none"
            let base_spinner = document.querySelector('#base_spinner')
            base_spinner.style.display = 'flex'
            self.response = null

            apiPrevidenciaDigital({idApi: 'boleto', body: self.cobranca, metodo: 'POST'}).then((response) => { 
                if (!response.data.sucesso) {
                    console.log('Erro ao chamar boletos:'+response.erro)
                    base_spinner.style.display = 'none'
                    /* TODO 
                    1. chamar método de Log de Erros!
                    2. Chamar tela geral de erros
                    */
                } else {
                    console.log('SUCESSO!!!!')
                    self.response = JSON.parse(response.data.response)
                    console.log('response._embedded.charges',self.response._embedded.charges)
                    self.$refs.boletoModal.style.display = "block"
                    base_spinner.style.display = 'none'
                }
            }).catch((error) => {
                console.log('ERRO!!!!', error)
                    /* TODO 
                    1. chamar método de Log de Erros!
                    2. Chamar tela geral de erros
                    */

            })
            
            /*axios.post(self.urlCobranca, self.cobranca, self.axiosHeaders)
                .then(response => {
                    if (response) {
                        console.log('responseAPI',response)
                        self.response = response
                        console.log('response.Data._embedded.charges',self.response.data._embedded)
                        self.$refs.boletoModal.style.display = "block"
                        base_spinner.style.display = 'none'
                    }                                    
                }).catch(error => {
                    console.log('error',error)
                    base_spinner.style.display = 'none'
                }
            ) */      
            self.vencimento = null             
        },
        closeModal(modal) {
            this.$refs[modal].style.display = "none";
        },
        copiarCodigoBarras() {
            let codigoBarras = document.querySelector('#codigoBarras')
            codigoBarras.setAttribute('type', 'text')    
            codigoBarras.select()            
            document.execCommand('copy');
            codigoBarras.setAttribute('type', 'hidden')
            window.getSelection().removeAllRanges()
        }
    },
}