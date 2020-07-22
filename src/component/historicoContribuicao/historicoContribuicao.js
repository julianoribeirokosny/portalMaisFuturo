'use strict';

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
                    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjIxODQ1OWJiYTE2NGJiN2I5MWMzMjhmODkxZjBiNTY1M2UzYjM4YmYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSnVsaWFubyBLb3NueSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHallldkhHUHJYb3p0MVNERkw3RUQ4LVN1a0xNTFFpVHpDbUlZbm1kUSIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wcmV2aWRlbmNpYWRpZ2l0YWwtZGV2IiwiYXVkIjoicHJldmlkZW5jaWFkaWdpdGFsLWRldiIsImF1dGhfdGltZSI6MTU5NTAxMjg0OSwidXNlcl9pZCI6Im50eVk4NWNRU0tmcElGOWVsNWNSTkVBTlN4aTEiLCJzdWIiOiJudHlZODVjUVNLZnBJRjllbDVjUk5FQU5TeGkxIiwiaWF0IjoxNTk1MDE3OTYyLCJleHAiOjE1OTUwMjE1NjIsImVtYWlsIjoianVsaWFub2tvc255QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTA3MDkwMTE0ODc2MjYwMDY3MjY2Il0sImVtYWlsIjpbImp1bGlhbm9rb3NueUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.lmN7q9FQr_Kl12FnVvOGpV-c4mRx7BkreB4XkvqLhqeGn0XBJGSCqo7IK3TqXlJaspne2BOrZ5G-WyNh_tRA2VP-TXXrzWBMwWX3J0tT5lb7cb7JiSyF9p5Hyp2lbJMfyxKD6-ikizrYDomJJGBQxaqf9d8ruWDLt6m9Atfu16AF6f_AnnlPQyrYue9KaxHMBnaPkFsPOOVvqwVmWKT94xePyCyLiqsRCflR57jWPjhA6EQ44yIvZ1G_QY-UnDKgbs2N_B-0DMR7_dwI4HwFYLKy1-Dp0667DAfwY_OeHkKpkyWgB5q_CnakryQBH8YceRnvm0o8mU2TKLiNYb9bGw'
                }
            },
            axiosBody: {
                'chave': 'aasd3435156',
                'valor': 12455
            },
            response: null,
            urlCobranca: 'https://us-east1-previdenciadigital-dev.cloudfunctions.net/adi/cobranca'
        }
    },        
    created(){
        this.chave = sessionStorage.chave
        this.uid = sessionStorage.uid
        this.getHistoricoContribuicao()
    },
    methods: {
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
        emitirBoleto(item) {
            let base_spinner = document.querySelector('#base_spinner')
            base_spinner.style.display = 'flex'
            var self = this;
            self.response = null
            //console.log('ITEM:', item)  
            axios.post(this.urlCobranca, this.axiosBody, this.axiosHeaders)
                .then(response => {
                    if (response) {
                        //console.log('axios response',response)
                        self.response = response.data.ref
                        self.$refs.boletoModal.style.display = "block"
                        base_spinner.style.display = 'none'
                    }                                    
                }).catch(error => {
                    console.log('error',error)
                    base_spinner.style.display = 'none'
                })            
            //console.log('this.response:',self.response)            
        },
        closeModal() {
            this.$refs.boletoModal.style.display = "none";
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