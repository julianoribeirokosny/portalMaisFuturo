'use strict';

import trocaParticipacao from './trocaParticipacao.html';
import './trocaParticipacao.css';
import page from 'page';
import FirebaseHelper from '../../FirebaseHelper';

export default {
    template: trocaParticipacao,
    props: {
        uid: '',
        competencia: ''
    },
    data: function() {
        console.log('---------->sessionStorage.url_foto:', sessionStorage.url_foto)
        return {
            firebaseHelper: new FirebaseHelper(),
            listaChaves: new Array(),
            showDialog: false,
            foto: sessionStorage.url_foto ? sessionStorage.url_foto : "../images/silhouette.jpg",
            novaChave: null
        }
    },
    created() {
        this.getParticipacoes()
    },
    methods: {
        getParticipacoes() {
            return this.firebaseHelper.getUsuarioChave(this.uid)
                .then(chaves => {
                    if (chaves) {
                        let arrayChaves = Object.entries(chaves)
                        arrayChaves.forEach(item => {
                            let objeto = {
                                chave: item[0],
                                nome: item[1].nome,
                                plano: item[1].plano,
                                segmento: item[1].segmento
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