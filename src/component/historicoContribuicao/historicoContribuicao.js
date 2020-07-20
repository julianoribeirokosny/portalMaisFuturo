'use strict';

import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';
import FirebaseHelper from '../../FirebaseHelper'

const img_boleto = require('../../../public/images/Boleto.png')
const img_check = require('../../../public/images/Check.png')
const img_download_historico = require('../../../public/images/Download_historico.png')
const icon_extrato_contribuicoes = require('../../../public/images/ExtratoContribuicoes-IconS.png')

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
            icon_extrato_contribuicoes: icon_extrato_contribuicoes
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
            this.firebaseHelper.downloadStorageFile(`gs://portalmaisfuturo-teste.appspot.com/login/${this.uid}/${this.chave}/extratoParticipante.pdf`, extratoShow)
        }, 
        showModal() {
            this.$refs.myModal.style.display = "block";
        },
        closeModal() {
            this.$refs.myModal.style.display = "none";
        }
    },
}