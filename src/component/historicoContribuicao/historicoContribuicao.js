'use strict';

import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';
import FirebaseHelper from '../../FirebaseHelper'

const img_boleto = require('../../../public/images/Boleto.png')
const img_check = require('../../../public/images/Check.png')

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
            img_check: img_check
        }
    },        
    created(){
        this.chave = sessionStorage.chave
        this.getHistoricoContribuicao()
    },
    methods: {
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