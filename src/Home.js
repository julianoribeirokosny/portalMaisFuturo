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

    var app = new Vue({
      el: '#app',        
      data: {      
        home: this.data_Home,
        toggle: false
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

      //Verifica se há chaves "não vigentes" ou "para o usuário específico
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
          if (valor[caminho[i]]!==undefined) {
            valor = valor[caminho[i]]
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

