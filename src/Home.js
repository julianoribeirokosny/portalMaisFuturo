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

    let data_Home = await this.dadosHome(this.uid)
    if (data_Home===null) {
      return 
    }

    console.log('data_Home',data_Home);

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

            this.renderChart({
                labels: ['Início', ' ', ' ', 'Hoje', ' ', '65 anos'],
                datasets: [{
                    label: 'Cobertura por morte',
                    borderColor: '#3e95cd',
                    backgroundColor: 'transparent',
                    data: [281690.1, 281690.1, 281690.1, 281690.1, 281690.1, 281690.1],                    
                    lineTension: 0, 
                    borderWidth: 2
                  },{
                    label: 'Cobertura por invalidez',
                    borderColor: '#8ACE7B',
                    backgroundColor: 'transparent',
                    data: [402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26],
                    lineTension: 0, 
                    borderWidth: 2                    
                  },{
                    label: 'Reserva',
                    borderColor: '#003366',
                    backgroundColor: 'transparent',
                    data: [0, 20000.45, 52780.9, 112500.45, 200000.32, 405321.56],
                    lineTension: 0, 
                    borderWidth: 2                    
                  },{                    
                    label: 'Reserva',
                    borderColor: 'transparent',
                    backgroundColor: gradient,                    
                    data: [0, 20000.45, 52780.9, 112500.45],
                    lineTension: 0,
                    borderWidth: 2
                  }
                ]}, {                  
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


    let projeto_vida = {
      valores: {
        projecao: [
                      { nome:"Renda projetada", valor:"R$ 2.158,54", cor:"color: #033166;" },
                      { nome:"Reserva projetada", valor:"R$ 450.321,56", cor:"color: #033166;" }],
        coberturas: [ { nome:"Cobertura por Invalidez", valor:"R$ 402.415,26", cor:"color: #3e95cd;" },
                      { nome:"Cobertura por Morte", valor:"R$ 281.690,10", cor:"color: #8ACE7B;" }]
      }
    };

    var app = new Vue({
      el: '#app',        
      data: {      
        home: this.data_Home,
        toggle: false,
        projeto: projeto_vida,
      },
      created() {
        console.log("projeto", this.projeto);
      },
      methods: {          
        toggleCategory: function() {
          this.toggle = !this.toggle;
        },
        removerCampanha: function(campanha) {
            campanha.ativo = false;
        }
      }
    });

    //Escuta por alterações na home ou no usuario
    this.firebaseHelper.registerForHomeUpdate((item, vigente) => this.refreshHome(item, vigente, 'home'))
    this.firebaseHelper.registerForUserUpdate(this.uid, (item, vigente) => this.refreshHome(item, vigente, 'usuarios'))
  }

  dadosHome(uid) {
    let homeAux = {}
    return this.firebaseHelper.getHome().then((data) => {
      if (data) {
        this.home = data
        homeAux = data
        return this.firebaseHelper.getUser(uid)
      } else {
        return null;
      }
    }).then((user) => {
      if (user===null) {
        return null
      }

      //Verifica se há chaves "não vigentes" para o usuário específico
      for (let u in user) {
        if (user[u].hasOwnProperty('vigente') && !user[u].vigente) {
          if (homeAux[u] && homeAux[u].hasOwnProperty('vigente')) {
            homeAux[u].vigente = false
          }
        }
      } 

      let stringHome = JSON.stringify(homeAux)

      // MERGE HOME e DADOS USUÁRIOS
      while (stringHome.indexOf('<<') >= 0) {
        let posIni = stringHome.indexOf('<<')
        let posFim = stringHome.indexOf('>>')
        let chave = stringHome.substring(posIni+2, posFim)
        let caminho = chave.split('.')
        let valor = user
        for (let i in caminho) {
          if (valor[caminho[i]]) {
            valor = valor[caminho[i]]
          }
        }

        if (stringHome.indexOf('<<'+ chave + '>>') < 0) {
          stringHome = stringHome.replace('"<<'+ chave + '>>"', 0)
        } else if (typeof valor === "object") {
          valor = JSON.stringify(valor)
          stringHome = stringHome.replace('"<<'+ chave + '>>"', valor)     
        } else {
          stringHome = stringHome.replace('<<'+ chave + '>>', valor)           
        }
      }
      this.data_Home = JSON.parse(stringHome)
      return this.data_Home
    });
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

