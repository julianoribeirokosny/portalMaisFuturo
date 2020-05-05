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
import page from 'page';
import {Erros} from './Erros';

// register directive v-money and component <money>
Vue.use(money, {precision: 4})
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
    this.consulta_contribuicao = null
    this.consulta_emprestimo = null
  }  

  async showHome() {
   
    this.auth = firebase.auth();
    if (!this.auth.currentUser) {
      Erros.registraErro('', 'auth', 'showHome')
      return page('/erro')
    }
    let firebaseHelper = this.firebaseHelper

    //registra login com sucesso
    firebaseHelper.gravaLoginSucesso(this.auth.currentUser.uid) //loga data-hora do login

    //ATENÇÃO!!!!!!!!!!!!!!
    // AQUI o último campo de getUsuarioChave deve trazer a opção da visualição da participação feita pelo
    //    usuário no menu de seleção de visualizar participações!!!!!!!
    this.chave = await firebaseHelper.getUsuarioChave(this.auth.currentUser.uid, 0)
    //console.log('=====> CHAVE: ', this.chave)
    if (this.chave===null) {
      Erros.registraErro(this.auth.currentUser.uid, 'chave', 'showHome')
      return page('/erro')
    }

    //grava campo solicitação dados da API da Sinqia - atualização em backend asyncrono
    firebaseHelper.solicitaDadosSinqia(this.chave) //loga data-hora do login

    let data_Home = await this.dadosHome(this.chave)
    if (data_Home===null) {
      Erros.registraErro(this.auth.currentUser.uid, 'data_home', 'showHome')
      return page('/erro')
    }    
    
    //participante com inabilitado para acessar o portal
    if (!data_Home.vigente) {
      Erros.registraErro(this.auth.currentUser.uid, 'Participante não vigente', 'showHome')
      return page('/erro')
    }    

    this.contribuicao_Aberta = await firebaseHelper.getContratacaoEmAberto(this.chave, 'Contribuição mensal', 'solicitado')
    this.consulta_contribuicao = new Object()
    this.consulta_contribuicao.tipo = 'Contribuição mensal'
    this.consulta_contribuicao.titulo = 'Consulta </br>contratação em </br>aberto'    
    this.consulta_contribuicao.dados = this.contribuicao_Aberta != null ? this.contribuicao_Aberta : null
    this.consulta_contribuicao.chave = this.chave    
    //console.log('consulta_contribuicao ====>',this.consulta_contribuicao)

    this.emprestimo_Solicitado = await firebaseHelper.getContratacaoEmAberto(this.chave, 'Empréstimo', 'solicitado')
    this.consulta_emprestimo = new Object()
    this.consulta_emprestimo.tipo = 'Empréstimo'
    this.consulta_emprestimo.titulo = 'Consulta </br>contratação de </br>empréstimo'
    this.consulta_emprestimo.dados = this.emprestimo_Solicitado != null ? this.emprestimo_Solicitado : null  
    this.consulta_emprestimo.chave = this.chave    
    //console.log('consulta_emprestimo ====> ',this.consulta_emprestimo)

    let dadosSimuladorRenda = await firebaseHelper.getDadosSimuladorRenda(this.chave, this.auth.currentUser.uid)
    let dadosSimuladorEmprestimo = await firebaseHelper.getDadosSimuladorEmprestimo(this.chave, this.auth.currentUser.uid)

    dadosSimuladorEmprestimo.emprestimoSolicitado = this.emprestimo_Solicitado

    Vue.component('grafico-reserva', {
        extends: VueCharts.Doughnut,
        mounted () {

            //console.log('labelsDoughnut', data_Home.saldo_reserva.grafico.labels);
            //console.log('Doughnut', data_Home.saldo_reserva.grafico);

            this.renderChart({labels: data_Home.saldo_reserva.grafico.labels,
              datasets: [{
                  data: data_Home.saldo_reserva.grafico.data,
                  backgroundColor: data_Home.saldo_reserva.grafico.backgroundColor,
                  borderWidth: data_Home.saldo_reserva.grafico.borderWidth,
                  borderColor: data_Home.saldo_reserva.grafico.borderColor,
              }]}, {cutoutPercentage: 88,              
                legend: false});
        }
    });

    //console.log('===> gráfico reserva ok')

    Vue.component('projeto-vida', {
        extends: VueCharts.Line,
        mounted () {            
            var gradient = this.$refs.canvas.getContext("2d").createLinearGradient(0, 0, 0, 450);
            gradient.addColorStop(0, "rgba(3, 49, 102, 0.9)");
            gradient.addColorStop(0.5, "rgba(3, 49, 102, 0.9)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            data_Home.projeto_vida.grafico.datasets[3].backgroundColor = gradient;

            //console.log('Projeto de vida:',data_Home.projeto_vida.grafico.datasets);

            this.renderChart({
                labels: data_Home.projeto_vida.grafico.labels,
                datasets: data_Home.projeto_vida.grafico.datasets
                }, {                  
                    responsive: true, 
                    maintainAspectRatio: false,                    
                    legend: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                callback: function(value) {                                  
                                    return value/1000 + ' k';
                                }                                
                            }
                        }]
                    }
                }
            )
        }
    });

    //console.log('===> projeto vida ok')

    Vue.component('contribuicao', {
        extends: VueCharts.Doughnut,        
        //template: '#contribuicao',
        mounted () {            
            this.renderChart({              
                  labels: data_Home.contribuicao.grafico.label,
                  datasets: [{
                      data: data_Home.contribuicao.grafico.data,
                      backgroundColor: data_Home.contribuicao.grafico.backgroundColor,
                      borderWidth: data_Home.contribuicao.grafico.borderWidth,
                      borderColor: data_Home.contribuicao.grafico.borderColor,
                  }]
                },
                {
                    cutoutPercentage: 88,
                    responsive: true,
                    legend: false,
                    rotation: 1 * Math.PI,
                    circumference: 1 * Math.PI
                }
              )
        }
    });
    
    //console.log('===> gráfico contribuicao ok')

    if (!this.vueObj) {
      this.vueObj = new Vue({
        components: {
            simuladorEmprestimo,
            rentabilidade,
            simuladorSeguro,
            simuladorRenda,
            contratacaoAberta,
            cadastro,
        },        
        data: {
            home: this.data_Home,
            toggle: false,
            chave: this.chave,
            uid: this.auth.currentUser.uid,
            contribuicaoAberta: this.consulta_contribuicao,            
            rendaSimulador: dadosSimuladorRenda,
            emprestimoSimulador: dadosSimuladorEmprestimo,
            dataSimulador: {
                titulo: "Simulador </br>de Empréstimo",
                descricao: "Você tem até R$ 8.500,00 </br>pré aprovado.",
                slider: { 
                          min: 12,
                          max: 60,
                          value: 24,
                          step: 1
                        }
            }
        },        
        methods: {          
            toggleCategory: function() {
              this.toggle = !this.toggle;
            },
            removerCampanha: function(campanha) {
                campanha.ativo = false                
                firebaseHelper.removerCampanha(this.chave, campanha.nome)
            },
            contratarCampanha(link) {
                page(`/${link}`)
            },
            simuladorSeguro(link) {
                page(`/${link}`)
            },
            simuladorRenda(link) {
                page(`/${link}`)
            },
            contratacaoAberta() {
                page('/contratacao-aberta')               
            }
        }
      })
      this.vueObj.$mount('#app'); 
    } else {
      this.vueObj.$forceUpdate(); 
    }
    
    //Escuta por alterações na home ou no usuario
    firebaseHelper.registerForHomeUpdate((item, vigente) => this.refreshHome(item, vigente, 'home', this.chave))
    firebaseHelper.registerForUserUpdate(this.chave, (item, vigente) => this.refreshHome(item, vigente, 'usuarios', this.chave))
  }

  async dadosHome(chave) {
    //debugger;
    let homeAux = {}

    let p1 = new Promise((resolve, reject) => {
      resolve(this.firebaseHelper.getHome().then((data) => {
        if (data) {
          this.home = data
          homeAux = data
          return true
        } else {
          return false
        }
      }))
    })

    let p2 = new Promise((resolve, reject) => {
      if (Object.keys(this.participante).length === 0) {
        resolve(this.firebaseHelper.getParticipante(chave, 'home').then((part) => {
          if (part===null) {
            return false
          } else {
            this.participante = part
            return true
          }
        }))  
      } else {
        resolve(this.participante)
        return true
      }
    })

    return Promise.all([p1, p2]).then(async (retPromises) => {
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

        // MERGE HOME + DADOS USUÁRIOS + SEGMENTO
        while (stringHome.indexOf('<<') >= 0) {

          let posIni = stringHome.indexOf('<<')
          let posFim = stringHome.indexOf('>>')
          let chave = stringHome.substring(posIni+2, posFim)
          let caminho = chave.split('.')
          let valor
          let achouCaminhoPart = false, achouCaminhoSeg = false

          // busca chave em usuario
          if (chave.substring(0,4) === 'usr_') {
            valor = part

            if (chave === 'usr_contribuicao.lista_itens_contribuicao') {
              console.log('************** valor inicial', valor)
            }
  

            for (let i in caminho) {
              if (valor[caminho[i]]!==undefined) {
                achouCaminhoPart = true
                valor = valor[caminho[i]]
                if (chave === 'usr_contribuicao.lista_itens_contribuicao') {
                  console.log('************** valor indo...', valor)
                }
    
              }
            }  
          }

          if (chave === 'usr_contribuicao.lista_itens_contribuicao') {
            console.log('************** usr_contribuicao.lista_itens_contribuicao', valor)
          }

          // busca chave em segmento
          if (chave.substring(0,4) === 'seg_') {
            valor = segmentoUsuario
            for (let i in caminho) {
              if (valor[caminho[i]]!==undefined) {
                achouCaminhoSeg = true
                valor = valor[caminho[i]]
              }
            }  
          }

          if (valor===undefined || (!achouCaminhoPart && !achouCaminhoSeg)) {
            valor = ''
          }

          if (stringHome.indexOf('<<'+ chave + '>>') < 0) {
            stringHome = stringHome.replace('"<<'+ chave + '>>"', 0)
          } else if (typeof valor === "object" || valor === true || valor === false) {
            valor = JSON.stringify(valor)
            stringHome = stringHome.replace('"<<'+ chave + '>>"', valor)     
          } else {
            stringHome = stringHome.replace('<<'+ chave + '>>', valor)           
          }
        }
        this.data_Home = JSON.parse(stringHome)
        console.log('this.data_Home', this.data_Home)
        return this.data_Home
      }
    })
  }
  
  'refreshHome'(item, vigente, origem, chave) {
    console.log('====> refreshing home')
    return this.firebaseHelper.getParticipante(chave, 'home').then((part) => {
      if (!vigente) { //se for para desligar, não precisa avaliar critério
        this.data_Home[item].vigente = vigente 
      } else {
        if (this.data_Home[item]) {
          if (part[item] && part[item].vigente !== undefined) {
            if (origem==='home' && part[item].vigente) {
              this.data_Home[item].vigente = vigente 
            } else if (origem==='usuarios' && this.home[item].vigente) {
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