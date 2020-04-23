'use strict';

import contratacaoAberta from './contratacaoAberta.html';
import './contratacaoAberta.css';
import page from 'page'; 
import FirebaseHelper from '../../FirebaseHelper';

const financeiro = require('../../../functions/Financeiro')

export default {    
    template: contratacaoAberta,
    props: { 
        dados: {            
            type: Object,
            default: () => { 
                return {
                    titulo: 'Consulta',
                    dados: ''
                }
            }            
        }
    },    
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),
            id:'',
            contratacao: null,
            valor_anterior: 0,
            valor_atual: 0,
            finalizado: false,
            error_banco: false
        }
    },
    created(){             
        let name = Object.getOwnPropertyNames(this.dados.dados).sort()
        console.log('Let Name',name)
        this.id = name[0]
        this.contratacao = this.dados.dados[this.id]
        console.log('Contratação Solicitada ===>',this.contratacao)
        if(this.contratacao.valor_anterior) {
            this.valor_anterior = financeiro.float_to_string(this.contratacao.valor_anterior.toFixed(2))
        }
        if(this.contratacao.valor_solicitado) {
            this.valor_atual = financeiro.float_to_string(this.contratacao.valor_solicitado.toFixed(2))
        }
    },
    methods: {             
        retornaHome(){
            page('/home')
        },
        cancelarContratacao() {            
            var contratacao = this.firebaseHelper.cancelarContratacao(this.dados.chave, this.id, this.dados.tipo)            
            if(contratacao) {
                this.finalizado = true
            } else if(!contratacao) {
                this.finalizado = false
                this.error_banco = true
            }
        }
    }
}
