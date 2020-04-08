'use strict';

export default class Financeiro {

    constructor(){}

    //pmt: float
    //i: float
    //n: int
    //return: float.toFixed(2) 2 casas decimais
    valorPresente(pmt, i, n) {
        return (pmt / (i/100) * (1 - Math.pow(1 + (i/100), -n))).toFixed(2)
    }

    //pv: float
    //i: float
    //n: int
    //pmt: float
    //return: float.toFixed(2) 2 casas decimais
    valorFuturo(pv, i, n, pmt) {
        let pow = Math.pow(1 + (i/100), n)
        return ((pmt*(1+(i/100)*0)*(1-pow)/(i/100))-pv*pow).toFixed(2)*(-1)
    }

    //pv: float
    //i: float
    //n: int
    //return: float.toFixed(2) 2 casas decimais
    pgto(pv, i, n) {
        //return  (pv * (i/100) * Math.pow(1 + (i/100), n) / (Math.pow(1 + (i/100), n) - 1 )).toFixed(2)
        return  (pv * i * Math.pow(1+i, n) / (Math.pow(1+i, n) - 1 )).toFixed(2)
    }

    float_to_string(num) {    
        //num = num.toFixed(2)
        return String(String(num).replace('.',',')).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")
    }
}