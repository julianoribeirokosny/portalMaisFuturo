'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import {MaterialUtils} from './Utils';

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
  }

  async showHome() {

    //this.firebaseHelper.

    // Clear previously displayed posts if any.
    //this.clear();

    // Listen for posts deletions.
    this.firebaseHelper.registerForPostsDeletion((postId) => this.onPostDeleted(postId));

    // Load initial batch of posts.
    const data = await this.firebaseHelper.getPosts();
    // Listen for new posts.
    const latestPostId = Object.keys(data.entries)[Object.keys(data.entries).length - 1];
    this.firebaseHelper.subscribeToGeneralFeed(
        (postId, postValue) => this.addNewPost(postId, postValue), latestPostId);
      
    const dados_home = await this.dadosHome('1234567890')

    console.log('dados_home', dados_home)

    var app = new Vue({
        el: '#app',
        data: {      
          home: dados_home
        },
        created() {
          console.log('home montada', this.home)
        }
    })    
  }

  dadosHome(uid) {
    let home = null
    return this.firebaseHelper.getHome().then((data) => {
      if (data) {
        home = data
        return this.firebaseHelper.getUser(uid)
      } else {
        return null;
      }
    }).then((user) => {
      if (user===null) {
        return null
      }
      //merge entre Home e dados do Usuário
      let stringHome = JSON.stringify(home)

      console.log('home', home)

      let erros = 0

      while (stringHome.indexOf('<<') >= 0) {
        console.log('JSON.parse(stringHome)', JSON.parse(stringHome))
        let posIni = stringHome.indexOf('<<')
        let posFim = stringHome.indexOf('>>')
        let chave = stringHome.substring(posIni+2, posFim)
        let caminho = chave.split('.')
        console.log('chave', chave)
        console.log('caminho', caminho)
        let valor = user
        for (let i in caminho) {
          if (valor[caminho[i]]) {
            valor = valor[caminho[i]]
          }
        }
        console.log('typeof valor', typeof valor)

        if (stringHome.indexOf('<<'+ chave + '>>') < 0) {
          stringHome = stringHome.replace('"<<'+ chave + '>>"', 0)
        } else if (typeof valor === "object") {
          valor = JSON.stringify(valor)
          stringHome = stringHome.replace('"<<'+ chave + '>>"', valor)     
        } else {
          stringHome = stringHome.replace('<<'+ chave + '>>', valor)           
        }
        erros++
        if (erros > 100) {
          return null
        }

      }

      //console.log('stringHome', stringHome)
      console.log('stringHome final', JSON.parse(stringHome)) 
      return JSON.parse(stringHome)
    });
  }
}

