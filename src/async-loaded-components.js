'use strict';

import MessagingHelper from './MessagingHelper';
import AuthData from './AuthData';
import FirebaseHelper from './FirebaseHelper';
import TermoServicoSettings from './TermoServicoSettings';
import UserPage from './UserPage';
import Home from './Home';
import PrimeiroLogin from './PrimeiroLogin';

// Carrega o core do app.
const firebaseHelper = new FirebaseHelper();
const termoServicoSettings = new TermoServicoSettings(firebaseHelper);
const messagingHelper = new MessagingHelper(firebaseHelper);
export const userPage = new UserPage(firebaseHelper, messagingHelper);
export const home = new Home(firebaseHelper);
export const primeiroLogin = new PrimeiroLogin(firebaseHelper);
new AuthData(firebaseHelper, termoServicoSettings);
