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

    this.firebaseHelper.

    // Clear previously displayed posts if any.
    this.clear();

    // Listen for posts deletions.
    this.firebaseHelper.registerForPostsDeletion((postId) => this.onPostDeleted(postId));

    // Load initial batch of posts.
    const data = await this.firebaseHelper.getPosts();
    // Listen for new posts.
    const latestPostId = Object.keys(data.entries)[Object.keys(data.entries).length - 1];
    this.firebaseHelper.subscribeToGeneralFeed(
        (postId, postValue) => this.addNewPost(postId, postValue), latestPostId);

    // Adds fetched posts and next page button if necessary.
    this.addPosts(data.entries);
    this.toggleNextPageButton(data.nextPage);
  }
}


