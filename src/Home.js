'use strict';

import firebase from 'firebase/app'
import 'firebase/auth'
import Vue from 'vue/dist/vue.esm.js'
import VueCharts from 'vue-chartjs'
import money from 'v-money'
import simuladorEmprestimo from './component/simuladorEmprestimo/simuladorEmprestimo'
import rentabilidade from './component/rentabilidade/rentabilidade'
import simuladorSeguro from './component/simuladorSeguro/simuladorSeguro'
import simuladorRenda from './component/simuladorRenda/simuladorRenda'
import contratacaoAberta from './component/contratacaoAberta/contratacaoAberta'
import cadastro from './component/cadastro/cadastro'
import servicos from './component/servicos/servicos'
import emConstrucao from './component/emConstrucao/emConstrucao'
import historicoContribuicao from './component/historicoContribui\cao/historicoContribuicao'
import trocaParticipacao from './component/trocaParticipacao/trocaParticipacao'
import maisAmigos from './component/maisAmigos/maisAmigos'
import page from 'page';
import { Erros } from './Erros';

const financeiro = require('../functions/Financeiro')

// register directive v-money and component <money>
Vue.use(money, { precision: 4 })
    //Vue.use(VueMask);

/**
 * Handles the Home UI.
 */
export default class Home {
    /**
     * Inicializa a Home do POrtal MaisFuturo
     * @constructor
     */


    constructor(firebaseHelper) {
        this.firebaseHelper = firebaseHelper;
        // Firebase SDK.
        this.auth = firebase.auth();
        this.uid = ''
        this.participante = {}
        this.home = null
        this.data_Home = null
        this.vueObj = null
        this.chave = null
        this.contribuicao_Aberta = null
        this.emprestimo_Solicitado = null
        this.seguro_Solicitado = null
        this.consulta_contribuicao = null
        this.consulta_emprestimo = null
        this.consulta_seguro = null
    }

    async showHome() {
        let base_spinner = document.querySelector('#base_spinner')
        base_spinner.style.display = 'flex'

        this.auth = firebase.auth();

        if (!this.auth.currentUser) {
            Erros.registraErro('sem_uid', 'auth', 'showHome', 'currentUser === undefined')
            base_spinner.style.display = 'none'
            return page('/erro')
        }

        sessionStorage.url_foto = this.auth.currentUser.photoURL

        let firebaseHelper = this.firebaseHelper

        //registra login com sucesso
        if (!sessionStorage.dataUltimoLogin || sessionStorage.dataUltimoLogin === "") {
            firebaseHelper.gravaLoginSucesso(this.auth.currentUser.uid) //loga data-hora do login
            sessionStorage.dataUltimoLogin = new Date()
        }

        //console.log('=====> currentUser: ', this.auth.currentUser)
        if (!sessionStorage.chave || sessionStorage.chave === "undefined" || sessionStorage.chave === '') {
            sessionStorage.chave = await firebaseHelper.getUsuarioChavePrincipal(this.auth.currentUser.uid)
        }
        this.chave = sessionStorage.chave

        //console.log('U i D:', this.auth.currentUser.uid)
        //console.log('=====> CHAVE: ', sessionStorage.chave)
        if (this.chave === null || this.chave === '') {
            base_spinner.style.display = 'none'
            Erros.registraErro(this.auth.currentUser.uid, 'chave', 'showHome', 'chave nula ou em branco')
            return page('/erro')
        }

        //grava campo solicitação dados da API da Sinqia - atualização em backend asyncrono
        firebaseHelper.solicitaDadosSinqia(this.chave)

        let data_Home = await this.dadosHome(this.chave)
        if (data_Home === null) {
            //zera a session para tentar carregar em próximas vezes
            base_spinner.style.display = 'none'
            sessionStorage.chave = ''
            Erros.registraErro(this.auth.currentUser.uid, 'data_home', 'showHome', 'data_Home nulo')
            return page('/erro')
        }
        data_Home.educacao_financeira.url_video = ''

        //participante com inabilitado para acessar o portal
        if (!data_Home.vigente) {
            base_spinner.style.display = 'none'
            Erros.registraErro(this.auth.currentUser.uid, 'Participante não vigente', 'showHome', 'data_Home.vigente === false')
            return page('/erro')
        }

        let p1 = new Promise((resolve) => {
            firebaseHelper.getContratacaoEmAberto(this.chave, 'Contribuição mensal', 'solicitado').then((ret) => {
                this.contribuicao_Aberta = ret
                resolve(true)
            })
        })      
        let p2 = new Promise((resolve) => {
            firebaseHelper.getContratacaoEmAberto(this.chave, 'Empréstimo', 'solicitado').then((ret) => {
                this.emprestimo_Solicitado = ret
                resolve(true)
            })
        })
        let p3 = new Promise((resolve) => {
            firebaseHelper.getContratacaoEmAberto(this.chave, 'Seguro', 'solicitado').then((ret) => {
                this.seguro_Solicitado = ret
                resolve(true)
            })
        })
        let historicoRentabilidade
        let p4 = new Promise((resolve) => {
            firebaseHelper.getRentabilidade(this.data_Home.plano, this.data_Home.perfil_investimento ? this.data_Home.perfil_investimento : "Conservador").then((ret) => {
                historicoRentabilidade = ret
                resolve(true)
            })
        })
        let dadosSimuladorRenda
        let p5 = new Promise((resolve) => {
            firebaseHelper.getDadosSimuladorRenda(this.chave, this.auth.currentUser.uid).then((ret) => {
                dadosSimuladorRenda = ret
                resolve(true)
            })
        })
        let dadosSimuladorEmprestimo
        let p6 = new Promise((resolve) => {
            firebaseHelper.getDadosSimuladorEmprestimo(this.chave, this.auth.currentUser.uid).then((ret) => {
                dadosSimuladorEmprestimo = ret
                resolve(true)
            })
        })
        let dadosSimuladorSeguro 
        let p7 = new Promise((resolve) => {
            firebaseHelper.getDadosSimuladorSeguro(this.chave, this.auth.currentUser.uid).then((ret) => {
                dadosSimuladorSeguro = ret
                resolve(true)
            })
        })
        let listaHistoricoContribuicao
        let p8 = new Promise((resolve) => {
            firebaseHelper.getHistoricoContribuicao(this.chave).then((ret) => {
                listaHistoricoContribuicao = ret
                resolve(true)
            })
        })

        return Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]).then((retPromises) => {

            //this.contribuicao_Aberta = await firebaseHelper.getContratacaoEmAberto(this.chave, 'Contribuição mensal', 'solicitado')
            this.consulta_contribuicao = new Object()
            this.consulta_contribuicao.tipo = 'Contribuição mensal'
            this.consulta_contribuicao.titulo = 'Consulta </br>contratação em </br>aberto'
            this.consulta_contribuicao.dados = this.contribuicao_Aberta != null ? this.contribuicao_Aberta : null
            this.consulta_contribuicao.chave = this.chave
                //console.log('consulta_contribuicao ====>',this.consulta_contribuicao)

            //this.emprestimo_Solicitado = await firebaseHelper.getContratacaoEmAberto(this.chave, 'Empréstimo', 'solicitado')
            this.consulta_emprestimo = new Object()
            this.consulta_emprestimo.tipo = 'Empréstimo'
            this.consulta_emprestimo.titulo = 'Consulta </br>contratação de </br>empréstimo'
            this.consulta_emprestimo.dados = this.emprestimo_Solicitado != null ? this.emprestimo_Solicitado : null
            this.consulta_emprestimo.chave = this.chave
                //console.log('consulta_emprestimo ====> ',this.consulta_emprestimo)

            //this.seguro_Solicitado = await firebaseHelper.getContratacaoEmAberto(this.chave, 'Seguro', 'solicitado')
            this.consulta_seguro = new Object()
            this.consulta_seguro.tipo = 'Seguro'
            this.consulta_seguro.titulo = 'Consulta </br>contratação em </br>aberto'
            this.consulta_seguro.dados = this.seguro_Solicitado != null ? this.seguro_Solicitado : null
            this.consulta_seguro.chave = this.chave
                //console.log('Consulta Seguro ====> ', this.consulta_seguro)    
                //console.log('this.data_Home',this.data_Home)

            //let historicoRentabilidade = await firebaseHelper.getRentabilidade(this.data_Home.plano, this.data_Home.perfil_investimento)
                //console.log('TESTE-RENTABILIDADE',teste)

            //let dadosSimuladorRenda = await firebaseHelper.getDadosSimuladorRenda(this.chave, this.auth.currentUser.uid)
            //let dadosSimuladorEmprestimo = await firebaseHelper.getDadosSimuladorEmprestimo(this.chave, this.auth.currentUser.uid)
            //let dadosSimuladorSeguro = await firebaseHelper.getDadosSimuladorSeguro(this.chave, this.auth.currentUser.uid)

            dadosSimuladorRenda.rendaSolicitada = this.consulta_contribuicao
            //console.log('dadosSimuladorRenda::',dadosSimuladorRenda)
            
            dadosSimuladorSeguro.seguroSolicitado = this.consulta_seguro
            //console.log('dadosSimuladorSeguro::',dadosSimuladorSeguro)
            
            dadosSimuladorEmprestimo.emprestimoSolicitado = this.consulta_emprestimo
            //console.log('dadosSimuladorEmprestimo::',dadosSimuladorEmprestimo)

            //let listaHistoricoContribuicao = await firebaseHelper.getHistoricoContribuicao(this.chave)
            //console.log('listaHistoricoContribuicao', listaHistoricoContribuicao)


            Vue.component('grafico-reserva', {
                extends: VueCharts.Doughnut,
                mounted() {

                    //console.log('labelsDoughnut', data_Home.saldo_reserva.grafico.labels);
                    //console.log('Doughnut', data_Home.saldo_reserva.grafico);

                    this.renderChart({
                        labels: data_Home.saldo_reserva.grafico.labels,
                        datasets: [{
                            data: data_Home.saldo_reserva.grafico.data,
                            backgroundColor: data_Home.saldo_reserva.grafico.backgroundColor,
                            borderWidth: data_Home.saldo_reserva.grafico.borderWidth,
                            borderColor: data_Home.saldo_reserva.grafico.borderColor,
                        }]
                    }, {
                        cutoutPercentage: 88,
                        legend: false,
                        tooltips: false,
                    });
                }
            })
            Vue.component('projeto-vida', {
                extends: VueCharts.Line,
                mounted() {
                    var gradient = this.$refs.canvas.getContext("2d").createLinearGradient(0, 0, 0, 450);
                    gradient.addColorStop(0, "rgba(3, 49, 102, 0.9)");
                    gradient.addColorStop(0.5, "rgba(3, 49, 102, 0.9)");
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
                    data_Home.projeto_vida.grafico.datasets[3].backgroundColor = gradient;

                    this.renderChart({
                        labels: data_Home.projeto_vida.grafico.labels,
                        datasets: data_Home.projeto_vida.grafico.datasets
                    }, {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: false,
                        tooltips: false,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    callback: function(value) {
                                        return value / 1000 + ' k';
                                    }
                                }
                            }]
                        }
                    })
                }
            })
            Vue.component('contribuicao', {
                extends: VueCharts.Doughnut,
                //template: '#contribuicao',
                mounted() {
                    this.renderChart({
                        labels: data_Home.contribuicao.grafico.label,
                        datasets: [{
                            data: data_Home.contribuicao.grafico.data,
                            backgroundColor: data_Home.contribuicao.grafico.backgroundColor,
                            borderWidth: data_Home.contribuicao.grafico.borderWidth,
                            borderColor: data_Home.contribuicao.grafico.borderColor,
                        }]
                    }, {
                        cutoutPercentage: 88,
                        responsive: true,
                        legend: false,
                        tooltips: false,
                        rotation: 1 * Math.PI,
                        circumference: 1 * Math.PI
                    })
                }
            })
            Vue.config.errorHandler = function(err, vm, info) {
                console.log(`Error: ${err.toString()}\nInfo: ${info}`);
                Erros.registraErro(auth, 'Vuejs Error', 'showHome', JSON.stringify(err))
                page('/erro')
            }

            /*if (this.data_Home.contribuicao.itens.participante.valor !== 0 && this.isFloat(this.data_Home.contribuicao.itens.participante.valor)) {
                //console.log('this.data_Home.contribuicao.itens.participante.valor',this.data_Home.contribuicao.itens.participante.valor)
                this.data_Home.contribuicao.itens.participante.valor = financeiro.valor_to_string_formatado(this.data_Home.contribuicao.itens.participante.valor.toFixed(2), 2, false, true)
            }

            if (this.data_Home.contribuicao.itens.patronal.valor !== 0 && this.isFloat(this.data_Home.contribuicao.itens.patronal.valor)) {
                this.data_Home.contribuicao.itens.patronal.valor = financeiro.valor_to_string_formatado(this.data_Home.contribuicao.itens.patronal.valor.toFixed(2), 2, false, true)
            }

            if (this.data_Home.contribuicao.itens.seguro.valor !== 0 && this.isFloat(this.data_Home.contribuicao.itens.seguro.valor)) {
                this.data_Home.contribuicao.itens.seguro.valor = financeiro.valor_to_string_formatado(this.data_Home.contribuicao.itens.seguro.valor.toFixed(2), 2, false, true)
            }*/

            //console.log('this.data_Home', this.data_Home)
            let auth = this.auth.currentUser.uid

            if (!this.vueObj) {
                this.vueObj = new Vue({
                    renderError(h, err) {
                        location.reload()
                    },
                    components: {
                        simuladorEmprestimo,
                        rentabilidade,
                        simuladorSeguro,
                        simuladorRenda,
                        contratacaoAberta,
                        cadastro,
                        servicos,
                        emConstrucao,
                        historicoContribuicao,
                        trocaParticipacao,
                        maisAmigos
                    },
                    data: {
                        video: 'https://firebasestorage.googleapis.com/v0/b/portalmaisfuturo-teste.appspot.com/o/videos%2FReforma%20da%20Previd%C3%AAncia%20-%20Com%20Renato%20Follador%20e%20Thiago%20Nieweglowski.mp4?alt=media&token=883d2fe4-c6be-463e-8de2-727c0b5d0ea9',
                        componentKey: 0,
                        home: this.data_Home,
                        toggle: false,
                        chave: this.chave,
                        url_foto: sessionStorage.url_foto,
                        uid: this.auth.currentUser.uid,
                        contribuicaoSimulador: this.consulta_contribuicao,
                        rendaSimulador: dadosSimuladorRenda,
                        emprestimoSimulador: dadosSimuladorEmprestimo,
                        seguroSimulador: dadosSimuladorSeguro,
                        historicoContribuicao: listaHistoricoContribuicao,
                        historicoRentabilidade: historicoRentabilidade,
                        background: this.data_Home.mais_amigos.background
                    },
                    created() {
                        sessionStorage.ultimaPagina = 'home'
                    },
                    mounted() {
                        let rowParticipante = document.querySelector('#div-contribuicao-row-participante')
                        if (rowParticipante) {
                            document.querySelector('#div-contribuicao-row-participante-total').style.height = rowParticipante.clientHeight + "px"
                            document.querySelector('#div-contribuicao-row-participante-totalh').style.height = rowParticipante.clientHeight + "px"
                        }
                        let rowPatronal = document.querySelector('#div-contribuicao-row-patronal')
                        if (rowPatronal) {
                            document.querySelector('#div-contribuicao-row-patronal-total').style.height = rowPatronal.clientHeight + "px"
                            document.querySelector('#div-contribuicao-row-patronal-totalh').style.height = rowPatronal.clientHeight + "px"
                        }
                        let rowSeguro = document.querySelector('#div-contribuicao-row-seguro')
                        if (rowSeguro) {
                            document.querySelector('#div-contribuicao-row-seguro-total').style.height = rowSeguro.clientHeight + "px"
                            document.querySelector('#div-contribuicao-row-seguro-totalh').style.height = rowSeguro.clientHeight + "px"
                        }
                    },
                    methods: {
                        formatMoeda(value, incluiCifrao){
                            if (value === 0) {
                                return '(não contratado)'
                            } else if (value && value !== 0) {
                                let val = financeiro.valor_to_string_formatado(value, 2, incluiCifrao, true)
                                //return `R$ ${val}`
                                return val
                            }
                        },
                        maisamigos() {
                            page('/mais-amigos')
                        },
                        forceRerender() {
                            this.componentKey += 1;
                        },
                        error() {
                            base_spinner.style.display = 'none'
                            page('/erro')
                        },
                        toggleCategory() {
                            this.toggle = !this.toggle;
                        },
                        removerCampanha: function(campanha) {
                            campanha.ativo = false
                            firebaseHelper.removerCampanha(this.chave, campanha.nome)
                        },
                        contratarCampanha(link) {
                            sessionStorage.ultimaPagina = 'home'
                            page(`/${link}`)
                        },
                        simuladorSeguro(link) {
                            sessionStorage.ultimaPagina = 'home'
                            page(`/${link}`)
                        },
                        simuladorRenda(link, origem) {
                            sessionStorage.ultimaPagina = origem
                            page(`/${link}`)
                        },
                        contratacaoAberta() {
                            sessionStorage.ultimaPagina = 'home'
                            page('/contratacao-aberta')

                        }
                    },
                    errorCaptured(err, component, details) {
                        base_spinner.style.display = 'none'
                        Erros.registraErro(err, 'vuejs', 'showHome', JSON.stringify(err))
                        return page('/erro')
                    }
                })
                this.vueObj.$mount('#app');
            } else {
                this.vueObj.home = this.data_Home
                this.vueObj.contribuicaoAberta = this.consulta_contribuicao
                this.vueObj.rendaSimulador = dadosSimuladorRenda
                this.vueObj.emprestimoSimulador = dadosSimuladorEmprestimo
                this.vueObj.seguroSimulador = dadosSimuladorSeguro
                this.vueObj.chave = this.chave
                this.vueObj.url_foto = sessionStorage.url_foto
                this.vueObj.uid = this.auth.currentUser.uid
                this.vueObj.historicoContribuicao = listaHistoricoContribuicao
                this.vueObj.$forceUpdate()
                this.vueObj.forceRerender()
                    //console.log('this.vueObj',this.vueObj)
            }

            setTimeout(function() {
                base_spinner.style.display = 'none'
            }, 20)

            //Escuta por alterações na home ou no usuario
            firebaseHelper.registerForHomeUpdate((item, vigente) => this.refreshHome(item, vigente, 'home', this.chave))
            firebaseHelper.registerForUserUpdate(this.chave, (item, vigente) => this.refreshHome(item, vigente, 'usuarios', this.chave))

        })

    }

    isFloat(n) {
        return n != "" && !isNaN(n) && Math.round(n) != n;
    }

    async dadosHome(chave) {
        let homeAux = {}

        let p1 = new Promise((resolve, reject) => {
            resolve(this.firebaseHelper.getHome().then((data) => {
                if (data) {
                    //console.log('DATA-HOME:',data)
                    this.home = data
                    homeAux = data
                    return true
                } else {
                    return false
                }
            }))
        })

        let p2 = new Promise((resolve, reject) => {
            //if (Object.keys(this.participante).length === 0) {
            resolve(this.firebaseHelper.getParticipante(chave, 'home').then((part) => {
                    if (part === null) {
                        return false
                    } else {
                        this.participante = part
                            //console.log('PARTICIPANTE:',this.participante)
                        return true
                    }
                }))
                //} else {
                //  resolve(this.participante)
                //  return true
                //}
        })

        return Promise.all([p1, p2]).then(async(retPromises) => {

            if (!retPromises[0] || !retPromises[1]) {
                return null
            } else {

                let part = this.participante
                let segmentoUsuario = await this.firebaseHelper.getSegmento(part.segmento)

                //Verifica se há chaves "não vigentes" ou "para o usuário específico
                for (let u in part) {
                    if (part[u].hasOwnProperty('vigente') && !part[u].vigente) {
                        if (homeAux[u] && homeAux[u].hasOwnProperty('vigente')) {
                            homeAux[u].vigente = false
                        }
                    }
                }

                let stringHome = JSON.stringify(homeAux)

                let ultPos = 0

                // MERGE HOME + DADOS USUÁRIOS + SEGMENTO
                while (stringHome.indexOf('<<') >= 0) {

                    let posIni = stringHome.indexOf('<<')
                    let posFim = stringHome.indexOf('>>')
                    let chave = stringHome.substring(posIni + 2, posFim)
                    let caminho = chave.split('.')
                    let valor
                    let achouCaminhoPart = false,
                        achouCaminhoSeg = false

                    if (ultPos === posIni) {
                        return null
                    } else {
                        ultPos = posIni
                    }

                    // busca chave em usuario
                    if (chave.substring(0, 4) === 'usr_') {
                        // console.log('&&&& chave', chave)
                        // console.log('&&&& valor', part)
                        valor = part
                        for (let i in caminho) {
                            //console.log('&&&& caminho[i]', caminho[i])              
                            if (valor[caminho[i]] !== undefined) {
                                achouCaminhoPart = true
                                valor = valor[caminho[i]]
                                if (chave === 'usr_projeto_vida.acao.vigente') {
                                    //console.log('===> ', valor)
                                }

                            }
                        }
                    }

                    // busca chave em segmento
                    if (chave.substring(0, 4) === 'seg_') {
                        valor = segmentoUsuario
                        for (let i in caminho) {
                            if (valor[caminho[i]] !== undefined) {
                                achouCaminhoSeg = true
                                valor = valor[caminho[i]]
                            }
                        }
                    }

                    if (valor === undefined || (!achouCaminhoPart && !achouCaminhoSeg)) {
                        valor = ''
                    }

                    if (stringHome.indexOf('<<' + chave + '>>') < 0) {
                        stringHome = stringHome.replace('"<<' + chave + '>>"', 0)
                    } else if (typeof valor === "object" || valor === true || valor === false) {
                        valor = JSON.stringify(valor)
                        stringHome = stringHome.replace('"<<' + chave + '>>"', valor)
                    } else {
                        stringHome = stringHome.replace('<<' + chave + '>>', valor)
                    }
                }
                this.data_Home = JSON.parse(stringHome)
                    //console.log('this.data_Home', this.data_Home)
                return this.data_Home
            }
        })
    }

    'refreshHome' (item, vigente, origem, chave) {
        //console.log('====> refreshing home')
        return this.firebaseHelper.getParticipante(chave, 'home').then((part) => {
            if (!vigente) { //se for para desligar, não precisa avaliar critério
                this.data_Home[item].vigente = vigente
            } else {
                if (this.data_Home[item]) {
                    if (part[item] && part[item].vigente !== undefined) {
                        if (origem === 'home' && part[item].vigente) {
                            this.data_Home[item].vigente = vigente
                        } else if (origem === 'usuarios' && this.home[item].vigente) {
                            this.data_Home[item].vigente = vigente
                        }
                    } else {
                        this.data_Home[item].vigente = vigente
                    }
                }

            }
        })
    }
}