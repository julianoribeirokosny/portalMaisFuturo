'use strict';
const utils = require('./utilsFunctions')

module.exports =  {

    //pmt: float
    //i: float
    //n: int
    //return: float.toFixed(2) 2 casas decimais
    valorPresente(vlr, i, n) {
        return (vlr / (1+(i/100)) * (1 - Math.pow(1 + (i/100), -n))).toFixed(2)
    },

    //pv: float
    //i: float
    //n: int
    //pmt: float
    //return: float.toFixed(2) 2 casas decimais
    valorFuturo(pv, i, n, pmt) {
        let pow = Math.pow(1 + (i/100), n)
        return ((pmt*(1+(i/100)*0)*(1-pow)/(i/100))-pv*pow).toFixed(2)*(-1)
    },

    //pv: float
    //i: float
    //n: int
    //return: float.toFixed(2) 2 casas decimais
    pgto(pv, i, n) {
        return  (pv * (i/100) * Math.pow(1 + (i/100), n) / (Math.pow(1 + (i/100), n) - 1 )).toFixed(2)
    },

    float_to_string(num) {    
        //num = num.toFixed(2)
        return String(String(num).replace('.',',')).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")
    },

    valor_to_string_formatado(num, casasDecimais) {
        let numFormatado = num.toLocaleString('pt-BR', {minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais});
        numFormatado = numFormatado.replace(',','#').replace('.',',').replace('#','.')
        return numFormatado
    },

    calculaReservaFutura (reservaTotal, taxaAnual, contribParticipante, contribParticipantePlanoPatrocinado, contribPatronal, dataInicioRenda, tipoPlano) {
        let qtdMeses = this.calculaQuantidadeMeses(dataInicioRenda)
        let taxaMensal = this.calculaTaxaMensal(taxaAnual)
        let reservaFutura = this.valorFuturo(
            reservaTotal,
            taxaMensal, 
            qtdMeses,
            (contribParticipante + contribParticipantePlanoPatrocinado + contribPatronal).toFixed(2)
        )
        
        if(tipoPlano == 'jmalucelli') { //se plano J projeta contribuições de 13o
            let decimoTerceiro = this.valorFuturo(
                0, 
                5, 
                Math.trunc(qtdMeses / 12), //incluído por Leandro: garantir somente anos completos 
                (contribParticipantePlanoPatrocinado + contribPatronal).toFixed(2)
            )
            console.log('decimoTerceiro',decimoTerceiro)
            console.log('reservaFutura antes',reservaFutura)
            reservaFutura += decimoTerceiro
            console.log('reservaFutura depois',reservaFutura)
        }
                                                    
        return reservaFutura.toFixed(2)
    },

    calculaQuantidadeMeses(dataInicioRenda) {
        let dateNow = new Date()
        let qtdMeses = (dataInicioRenda.getFullYear() - dateNow.getFullYear()) * 12;
        qtdMeses -= dateNow.getMonth();
        qtdMeses += dataInicioRenda.getMonth();
        return qtdMeses <= 0 ? 0 : qtdMeses;
    },

    calculaRendaFutura(reservaTotal, taxaAnual, qtdAnosRenda) {
        let taxaMensal = this.calculaTaxaMensal(taxaAnual)
        console.log('===> taxaMensal', taxaMensal)
        let rendaMensal = this.pgto(reservaTotal, taxaMensal, (qtdAnosRenda*12))            
        return rendaMensal
    },

    calculaTaxaMensal(taxaAnual) {
        return Math.pow(taxaAnual/100+1, 1/12)-1
    },

    calculaDataInicioRenda(dataNasc, idadeApos) {
        console.log('***> dataNasc', dataNasc)
        //garante que a data estará no formato dd/mm/aaaa
        dataNasc = utils.dateFormat(dataNasc, false, false, true)
        console.log('***> dataNasc2', dataNasc)        

        let dateParts = dataNasc.split('/')
        console.log('***> dateParts', dateParts)                
        return new Date(Number(dateParts[2]) + Number(idadeApos), dateParts[1] - 1, dateParts[0])
    },

    calculaCrescimentoRealAnual(valorContribuicaoHoje, valorReservaHoje, qtdMesesDesdeAdesao) {
        console.log('****> calculaCrescimentoRealAnual - valorContribuicaoHoje, valorReservaHoje, qtdMesesDesdeAdesao', valorContribuicaoHoje, valorReservaHoje, qtdMesesDesdeAdesao)
        let percCresc = valorReservaHoje / (valorContribuicaoHoje * qtdMesesDesdeAdesao)
        let percCrescAnualizado = (Math.pow(Math.pow(percCresc, (1/qtdMesesDesdeAdesao)), 12) - 1) * 100
        return percCrescAnualizado < 0 ? 0 : percCrescAnualizado
    }

}