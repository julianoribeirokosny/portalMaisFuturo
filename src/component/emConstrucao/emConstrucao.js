'use strict';

import page from 'page';
import emConstrucao from './emConstrucao.html';
import './emConstrucao.css';

export default {
    template: emConstrucao,  
    data() {
        return {
            titulo:'Página </br>em construção!!!'
        }
    },  
    methods: {         
        voltar() {            
            page(`/${sessionStorage.ultimaPagina}`)
        }        
    },
}