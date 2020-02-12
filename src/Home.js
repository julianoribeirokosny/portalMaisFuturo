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

    let retDadosHome = await this.dadosHome(this.uid)
    if (!retDadosHome) {
      return 
    }

    Vue.component('grafico-reserva', {
        extends: VueCharts.Doughnut,        
        template: '#grafico-reserva',
        mounted () {
          this.renderChart(
            {              
              labels: this.data_Home.saldo_reserva.grafico.labels,
              datasets: [{
                data: this.data_Home.saldo_reserva.grafico.data,
                backgroundColor: this.data_Home.saldo_reserva.grafico.backgroundColor,
                borderWidth: this.data_Home.saldo_reserva.grafico.borderWidth,
                borderColor: this.data_Home.saldo_reserva.grafico.borderColor
              }]
            },
            {
              cutoutPercentage: 88,
              responsive: true,
              legend: {
                position: 'top',
              }
            }
          )
        }
    });

    var app = new Vue({
      el: '#app',        
      data: {      
        home: this.data_Home,
        toggle: false,          
        provider: {           
          context: null
        }
      },
      methods: {          
        toggleCategory: function() {
          this.toggle = !this.toggle;            
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
      console.log('data', data)
      if (data) {
        this.home = data
        homeAux = data
        return this.firebaseHelper.getUser(uid)
      } else {
        return false;
      }
    }).then((user) => {
      if (user===null) {
        return false
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
      return true
    });
  }

  refreshHome(item, vigente, origem) {
    return this.firebaseHelper.getUser(this.uid).then((usuario) => {
      console.log('refreshHome - ', item, vigente, origem, this.home[item].vigente)
      console.log('usuario', usuario)
      this.home[item].vigente = origem==='home' ? vigente : this.home[item].vigente
      if (!vigente) { //se for para desligar, não precisa avaliar critério
        this.data_Home[item].vigente = vigente 
      } else {
        if (this.data_Home[item]) {
          console.log('1')
          if (usuario[item] && usuario[item].vigente !== undefined) {
            console.log('2')
            if (origem==='home' && usuario[item].vigente) {
              console.log('3')
              this.data_Home[item].vigente = vigente 
            } else if (origem==='usuarios' && this.home[item].vigente) {
              console.log('4')
              this.data_Home[item].vigente = vigente 
            }
          } else {
            console.log('5')
            this.data_Home[item].vigente = vigente 
          }
        }  
  
      }
    })
  }

}

