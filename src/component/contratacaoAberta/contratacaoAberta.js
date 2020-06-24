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
                    dados: '',
                }
            }            
        }
    },    
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),
            id:'',
            tipo:'',
            contratacao: null,
            valor_anterior: 0,
            valor_atual: 0,
            finalizado: false,
            error_banco: false
        }
    },       
    created() {        
        this.carregarDados()
    },    
    methods: {
        carregarDados(){
            if(this.dados.dados) {
                let name = Object.getOwnPropertyNames(this.dados.dados).sort()                
                this.id = name[0]           
                this.contratacao = this.dados.dados[this.id]
                this.tipo = this.contratacao.tipo
                if (this.contratacao.valor_anterior) {
                    this.valor_anterior = financeiro.valor_to_string_formatado((this.contratacao.valor_anterior.toFixed(2)), 2, false, true)
                }
                if(this.contratacao.valor_solicitado) {
                    this.valor_atual = financeiro.valor_to_string_formatado(this.contratacao.valor_solicitado.toFixed(2), 2, false, true)
                }
            } else {
                this.finalizado = true
            }
        },         
        retornar() {            
            page(`/${sessionStorage.ultimaPagina}`)
        },
        cancelarContratacao() {            
            var contratacao = this.firebaseHelper.cancelarContratacao(this.dados.chave, this.id, this.tipo)            
            if(contratacao) {
                this.finalizado = true
            } else if(!contratacao) {
                this.finalizado = false
                this.error_banco = true
            }
            
        }
    }
}
