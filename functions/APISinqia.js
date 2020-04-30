'use strict';

// var express = require('express')
// var cors = require('cors')
// var app = express()

// var corsOptions = {
//     origin: 'http://localhost:5000',
//     optionsSuccessStatus: 200
// }

// app.use(cors(corsOptions))

const request = new XMLHttpRequest();
const methods = {
    get: 'GET',
    post: 'POST'
}
const urls_prod = {
    login: 'https://api-fundoparana.sinqia.com.br/api/acesso/login',
    teste: 'https://us-central1-portalmaisfuturo-teste.cloudfunctions.net/validaEmailLinkKey?k=12345'
}
const urls_hmg = {
    login: 'https://api-fundoparanahmg.sinqia.com.br/api/acesso/login',
    teste: 'https://us-central1-portalmaisfuturo-teste.cloudfunctions.net/validaEmailLinkKey?k=12345'
}
const bearer = 'Bearer mHNrKEXC_jiwX8CCUyEQQM55fvdJZMh4_4SoopdgMQwPKMIWN07gCt45zE4L4FmabQZ0qZtpfsgImdeTxP1BokSANPqvr1TZZYw99rrCI1vpjs_tT4YwUfGNSRzMeQnT9X_aT0ROvLGM9V_JotCytNRXg-fcQqQrs9XfnGpuCjokDxu1HUuzdVHpoKKoIvBs2SFbnzO_H4NqTtoMJsaIGIbcm0'
const bodyLogin = JSON.stringify({
    Login: "admin",
    Password: "atena2011"
});

//const request = require('request-promise');
// const headerLogin = {
//     'Cache-Control': 'no-cache',
//     'Content-Type': 'application/json',
//     'Authorization': 'Bearer mHNrKEXC_jiwX8CCUyEQQM55fvdJZMh4_4SoopdgMQwPKMIWN07gCt45zE4L4FmabQZ0qZtpfsgImdeTxP1BokSANPqvr1TZZYw99rrCI1vpjs_tT4YwUfGNSRzMeQnT9X_aT0ROvLGM9V_JotCytNRXg-fcQqQrs9XfnGpuCjokDxu1HUuzdVHpoKKoIvBs2SFbnzO_H4NqTtoMJsaIGIbcm0'
// };
// const bodyLogin = {
//     'Login': 'admin',
//     'Password': 'atena2011'
// }

// const optionsLogin = {
//     url: 'https://api-fundoparana.sinqia.com.br/api/acesso/login',
//     method: 'POST',
//     headers: headerLogin,
//     body: JSON.stringify(bodyLogin)
// };

module.exports =  {
    
    teste() { 
         //app.get(urls_prod.teste, function (req, res) {
        //     res.send('Hello World')
        //   })

         request.open(methods.get, urls_hmg.teste, true)
        // request.setRequestHeader('Access-Control-Allow-Origin','*')        
        // return request.send()
    },

    loginNewToken() {         
        request.open(methods.post, urls.login, true)

        // request.setRequestHeader('Access-Control-Allow-Origin','*')
        // request.setRequestHeader('Access-Control-Expose-Headers','Content-Length, X-JSON')
        // request.setRequestHeader('Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, OPTIONS')
        // request.setRequestHeader('Access-Control-Allow-Headers','*')
        // request.setRequestHeader('Content-Type', 'application/json')
        // request.setRequestHeader('Cache-Control', 'no-cache')
        // request.setRequestHeader('Authorization', bearer)

        // try {
        //     request.send(bodyLogin)
        //     if (request.status != 200) {
        //       alert(`Error ${request.status}: ${request.statusText}`);
        //     } else {
        //       alert(request.response);
        //     }
        // } catch(err) { // instead of onerror
        //     alert("Request failed");
        // }
    }
}