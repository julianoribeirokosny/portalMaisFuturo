'use strict';

import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';
import FirebaseHelper from '../../FirebaseHelper'

const img_boleto = require('../../../public/images/Boleto.png')
const img_check = require('../../../public/images/Check.png')
const img_download_historico = require('../../../public/images/Download_historico.png')

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
            img_download_historico: img_download_historico
        }
    },        
    created(){
        this.chave = sessionStorage.chave
        this.getHistoricoContribuicao()
    },
    methods: {
        downloadHistorico () {
            alert('Palmeiras não tem mundial!!!')
        },
        getHistoricoContribuicao () {
            this.firebaseHelper.getHistoricoContribuicao(this.chave).then((data) => {
                if (data) {
                    this.historico = data
                }
            })
        },
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },
        extrato() {
            const extratoShow = (url) => {
                //window.location = url
                //page(`/${sessionStorage.ultimaPagina}`)
                window.open(url, '_blank');
            }
            this.firebaseHelper.downloadStorageFile("gs://portalmaisfuturo-teste.appspot.com/login/fYK5gpbuyQZk1Xy7qaCl02PketW2/1-686/extratoParticipante.pdf", extratoShow)
        }, 
        showModal() {
            this.$refs.myModal.style.display = "block";
        },
        closeModal() {
            this.$refs.myModal.style.display = "none";
        }
    },
}