'use strict';

import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';

export default {
    template: historicoContribuicao,
    props: { 
        historico: ''        
    },    
    data: function() {
        return {      
            titulo: 'Histórico de<br/>contribuição',
            showDialog: false
        }
    },
    mounted(){        
    },
    methods: {
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },
        showModal() {
            this.$refs.myModal.style.display = "block";
        },
        closeModal() {
            this.$refs.myModal.style.display = "none";
        }
    },
}