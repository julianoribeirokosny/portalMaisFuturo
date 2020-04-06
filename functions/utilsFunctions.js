'use strict';

module.exports =  {

    dateFormat : function (x, completo, soNumeros) {
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
            ret = y + '-' + m + '-' + d 
            if (completo) {
                ret += ' ' + ho + ':' + mi + ':' + se
            }  
        }

        return ret
    },

    diffDatasEmMeses : function (dataMenor, dataMaior) {
        let months;
        months = (dataMaior.getFullYear() - dataMenor.getFullYear()) * 12;
        months -= dataMenor.getMonth() + 1;
        months += dataMaior.getMonth();
        return months <= 0 ? 0 : months;        
    },

    diffDatasEmAnos : function (dataMenor, dataMaior) {
        let anos = (dataMaior.getFullYear() - dataMenor.getFullYear())
        if (dataMaior.getMonth() < dataMenor.getMonth()) { //se não completou aniversário
            anos--
        }
        return anos <= 0 ? 0 : anos;        
    }

}
