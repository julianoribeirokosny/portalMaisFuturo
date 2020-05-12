'use strict';

module.exports =  {

    dateFormat : function (x, completo, soNumeros, dd_mm_yyyy) {

        if (!(x instanceof Date)) { //se String e não date... converte
            let dateParts = x.split('/')
            if (dateParts.length === 1) {
                dateParts = x.split('-')
                if (dateParts.length===1) {
                    return null //erro no formato de data de entrada: nem "-" nem "/" na formatação
                }
            }
            //se AAAA-MM-DD
            if (Number(dateParts[0]) > Number(dateParts[2])) {
                x = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
            } else {
                x = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]))
            }
        }

        let ret = ''
        let y = x.getFullYear().toString();
        let m = (x.getMonth() + 1).toString();
        let d = x.getDate().toString();
        let ho = x.getHours().toString();
        let mi = x.getMinutes().toString();
        let se = x.getSeconds().toString();
        
        (d.length == 1) && (d = '0' + d);
        (m.length == 1) && (m = '0' + m);
        (ho.length == 1) && (ho = '0' + ho);
        (mi.length == 1) && (mi = '0' + mi);
        (se.length == 1) && (se = '0' + se);

        if (soNumeros) {
            ret = y + m + d 
            if (completo) {
                ret += ho + mi + se
            }  
        } else {
            if (dd_mm_yyyy) {
                ret = d + '/' + m + '/' + y 
            } else {
                ret = y + '-' + m + '-' + d 
            }
            if (completo) {
                ret += ' ' + ho + ':' + mi + ':' + se
            }  
        }

        return ret
    },

    diffDatasEmMeses : function (dataMenor, dataMaior) {
        if (!(dataMaior instanceof Date)) {
            dataMaior = new Date(dataMaior)
        }
        if (!(dataMenor instanceof Date)) {
            dataMenor = new Date(dataMenor)
        }
        let months;
        months = (dataMaior.getFullYear() - dataMenor.getFullYear()) * 12;
        months -= dataMenor.getMonth() + 1;
        months += dataMaior.getMonth();
        return months <= 0 ? 0 : months;        
    },

    diffDatasEmAnos : function (dataMenor, dataMaior) {
        if (!(dataMaior instanceof Date)) {
            dataMaior = new Date(dataMaior)
        }
        if (!(dataMenor instanceof Date)) {
            dataMenor = new Date(dataMenor)
        }
        let anos = (dataMaior.getFullYear() - dataMenor.getFullYear())
        if (dataMaior.getMonth() < dataMenor.getMonth()) { //se não completou aniversário
            anos--
        }
        return anos <= 0 ? 0 : anos;        
    },

    valorFormatoDesc : function (num) {
        let ret = ''
        if (Math.abs(num) > 999) {
            console.log('===> num', num)
            console.log('===> Math.sign(num)', Math.sign(num))
            console.log('===> (Math.abs(num)/1000)', (Math.abs(num)/1000))
            ret = Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + ' mil' 
        } else if (Math.abs(num) > 999999) {
            ret = Math.sign(num)*((Math.abs(num)/1000000).toFixed(1)) + ' Mi' 
        } else {
            Math.sign(num)*Math.abs(num)            
        }
        return ret
    }

}
