'use strict';

import vSelect from 'vue-select'
import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';
import FirebaseHelper from '../../FirebaseHelper'

const img_boleto = require('../../../public/images/Boleto.png')
const img_check = require('../../../public/images/Check.png')
const img_download_historico = require('../../../public/images/Download_historico.png')
const icon_extrato_contribuicoes = require('../../../public/images/ExtratoContribuicoes-IconS.png')
const axios = require('axios')

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
            axiosHeaders: {
                headers :  {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZjZmMyMzViZDYxMGZhY2FlYzVlYjBhZGU5NTg5ZGE5NTI4MmRlY2QiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSnVsaWFubyBLb3NueSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHallldkhHUHJYb3p0MVNERkw3RUQ4LVN1a0xNTFFpVHpDbUlZbm1kUSIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wcmV2aWRlbmNpYWRpZ2l0YWwtZGV2IiwiYXVkIjoicHJldmlkZW5jaWFkaWdpdGFsLWRldiIsImF1dGhfdGltZSI6MTU5NTM1MjYwMCwidXNlcl9pZCI6Im50eVk4NWNRU0tmcElGOWVsNWNSTkVBTlN4aTEiLCJzdWIiOiJudHlZODVjUVNLZnBJRjllbDVjUk5FQU5TeGkxIiwiaWF0IjoxNTk1MzYzNzY1LCJleHAiOjE1OTUzNjczNjUsImVtYWlsIjoianVsaWFub2tvc255QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTA3MDkwMTE0ODc2MjYwMDY3MjY2Il0sImVtYWlsIjpbImp1bGlhbm9rb3NueUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.Sj2Ir7qC_hkzWL2sJWH-kmP6BO5bdqpFd2deR2v5y7m85aBa0_jTnrTOw72_AHKiQLd3yb34HG9PCtbmkfT5C8nR2vxTvTLEq5qulNzLaBbxGDfIf6A7-vSasFDYO6PMIaMmTXPIIBYRb1RIVBPyqa9pJ-mIiHKfSMTeF0Bdc_2AIi5Q5Fq1LibdYML0ywklYOLWeE7bj7iHvFHex0Lkrk9xzuDuuqoHs_Ss-yC0jahN3G7YIB_v6ey9ZFUxGPAbI4YAfmKXVMWcz0CWncp8zi4A7oGpy4XrhDjcu1okWgjnQD4LZCfeiQ1f4fEpWQTy9xLdpc5rBsSpb55sC_yZrw'
                }
            },
            axiosBody: {
                'chave': 'asdfasdf',
                'valor': 123456
            },
            vencimento: null,
            datasValidade: [],
            response: null,
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
            const extratoShow = (url) => {
                window.open(url, '_blank');
            }
            this.firebaseHelper.downloadStorageFile(`gs://portalmaisfuturo-teste.appspot.com/login/${this.uid}/${this.chave}/extratoParticipante.pdf`, extratoShow)
        },
        selecionarBoleto(item) {
            let usuario = JSON.parse(sessionStorage.participante)
            this.cobranca.descricao = `CONTRIBUIÇÃO ${item.anoMes}`, 
            this.cobranca.chave = item.chave,
            this.cobranca.dataBase = item.anoMes,
            this.cobranca.origemCobranca = 'Segunda via boleto',
            this.cobranca.valor = item.valor,
            this.cobranca.vencimento = this.vencimento,
            this.cobranca.diasAposVencimento = 60, //configuração
            this.cobranca.tipoCobranca = 'Boleto',
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
            axios.post(self.urlCobranca, self.cobranca, self.axiosHeaders)
                .then(response => {
                    if (response) {
                        self.response = response.data.ref
                        self.$refs.boletoModal.style.display = "block"
                        base_spinner.style.display = 'none'
                    }                                    
                }).catch(error => {
                    console.log('error',error)
                    base_spinner.style.display = 'none'
                }
            )       
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