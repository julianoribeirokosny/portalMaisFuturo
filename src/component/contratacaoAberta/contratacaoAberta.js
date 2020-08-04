'use strict';

import contratacaoAberta from './contratacaoAberta.html';
import './contratacaoAberta.css';
import page from 'page'; 
import FirebaseHelper from '../../FirebaseHelper';
import "firebase/functions";   
import $ from 'jquery';

const functions = firebase.functions()
const apiPipefy = functions.httpsCallable('apiPipefy')
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
            tipo:'',
            contratacao: null,
            valor_anterior: 0,
            valor_atual: 0,
            finalizado: false,
            efetivada: false,
            error_banco: false,
            msg_vigencia: "",
            cancelada: false,
            lancada: false
        }
    },       
    created() {
        this.carregarDados()
    },
    methods: {
        async carregarDados(){      
            
            $('#msg-vigencia').hide();
            if(this.dados.dados) {
                let name = Object.getOwnPropertyNames(this.dados.dados).sort()                
                this.id = name[0]           

                let dadosCard = {
                    cardId: this.dados.dados[this.id].cardId, 
                    chave: this.dados.chave
                }

                this.contratacao = this.dados.dados[this.id]
                this.tipo = this.contratacao.tipo
                if (this.contratacao.valor_anterior) {
                    this.valor_anterior = financeiro.valor_to_string_formatado((this.contratacao.valor_anterior.toFixed(2)), 2, false, true)
                }
                if(this.contratacao.valor_solicitado) {
                    this.valor_atual = financeiro.valor_to_string_formatado(this.contratacao.valor_solicitado.toFixed(2), 2, false, true)
                }

                // verifica status do card e altera se estiver concluído ou
                apiPipefy({acao: 'consultarCard', body: dadosCard}).then((ret) => { 
                    if (!ret.data.sucesso) {
                        console.log('Erro ao chamar Pipefy:'+ret.erro)
                        base_spinner.style.display = 'none'
                    } else {
                        console.log('SUCESSO!!!!')
                        let response = ret.data.response
                        if (response.data.card && 
                            (response.data.card.current_phase.name === "Concluído" || response.data.card.current_phase.name === "Concluído (Sem Email)")
                            ) {    
                            let fields = response.data.card.fields
                            let iniVigencia = ''
                            fields.forEach(item => {
                                console.log('===> item', item)
                                console.log('==> item.name', item.name)
                                if (item.name === "Início Vigência") {
                                    iniVigencia = item.value
                                }
                            });
                            this.contratacao.status = 'Efetivada'
                            this.msg_vigencia = `* O novo valor estará vigente a partir de ${iniVigencia}`
                            this.efetivada = true
                            /*$('#msg-vigencia').show()
                            $('#cancelar-contratacao').hide()*/
                        }    
                        if (response.data.card && response.data.card.current_phase.name === "Em Validação") {               
                            this.lancada = true
                        }
                        if (response.data.card && response.data.card.current_phase.name === "Cancelado") {               
                            this.tipo = 'Cancelado pelo Mais Futuro'
                            this.msg_vigencia = '* Por favor entre em contato com nossos consultores através do fone: (41) 3515-9804.'
                            this.cancelada = true
                            /*$('#msg-vigencia').show();
                            $('#cancelar-contratacao').hide()*/
                        }    

                    }
                })                 


            } else {
                this.finalizado = true
            }
        },         
        retornar() {
            if(sessionStorage.ultimaPagina == 'servicos') {
                this.$emit('recarregarDados')          
            }  
            page(`/${sessionStorage.ultimaPagina}`)
        },
        cancelarContratacao() {       

            let dadosCard = {
                cardId: this.dados.dados[this.id].cardId, 
                chave: this.dados.chave
            }

            apiPipefy({acao: 'cancelarCard', body: dadosCard}).then((ret) => { 
                var contratacao = this.firebaseHelper.cancelarContratacao(this.dados.chave, this.id, this.tipo)
                if(contratacao) {
                    this.finalizado = true
                } else if(!contratacao) {
                    this.finalizado = false
                    this.error_banco = true
                }    
            })           
        }
    }
}
