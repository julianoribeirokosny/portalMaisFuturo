'use strict';

import contratacao from './contratacao.html';
import './contratacao.css';
import page from 'page'; 

export default {    
    template: contratacao,
    props: { 
        dados: {            
            type: Object,
            default: () => { 
                return {
                    titulo: 'Adesão',
                    mensagem: 'Mensagem de teste',
                    valor: '3.012,54'
                }
            }
        }
    },    
    data: function() {
        return {
        }
    },
    created(){  

    },
    mounted(){

    },
    methods: {

    }
}

