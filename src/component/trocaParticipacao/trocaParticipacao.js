'use strict';

import trocaParticipacao from './trocaParticipacao.html';
import './trocaParticipacao.css';
import page from 'page';
import FirebaseHelper from '../../FirebaseHelper';

export default {  
    template: trocaParticipacao,   
    props: {         
        uid: ''
    },         
    data: function() {
        return {                       
            firebaseHelper: new FirebaseHelper(),
            listaChaves: new Array(),
            showDialog: false,
            foto: sessionStorage.url_foto,
            novaChave: null
        }        
    },
    created(){        
        this.getParticipacoes()        
    },
    methods: { 
        getParticipacoes() {
            return this.firebaseHelper.getUsuarioChave(this.uid)
                .then( chaves => {
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
                }
            )
        },    
        selecionarNovaChave(chave) {
            sessionStorage.chave = chave
            page('/home')  
        },
        showModal(chave) {
            //console.log('chave',chave)
            this.novaChave = chave
            //console.log('this.chave',this.chave)
            this.$refs.Modal_tp.style.display = "block";
        },
        closeModal() {
            this.$refs.Modal_tp.style.display = "none";
        }
    }
}