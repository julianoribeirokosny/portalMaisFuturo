'use strict';

const request = require('request-promise');
const headerLogin = {
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mHNrKEXC_jiwX8CCUyEQQM55fvdJZMh4_4SoopdgMQwPKMIWN07gCt45zE4L4FmabQZ0qZtpfsgImdeTxP1BokSANPqvr1TZZYw99rrCI1vpjs_tT4YwUfGNSRzMeQnT9X_aT0ROvLGM9V_JotCytNRXg-fcQqQrs9XfnGpuCjokDxu1HUuzdVHpoKKoIvBs2SFbnzO_H4NqTtoMJsaIGIbcm0'
};
const bodyLogin = {    
    'Login': 'admin',
    'Password': 'atena2011'
}

let options = {
    url: 'https://us-central1-livid-demo.cloudfunctions.net/bexpoSpoof',
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
};



module.exports =  {    
    
    httpRequest() {        
            return request(options).then((resp) => {
            let responses = JSON.parse(resp)
            console.log('===> responses', responses)
        })
    }
         
}