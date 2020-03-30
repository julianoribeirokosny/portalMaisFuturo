'use strict';

import firebase from 'firebase/app';
import 'firebase/auth';
import Vue from 'vue/dist/vue.esm.js';
import VueCharts from 'vue-chartjs';
import money from 'v-money';
import simuladorEmprestimo from './component/simuladorEmprestimo/simuladorEmprestimo';
import rentabilidade from './component/rentabilidade/rentabilidade';
import simuladorSeguro from './component/simuladorSeguro/simuladorSeguro';
import page from 'page';

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
  }  

  async showHome() {
   
    this.auth = firebase.auth();
    if (!this.auth.currentUser) {
      return
    }

    let firebaseHelper = this.firebaseHelper
    console.log('====> usuário logado:', this.auth.currentUser)    

    //ATENÇÃO!!!!!!!!!!!!!!
    // AQUI o último campo de getUsuarioChave deve trazer a opção da visualição da participação feita pelo
    //    usuário no menu de seleção de visualizar participações!!!!!!!
    let chave = await firebaseHelper.getUsuarioChave(this.auth.currentUser.uid, 0)
    console.log('=====> CHAVE: ', chave)
    if (chave===null) {
      //return page('/erro')
    }


    let data_Home = await this.dadosHome(chave)
    if (data_Home===null) {
      return 
    }    

    Vue.component('grafico-reserva', {
        extends: VueCharts.Doughnut,
        mounted () {

            console.log('labelsDoughnut', data_Home.saldo_reserva.grafico.labels);
            console.log('Doughnut', data_Home.saldo_reserva.grafico);

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

    Vue.component('projeto-vida', {
        extends: VueCharts.Line,
        mounted () {            
            var gradient = this.$refs.canvas.getContext("2d").createLinearGradient(0, 0, 0, 450);
            gradient.addColorStop(0, "rgba(3, 49, 102, 0.9)");
            gradient.addColorStop(0.5, "rgba(3, 49, 102, 0.9)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            data_Home.projeto_vida.grafico.datasets[3].backgroundColor = gradient;

            console.log('Projeto de vida:',data_Home.projeto_vida.grafico.datasets);

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
    
    if (!this.vueObj) {
      this.vueObj = new Vue({
        components: {
            simuladorEmprestimo,
            rentabilidade,
            simuladorSeguro
        },
        data: {
            home: this.data_Home,
            toggle: false,
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
              firebaseHelper.removerCampanha(chave, campanha.nome)
          },
          contratarCampanha(link) {
              page(`/${link}`)
          },
          simuladorSeguro(link) {
              page(`/${link}`)
          }
        }
      })
      this.vueObj.$mount('#app'); 
    } else {
      this.vueObj.$forceUpdate(); 
    }
    
    //Escuta por alterações na home ou no usuario
    firebaseHelper.registerForHomeUpdate((item, vigente) => this.refreshHome(item, vigente, 'home', chave))
    firebaseHelper.registerForUserUpdate(chave, (item, vigente) => this.refreshHome(item, vigente, 'usuarios', chave))
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
        resolve(this.firebaseHelper.getParticipante(chave).then((part) => {
          console.log('====> part', part)
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

        console.log('===> home', this.home)
        console.log('===> participante', this.participante)

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

          console.log('===========> chave', chave)

          // busca chave em usuario
          if (chave.substring(0,4) === 'usr_') {
            valor = part
            for (let i in caminho) {
              if (valor[caminho[i]]!==undefined) {
                valor = valor[caminho[i]]
              }
            }  
          }

          // busca chave em segmento
          if (chave.substring(0,4) === 'seg_') {
            valor = segmentoUsuario
            for (let i in caminho) {
              if (valor[caminho[i]]!==undefined) {
                valor = valor[caminho[i]]
              }
            }  
          }

          if (valor===undefined) {
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
    return this.firebaseHelper.getParticipante(chave).then((part) => {
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