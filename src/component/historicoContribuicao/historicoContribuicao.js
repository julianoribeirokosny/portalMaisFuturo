'use strict';

import page from 'page';
import historicoContribuicao from './historicoContribuicao.html';
import './historicoContribuicao.css';

const img_boleto = require('../../../public/images/Boleto.png')
const img_check = require('../../../public/images/Check.png')

export default {
    template: historicoContribuicao,
    props: { 
        historico: ''        
    },    
    data: function() {
        return {      
            titulo: 'Histórico de<br/>contribuição',
            showDialog: false,
            img_boleto: img_boleto,
            img_check: img_check
        }
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