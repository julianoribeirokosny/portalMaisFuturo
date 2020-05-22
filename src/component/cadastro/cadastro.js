'use strict';

import Vue from 'vue/dist/vue.esm.js'
import vSelect from 'vue-select'; 
import 'vue-select/dist/vue-select.css'
import cadastro from './cadastro.html';
import './cadastro.css';
import page from 'page';
import FirebaseHelper from '../../FirebaseHelper';
import cep from 'cep-promise'
import { VueMaskDirective } from 'v-mask'

Vue.directive('mask', VueMaskDirective);

const img_editar = require('../../../public/images/Editar.png')

export default {  
    template: cadastro,
    components: { 
        vSelect
    },
    props: { 
        foto:'',
        chave_usuario:''        
    },    
    data: function() {
        return {                       
            firebaseHelper: new FirebaseHelper(),
            cadastro: null,
            cep: null,
            email: null,
            finalizado: false,
            error_banco: false,
            img_editar: img_editar,
            reg: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,24}))$/,
            estados_civis: [{ label: 'Casado', value: 'Casado' }, 
                            { label: 'Solteiro', value: 'Solteiro' },
                            { label: 'Viúvo', value: 'Viúvo' },
                            { label: 'Separado', value: 'Separado' },
                            { label: 'Divorciado', value: 'Divorciado' }],
            classValid: {
                'hasvalid': false,
                'hasinvalid': false
            },
            profissoes: [ 'Apple', 'Banana', 'Orange', 'Mango', 'Pear', 'Peach', 'Grape', 'Tangerine', 'Pineapple'],
        }        
    },
    created(){        
        this.getParticipante()        
    },
    watch: {     
        cep(val){
            if(val.length === 10) {
                this.getEndereco(val)
            }
        },
        email(newVal, oldVal) {            
            if(oldVal && newVal.length >= 6) {
                var teste = this.isEmailValid(newVal)
                if(teste) {
                    this.classValid.hasvalid = true
                    this.classValid.hasinvalid = false
                    this.$refs.salvar.style.pointerEvents = 'visible'
                    this.$refs.salvar.style.opacity = 1
                }
                else {
                    this.classValid.hasvalid = false
                    this.classValid.hasinvalid = true
                    this.$refs.salvar.style.pointerEvents = 'none'
                    this.$refs.salvar.style.opacity = 0.6
                }                
            }
        },
        finalizado(val) {            
            if(val) {                
                this.intervaloMSG()          
            }
        }
    },
    methods: { 
        isEmailValid(email) {
            return this.reg.test(email)
        },
        intervaloMSG(){
            setInterval(() => { 
                this.finalizado = false
             }, 5000);
        }, 
        getParticipante() {
            return this.firebaseHelper.getParticipante(this.chave_usuario, 'data/cadastro')
                .then( cad => {                        
                    this.cadastro = cad 
                    this.cep = this.cadastro.endereco.cep
                    this.email = this.cadastro.informacoes_pessoais.email                  
                }
            )
        },    
        voltar() {
            page('/home')
        },
        salvar() {   
            this.cadastro.informacoes_pessoais.email = this.email
            var cadastro = this.firebaseHelper.salvarCadastro(this.chave_usuario, 'data/cadastro', this.cadastro)
            if(cadastro) {
                this.finalizado = true
            } else {
                this.finalizado = false
                this.error_banco = true
            }
        },selectAll(element) {            
            eval(`this.$refs.${element.toElement.id}.select()`)            
        },
        getEndereco(val) {
            let cep_num = val.replace('.','').replace('-','')            
            cep(cep_num)
            .then(retorno => {
                if(this.cadastro.endereco) {
                    this.cadastro.endereco.logradouro = retorno.street
                    this.cadastro.endereco.bairro = retorno.neighborhood
                    this.cadastro.endereco.cidade = retorno.city
                    this.cadastro.endereco.estado = retorno.state
                    this.cadastro.endereco.cep = val
                }                
            })
            .catch(console.log)
        }        
    }
}