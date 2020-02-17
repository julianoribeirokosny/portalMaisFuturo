'use strict';

//import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
//import {MaterialUtils} from './Utils';
import '../node_modules/chart.js';
import VueCharts from 'vue-chartjs';
import { Bar, Line, Doughnut } from 'vue-chartjs';

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
    this.uid = '1234567890'
    this.home = null
    this.data_Home = null
  }

  async showHome() {

    let uid = this.uid    
    let data_Home = await this.dadosHome(uid)
    let firebaseHelper = this.firebaseHelper
    if (data_Home===null) {
      return 
    }

    Vue.component('grafico-reserva', {
        extends: VueCharts.Doughnut,        
        template: '#grafico-reserva',
        mounted () {
            this.renderChart({              
                  labels: data_Home.saldo_reserva.grafico.labels,
                  datasets: [{
                      data: data_Home.saldo_reserva.grafico.data,
                      backgroundColor: data_Home.saldo_reserva.grafico.backgroundColor,
                      borderWidth: data_Home.saldo_reserva.grafico.borderWidth,
                      borderColor: data_Home.saldo_reserva.grafico.borderColor,
                  }]
                },
                {
                    cutoutPercentage: 88,
                    responsive: true,
                    legend: false
                }
              )
        }
    });

    Vue.component('projeto-vida', {
        extends: VueCharts.Line,        
        template: '#projeto-vida',        
        mounted () {

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
        template: '#contribuicao',
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

    var app = new Vue({
      el: '#app',        
      data: {      
        home: this.data_Home,
        toggle: false,    
      },
      created() {
        console.log("projeto", this.projeto);
      },
      methods: {          
        toggleCategory: function() {
          this.toggle = !this.toggle;
        },
        removerCampanha: function(campanha) {
            campanha.ativo = false
            firebaseHelper.removerCampanha(uid, campanha.nome)
        }
      }
    });

    //Escuta por alterações na home ou no usuario
    firebaseHelper.registerForHomeUpdate((item, vigente) => this.refreshHome(item, vigente, 'home'))
    firebaseHelper.registerForUserUpdate(uid, (item, vigente) => this.refreshHome(item, vigente, 'usuarios'))
  }

  async dadosHome(uid) {
    //debugger;
    let homeAux = {}
    let user = {}

    let p1 = new Promise((resolve, reject) => {
      resolve(this.firebaseHelper.getHome().then((data) => {
        if (data) {
          console.log('home===>', data)
          this.home = data
          homeAux = data
          return true
        } else {
          return false
        }
      }))
    })

    let p2 = new Promise((resolve, reject) => {
      resolve(this.firebaseHelper.getUser(uid).then((u) => {
        console.log('user===>', u)
        if (u===null) {
          return false
        } else {
          user = u
          return true
        }
      }))
    })

    return Promise.all([p1, p2]).then(async (retPromises) => {
      if (!retPromises[0] || !retPromises[1]) {
        return null
      } else {

        let segmentoUsuario = await this.firebaseHelper.getSegmento(user.segmento)


        console.log('home===>', homeAux)
        console.log('user===>', user)
        console.log('segm===>', segmentoUsuario)

        //Verifica se há chaves "não vigentes" ou "para o usuário específico
        for (let u in user) {
          if (user[u].hasOwnProperty('vigente') && !user[u].vigente) {
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

          console.log('chave:', chave)
          console.log('tipochave:', chave.substring(0,3))
          console.log('caminho:', caminho)

          // busca chave em usuario
          if (chave.substring(0,4) !== 'seg_') {
            valor = user
            for (let i in caminho) {
              if (valor[caminho[i]]!==undefined) {
                valor = valor[caminho[i]]
                console.log('--> caminho:', caminho[i])
                console.log('valor de user:', valor)
              }
            }  
          }

          // busca chave em segmento
          if (chave.substring(0,4) === 'seg_') {
            console.log('ENTREI!')
            valor = segmentoUsuario
            for (let i in caminho) {
              if (valor[caminho[i]]!==undefined) {
                valor = valor[caminho[i]]
                console.log('valor de segmento:', valor)
              }
            }  
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

  refreshHome(item, vigente, origem) {
    return this.firebaseHelper.getUser(this.uid).then((usuario) => {
      this.home[item].vigente = origem==='home' ? vigente : this.home[item].vigente
      if (!vigente) { //se for para desligar, não precisa avaliar critério
        this.data_Home[item].vigente = vigente 
      } else {
        if (this.data_Home[item]) {
          if (usuario[item] && usuario[item].vigente !== undefined) {
            if (origem==='home' && usuario[item].vigente) {
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

