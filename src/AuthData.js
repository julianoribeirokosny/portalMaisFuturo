/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

/**
 * Handles saving the user's data to the store and displaying TermoServico settings to new users.
 */
export default class AuthData {
  /**
   * Initializes Friendly Pix's auth.
   * Binds the auth related UI components and handles the auth flow.
   * @constructor
   */
  constructor(firebaseHelper, termoServicoSettings) {
    this.firebaseHelper = firebaseHelper;
    this.termoServicoSettings = termoServicoSettings;

    // Firebase SDK
    this.auth = firebase.auth();

    // Pointers to DOM Elements
    //this.uploadButton = $('button#add');
    //this.mobileUploadButton = $('button#add-floating');

    this.auth.onAuthStateChanged((user) => this.onAuthStateChanged(user));
  }

  /**
   * Displays the signed-in user information in the UI or hides it and displays the
   * "Sign-In" button if the user isn't signed-in.
   */
  async onAuthStateChanged(user) {
    console.log('onAuthStateChanged -> AuthData')
    if (user) {
      const snapshot = await this.firebaseHelper.updatePublicProfile();
      console.log('snapshot.val()', snapshot.val())
      //const snapshot = await this.firebaseHelper.getTermoServicoSettings(user.uid);
      const settings = snapshot.val();
      // display TermoServico modal if there are no TermoServico preferences
      if (!settings || !settings.termo_servico) {
        this.termoServicoSettings.showTermoServicoDialog();
      }
    }
  }
};
