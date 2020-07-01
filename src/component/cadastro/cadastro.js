'use strict'

import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import cadastro from './cadastro.html'
import './cadastro.css'
import page from 'page'
import FirebaseHelper from '../../FirebaseHelper'
import cep from 'cep-promise'
import { TheMask } from 'vue-the-mask'
import $ from 'jquery';

const img_editar = require('../../../public/images/Editar.png')

export default {
    template: cadastro,
    components: {
        vSelect,
        TheMask
    },
    props: {
        foto: '',
        chave_usuario: '',
        uid: '',
        competencia: ''
    },
    data: function() {
        let foto = $('.fp-avatar').css('background-image').replace('url("','').replace('")','')
        return {
            avatar: foto ? foto : "../images/silhouette.jpg",
            firebaseHelper: new FirebaseHelper(),
            cadastro: null,
            cep: null,
            email: null,
            emailPrincipal: '',
            finalizado: false,
            error_banco: false,
            img_editar: img_editar,
            reg: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,24}))$/,
            estados_civis: [{ label: 'Casado', value: 'Casado' },
                { label: 'Solteiro', value: 'Solteiro' },
                { label: 'Viúvo', value: 'Viúvo' },
                { label: 'Separado', value: 'Separado' },
                { label: 'Divorciado', value: 'Divorciado' }
            ],
            classValid: {
                'hasvalid': false,
                'hasinvalid': false
            },
            profissoes: [],
            listaProfissoes: [],
            profissao: ''
        }
    },
    created() {
        this.getParticipante()
        this.getProfissoes()
        this.$root.$on('atualizaProfissao', (valor) => {
            this.profissao = valor
        })
    },
    watch: {
        cep(val) {
            if (val.length === 10) {
                this.getEndereco(val)
            }
        },
        email(newVal, oldVal) {
            if (oldVal && newVal.length >= 6) {
                var teste = this.isEmailValid(newVal)
                if (teste) {
                    this.classValid.hasvalid = true
                    this.classValid.hasinvalid = false
                    this.$refs.salvar.style.pointerEvents = 'visible'
                    this.$refs.salvar.style.opacity = 1
                } else {
                    this.classValid.hasvalid = false
                    this.classValid.hasinvalid = true
                    this.$refs.salvar.style.pointerEvents = 'none'
                    this.$refs.salvar.style.opacity = 0.6
                }
            }
        },
        finalizado(val) {
            if (val) {
                this.intervaloMSG()
            }
        }
    },
    methods: {
        getProfissoes() {
            return this.firebaseHelper.getProfissoes()
                .then(ret => {
                    this.listaProfissoes = Object.entries(ret)
                    this.listaProfissoes.forEach(prof => {
                        this.profissoes.push(prof[0])
                    })
                })
        },
        isEmailValid(email) {
            return this.reg.test(email)
        },
        intervaloMSG() {
            setInterval(() => {
                this.finalizado = false
            }, 5000);
        },
        getParticipante() {
            console.log('=====> this.competencia', this.competencia)
            this.firebaseHelper.getParticipante(this.chave_usuario, 'data/cadastro')
                .then(cad => {
                    this.cadastro = cad
                    this.cep = this.cadastro.endereco.cep
                    this.email = this.cadastro.informacoes_pessoais.email
                    this.profissao = ''
                    if (this.cadastro.informacoes_pessoais.profissao) {
                        this.profissao = this.cadastro.informacoes_pessoais.profissao.nome
                    }
                })
            this.firebaseHelper.getUsuario(this.uid)
                .then(response => {
                    this.emailPrincipal = response.email_principal
                })
        },
        voltar() {
            page('/home')
        },
        salvar() {

            console.log('$ R O O T:', this.$root)
            let profissao = this.listaProfissoes.filter(p => {
                if (p[0] === this.profissao) {
                    return Object.entries(p)
                }
            })
            if (profissao.length > 0) {
                this.cadastro.informacoes_pessoais.profissao = {
                    nome: profissao[0][0],
                    seguro: profissao[0][1]
                }
                this.cadastro.informacoes_pessoais.email = this.email
                var cadastro = this.firebaseHelper.salvarCadastro(this.chave_usuario, 'data/cadastro', this.cadastro)
                if (cadastro) {
                    this.$root.$emit('nova::Profissao')
                    this.finalizado = true


                } else {
                    this.finalizado = false
                    this.error_banco = true
                }
            } else {
                this.finalizado = false
                this.error_banco = true
            }
        },
        getEndereco(val) {
            let cep_num = val.replace('.', '').replace('-', '')
            cep(cep_num)
                .then(retorno => {
                    if (this.cadastro.endereco) {
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