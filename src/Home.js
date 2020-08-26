'use strict';

import firebase from 'firebase/app'
import 'firebase/auth'
import Vue from 'vue'
import VueCharts from 'vue-chartjs'
import money from 'v-money'
import minhaContribuicao from './component/minhaContribuicao/minhaContribuicao'
import simuladorEmprestimo from './component/simuladorEmprestimo/simuladorEmprestimo'
import rentabilidade from './component/rentabilidade/rentabilidade'
import simuladorSeguro from './component/simuladorSeguro/simuladorSeguro'
import simuladorRenda from './component/simuladorRenda/simuladorRenda'
import cadastro from './component/cadastro/cadastro'
import servicos from './component/servicos/servicos'
import emConstrucao from './component/emConstrucao/emConstrucao'
import historicoContribuicao from './component/historicoContribuicao/historicoContribuicao'
import trocaParticipacao from './component/trocaParticipacao/trocaParticipacao'
import maisAmigos from './component/maisAmigos/maisAmigos'
import disclaimer from './component/disclaimer/disclaimer'
import outrasSolicitacoes from './component/outrasSolicitacoes/outrasSolicitacoes'
import page from 'page';
import { Erros } from './Erros';
import { VueMaskDirective } from 'v-mask'

const financeiro = require('../functions/Financeiro')
const utils = require('../functions/utilsFunctions')
const Enum = require('../src/Enum')

// register directive v-money and component <money>
Vue.use(money, { precision: 4 })
    //Vue.use(VueMask);
Vue.directive('mask', VueMaskDirective)

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
        this.data_Home = null
        this.vueObj = null
        this.chave = null        
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

        sessionStorage.uid = this.auth.currentUser.uid
        sessionStorage.url_foto = this.auth.currentUser.photoURL

        let firebaseHelper = this.firebaseHelper

        //registra login com sucesso
        if (!sessionStorage.dataUltimoLogin || sessionStorage.dataUltimoLogin === "") {
            firebaseHelper.gravaLoginSucesso(this.auth.currentUser.uid) //loga data-hora do login
            sessionStorage.dataUltimoLogin = new Date()
        }
        
        let chaveAnterior = this.chave 

        //caso a seleção da chave tenha falhado, busca a chave principal
        if (!sessionStorage.chave || sessionStorage.chave === '') {
            sessionStorage.chave = await this.firebaseHelper.getUsuarioChavePrincipal(this.auth.currentUser.uid)
        }
  
        this.chave = sessionStorage.chave
        
        if (this.chave === null || this.chave === '') {
            base_spinner.style.display = 'none'
            Erros.registraErro(this.auth.currentUser.uid, 'chave', 'showHome', 'chave nula ou em branco')
            return page('/erro')
        }

        let dadosParticipante = await this.dadosHome(this.chave)        
        let data_Home = dadosParticipante.dataHome 
        sessionStorage.plano = data_Home.plano
        sessionStorage.perfil_investimento = data_Home.perfil_investimento ? data_Home.perfil_investimento : "Conservador"
        //sessionStorage.perfil_investimento = data_Home.perfil_investimento ? data_Home.perfil_investimento : Enum.perfilInvestimento.CONSERVADOR        
        let contratacaoContrib = dadosParticipante.contratacaoContrib
        let contratacaoEmp =  dadosParticipante.contratacaoEmp
        let contratacaoSeg = dadosParticipante.contratacaoSeg

        //grava campo solicitação dados da API da Sinqia - atualização em backend asyncrono
        firebaseHelper.solicitaDadosSinqia(this.chave, dadosParticipante.data.cadastro, data_Home.competencia, this.auth.currentUser.uid, chaveAnterior !== this.chave)

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

        Vue.component('grafico-reserva', {
            extends: VueCharts.Doughnut,
            mounted() {
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

        Vue.config.errorHandler = function(err, vm, info) {
            console.error(`Error: ${err.toString()}\nInfo: ${info}`);
            Erros.registraErro(auth, 'Vuejs Error', 'showHome', JSON.stringify(err))
            page('/erro')
        }

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
                    cadastro,
                    servicos,
                    emConstrucao,
                    historicoContribuicao,
                    trocaParticipacao,
                    maisAmigos,
                    minhaContribuicao,
                    disclaimer,
                    outrasSolicitacoes
                },
                data: {
                    componentKey: 0,
                    home: this.data_Home,
                    toggle: false,
                    chave: this.chave,
                    url_foto: sessionStorage.url_foto,
                    uid: this.auth.currentUser.uid,
                    background: this.data_Home.mais_amigos.background,
                    contratacaoContrib: contratacaoContrib,
                    contratacaoEmp: contratacaoEmp,    
                    contratacaoSeg: contratacaoSeg,
                    competencia: this.data_Home.competencia,
                    disclaimerMensagem: Enum.disclaimer.RENDA
                },
                created() {
                    sessionStorage.ultimaPagina = 'home'
                },                    
                methods: {
                    formatMoeda(value, incluiCifrao){
                        if (value === 0) {
                            return '(não contratado)'
                        } else if (value && value !== 0) {
                            let val = financeiro.valor_to_string_formatado(value, 2, incluiCifrao, true)
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
            this.vueObj.contratacaoContrib = contratacaoContrib
            this.vueObj.contratacaoEmp = contratacaoEmp    
            this.vueObj.contratacaoSeg = contratacaoSeg
            this.vueObj.chave = this.chave
            this.vueObj.url_foto = sessionStorage.url_foto
            this.vueObj.uid = this.auth.currentUser.uid
            this.vueObj.competencia = this.data_Home.competencia                
            this.vueObj.$forceUpdate()
            this.vueObj.forceRerender()
        }
        setTimeout(function() {
            base_spinner.style.display = 'none'
        }, 20)
    }

    async dadosHome(chave) {

        let p0 = this.firebaseHelper.getHome().then((data) => {
            if (data) {
                return data
            } else {
                return false
            }
        })

        let p1 = new Promise((resolve) => {
            if (Object.keys(this.participante).length === 0 || this.participante.chave !== chave) {
                this.firebaseHelper.getParticipante(chave).then((ret) => {
                    if (ret === null) {
                        base_spinner.style.display = 'none'
                        Erros.registraErro(this.auth.currentUser.uid, 'chave', 'dadosHome', 'dados Home nulo ou inválido')
                        sessionStorage.chave = ''
                        return page('/erro')
                    }
                    sessionStorage.dadosSimuladorSeguro = ''
                    sessionStorage.chave = chave                
                    sessionStorage.participante = JSON.stringify(ret)                
                    resolve(ret)
                    //return true    
                })
            } else {
                resolve(this.participante)
                //return true
            }
        })

        //validação de contratos em aberto
        let p2 = this.validaSeContratoAberto(Enum.contratacao.RENDA)
        let p3 = this.validaSeContratoAberto(Enum.contratacao.EMPRESTIMO)
        let p4 = this.validaSeContratoAberto(Enum.contratacao.SEGURO)
        let p5 = this.validaSeContratoAberto(Enum.contratacao.RENDA_2)

        return Promise.all([p0, p1, p2, p3, p4, p5]).then(async(retPromises) => {

            if (!retPromises[0] || !retPromises[1] || retPromises[1] === null) {
                return null
            } else {

                let home = retPromises[0]
                this.participante = retPromises[1]
                let part = this.participante.home
                let segmentoUsuario = await this.firebaseHelper.getSegmento(part.segmento)
                let contratacaoContrib = retPromises[5] ? retPromises[5] : retPromises[2] 
                let contratacaoEmp = retPromises[3]
                let contratacaoSeg = retPromises[4]
                this.data_Home = this.montaStringHome(home, part, segmentoUsuario)
                this.participante.data.cadastro.dados_plano.plano
                //console.log('this.data_Home', this.data_Home)
                return {
                    data: this.participante.data,
                    dataHome: this.data_Home,
                    contratacaoContrib: contratacaoContrib,
                    contratacaoEmp: contratacaoEmp,
                    contratacaoSeg: contratacaoSeg
                }
            }
        })
    }

    montaStringHome(homeAux, part, segmentoUsuario) {

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

        let retHome = JSON.parse(stringHome)

        //ajustes de mensagens para situações específicas
        if (part.usr_situacao_plano === "Com Contribuição Suspensa") {
            let msg = 'Garanta um futuro melhor. Que tal voltar a contribuir?'
            retHome.contribuicao.acao.descricao = msg
            retHome.projeto_vida.acao.descricao = msg
        }
        
        return retHome     
    }

    validaSeContratoAberto(tipoContratacao) {
        let dataHoje = utils.dateFormat(new Date(), false, false, false, false, false)
        return this.firebaseHelper.getContratacao(this.chave, tipoContratacao).then((contratacao) => {
            if(contratacao) {
                contratacao = contratacao[Object.keys(contratacao)[0]]
                if (contratacao.status === Enum.statusContratacao.EFETIVADA) {
                    return contratacao.iniVigencia > dataHoje
                } else {
                    return contratacao.status === Enum.statusContratacao.SOLICITADO
                }
            } else {
                return false
            }
        })
       
    }
}