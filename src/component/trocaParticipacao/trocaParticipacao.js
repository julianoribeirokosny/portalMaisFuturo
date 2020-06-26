'use strict';

import trocaParticipacao from './trocaParticipacao.html';
import './trocaParticipacao.css';
import page from 'page';
import FirebaseHelper from '../../FirebaseHelper';
import $ from 'jquery';

export default {
    template: trocaParticipacao,
    props: {
        uid: '',
        competencia: ''
    },
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),
            listaChaves: new Array(),
            showDialog: false,
            //foto: sessionStorage.url_foto ? sessionStorage.url_foto : "../images/silhouette.jpg",
            novaChave: null
        }
    },
    created() {
        this.getParticipacoes()
    },
    methods: {
        getParticipacoes() {
            let foto = $('.fp-avatar').css('background-image').replace('url("','').replace('")','')
            
            return this.firebaseHelper.getUsuarioChave(this.uid)
                .then(chaves => {
                    if (chaves) {
                        let arrayChaves = Object.entries(chaves)
                        arrayChaves.forEach(item => {
                            let fotoParticipante = sessionStorage.nome && sessionStorage.nome !== "" && sessionStorage.nome === item[1].nome ? foto : "../images/silhouette.jpg"
                            let objeto = {
                                chave: item[0],
                                nome: item[1].nome,
                                plano: item[1].plano,
                                segmento: item[1].segmento,
                                foto: fotoParticipante
                            }
                            this.listaChaves.push(objeto)
                        })
                    }
                })
        },
        selecionarNovaChave(chave) {
            sessionStorage.chave = chave
            page('/home')
        },
        showModal(chave) {
            this.novaChave = chave
            this.$refs.Modal_tp.style.display = "block";
        },
        closeModal() {
            this.$refs.Modal_tp.style.display = "none";
        }
    }
}