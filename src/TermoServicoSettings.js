/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import Router from './Router';
import {Utils} from './Utils';

/**
 * Handles the TermoServico Settings UI.
 */
export default class TermoServicoSettings {
  /**
   * Initializes the user's profile UI.
   * @constructor
   */
  constructor(firebaseHelper) {
    this.firebaseHelper = firebaseHelper;

    // DOM Elements for termoServico Consent Modal
    this.termoServicoDialog = $('#termo-servico-dialog');
    this.termoServicoDialogSave = $('.termo-servico-save');
    this.allowTermoServico = $('#allow-termo-servico');
    this.uploadButton = $('button#add');
    this.mobileUploadButton = $('button#add-floating');

    // Event bindings for termoServico Consent Dialog
    //this.termoServicoDialogButton.click(() => this.showTermoServicoDialog());
    this.termoServicoDialogSave.click(() => this.saveTermoServicoSettings());
    this.allowTermoServico.change(() => this.toggleSubmitStates());
    // Prevent the escape key from dismissing the dialog
    this.termoServicoDialog.keydown((e) => {
      if (e.keyCode === 27) return false;
    });
  }

  /**
   * Sets initial state of termoServico Dialog.
   */
  showTermoServicoDialog() {
    console.log('showTermoServicoDialog')
    this.initializeTermoServicoSettings();
    if (window.dialogPolyfill && !this.termoServicoDialog.get(0).showModal) {
      window.dialogPolyfill.registerDialog(this.termoServicoDialog.get(0));
    }
    this.termoServicoDialog.get(0).showModal();
  }

  /**
   * Disable the submit button for the termoServico settings until data termoServico
   * policy is agreed to.
   */
  toggleSubmitStates() {
    if (this.allowTermoServico.is(':checked')) {
      this.termoServicoDialogSave.removeAttr('disabled');
    } else {
      this.termoServicoDialogSave.attr('disabled', true);
    }
  }

  /**
   * Fetches previously saved termoServico settings if they exist and
   * enables the Submit button if user has consented to data processing.
   */
  async initializeTermoServicoSettings() {
    console.log('initializeTermoServicoSettings')
    const uid = firebase.auth().currentUser.uid;
    if (this.savedTermoServicoSettings === undefined) {
      const snapshot = await this.firebaseHelper.getTermoServicoSettings(uid);
      this.savedTermoServicoSettings = snapshot.val();
      if (this.savedTermoServicoSettings) {
        if (this.savedTermoServicoSettings.content) {
          this.allowContent.prop('checked', true);
          this.uploadButton.removeAttr('disabled');
          this.mobileUploadButton.removeAttr('disabled');
        }
      }
    }
  }

  /**
   * Saves new termoServico settings and closes the termoServico dialog.
   */
  saveTermoServicoSettings() {
    // uid of signed in user
    const uid = firebase.auth().currentUser.uid;
    const settings = {
      termo_servico: this.allowTermoServico.prop('checked'),
      data_aceite: Utils.dateFormat(new Date())
    };

    this.firebaseHelper.setTermoServicoSettings(uid, settings);
    if (!settings.social) {
      this.firebaseHelper.removeFromSearch(uid);
    }
    this.termoServicoDialog.get(0).close();
    //Router.reloadPage();
    //this.setUploadButtonState(this.allowContent.prop('checked'));
  }

  setUploadButtonState(enabled) {
    if (enabled) {
      this.uploadButton.removeAttr('disabled');
      this.mobileUploadButton.removeAttr('disabled');
    } else {
      this.uploadButton.prop('disabled', true);
      this.mobileUploadButton.prop('disabled', true);
    }
  }
}
