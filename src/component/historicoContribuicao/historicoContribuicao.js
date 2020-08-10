'use strict';

import vSelect from 'vue-select'
import page from 'page'
import historicoContribuicao from './historicoContribuicao.html'
import './historicoContribuicao.css'
import FirebaseHelper from '../../FirebaseHelper'
import firebase from "firebase/app"
import "firebase/functions"
import { Erros } from '../../Erros'

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
            boleto: null,
            participante:'',
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
                numeroDePagamento:'',
                link:''          
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
        this.participante = JSON.parse(sessionStorage.participante)        
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
        gerarDatasValidade() {
            var date =  new Date()
            for (var i = 0; i < 10; i++) {
                if (i != 0) {                    
                    date = new Date(date.getTime()+1000*60*60*24)                
                }
                var dd = date.getDate()
                var mm = date.getMonth() + 1        
                var yyyy = date.getFullYear()
                if (dd < 10) { 
                    dd = '0' + dd                } 
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
            if (this.participante.transacoes && this.participante.transacoes.boleto) {
                let dataBase = item.anoMes.replace('/','')
                let names = Object.getOwnPropertyNames(this.participante.transacoes.boleto).sort()                
                if (names) {
                    this.boleto = this.participante.transacoes.boleto[dataBase]                    
                }            
            }
            this.cobranca.descricao = `CONTRIBUIÇÃO ${item.anoMes}`, 
            this.cobranca.chave = item.chave,
            this.cobranca.dataBase = item.anoMes,
            this.cobranca.origemCobranca = 'Segunda via',
            this.cobranca.valor = item.valor,
            this.cobranca.vencimento = this.vencimento,
            this.cobranca.diasAposVencimento = 29, //configuração
            this.cobranca.tipoCobranca = 'BOLETO',
            this.cobranca.nome = this.participante.data.cadastro.informacoes_pessoais.nome,
            this.cobranca.cpf = this.participante.data.cadastro.informacoes_pessoais.cpf,
            this.cobranca.email = this.participante.data.cadastro.informacoes_pessoais.email,
            this.cobranca.notificar = true //configuração            
            this.$refs.vencimentoModal.style.display = "block"
        },
        emitirBoleto() {
            
            var base_spinner = document.querySelector('#base_spinner')
            var self = this
            self.cobranca.vencimento = self.vencimento 
            self.cobranca.valor = parseFloat(self.cobranca.valor.replace(',','.'))                  
            self.$refs.vencimentoModal.style.display = "none"
            base_spinner.style.display = 'flex' 
            //console.log('self.cobranca',self.cobranca)
            apiPrevidenciaDigital({idApi: 'boleto', body: self.cobranca, metodo: 'POST'}).then((response) => {                                 
                if (!response.data.sucesso) {
                    Erros.registraErro('Erro ao chamar boletos:', 'serviços', 'historicoContribuição',response.erro)
                    base_spinner.style.display = 'none'
                    return page('/erro')                    
                } else {                    
                    self.response = JSON.parse(response.data.response)                    
                    this.salvarNovoBoleto()
                    self.$refs.boletoModal.style.display = "block"
                }
                base_spinner.style.display = 'none'
            }).catch((error) => {
                Erros.registraErro('Erro ao chamar boletos:', 'serviços', 'historicoContribuição',error)
                base_spinner.style.display = 'none'
                return page('/erro')
            })
            self.vencimento = null             
        },
        salvarNovoBoleto() {
            var self = this
            var boleto = new Object()
            var dataBase = self.cobranca.dataBase.replace('/','')
            boleto[dataBase] = {
                                    link: self.response.link,
                                    numeroDePagamento: self.response.numeroDePagamento,
                                    vencimento: self.cobranca.vencimento
                                 }
            self.firebaseHelper.salvarNovoBoleto(self.chave, boleto)
            self.firebaseHelper.getParticipante(self.chave).then((ret) => {
                sessionStorage.participante = JSON.stringify(ret)                   
                self.participante = ret
            })
        },
        closeModal(modal) {
            this.$refs[modal].style.display = "none";
        },
        copiarCodigoBarras(id) {
            let codigoBarras = document.querySelector(`#${id}`)
            codigoBarras.setAttribute('type', 'text')    
            codigoBarras.select()            
            document.execCommand('copy');
            codigoBarras.setAttribute('type', 'hidden')
            window.getSelection().removeAllRanges()
        }
    },
}