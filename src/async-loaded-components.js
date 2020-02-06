'use strict';

import MessagingHelper from './MessagingHelper';
import AuthData from './AuthData';
import FirebaseHelper from './FirebaseHelper';
import PrivacySettings from './PrivacySettings';
import UserPage from './UserPage';
import Home from './Home';
//import Feed from './Feed';
//import Post from './Post';
//import Search from './Search';
//import SearchPage from './SearchPage';
//import Uploader from './Uploader';

// Load the core of the app.
const firebaseHelper = new FirebaseHelper();
const privacySettings = new PrivacySettings(firebaseHelper);
const messagingHelper = new MessagingHelper(firebaseHelper);
export const userPage = new UserPage(firebaseHelper, messagingHelper);
export const home = new Home(firebaseHelper);
//export const post = new Post(firebaseHelper);
//export const feed = new Feed(firebaseHelper);
//export const searchPage = new SearchPage(firebaseHelper);
new AuthData(firebaseHelper, privacySettings);
//new Uploader(firebaseHelper);
//new Search(firebaseHelper);
