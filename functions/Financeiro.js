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
        if (n===0) n = 1
        let pow = Math.pow(1 + (i/100), n)
        //console.log('===> pmt, i, pow, pv', pmt, i, pow, pv)
        return ((pmt*(1+(i/100)*0)*(1-pow)/(i/100))-pv*pow).toFixed(2)*(-1)
    },

    //pv: float
    //i: float
    //n: int
    //return: float.toFixed(2) 2 casas decimais
    pgto(pv, i, n, tem13o) {
        if (n===0) n = 1
        return  (pv * (i/100) * Math.pow(1 + (i/100), n) / (Math.pow(1 + (i/100), n) - 1 )).toFixed(2)
    },

    pgtoMaisFuturo(pv, i, n, tem13o) {
        //console.log('==> pv, i, n, tem13o', pv, i, n, tem13o)
        let vlr13o = 0
        if (tem13o) {
            vlr13o = ((1-(Math.pow( 1+(i/100), -(n/12))))/(i/100))        
            //console.log('==> vlr13o', vlr13o)
        }
        let ret = pv * (1/(((1-(Math.pow((1+(Math.pow((1+(i/100)),(1/12))-1)),(-n))))/(Math.pow((1+(i/100)),(1/12))-1))+vlr13o))
        return ret.toFixed(2)

    },

    pgto_com_Pv(i, n, pv, fv, type) {
        var pmt, pvif;

        fv || (fv = 0);
        type || (type = 0);

        n = Number(n)
        pv = parseFloat(pv)
        fv = parseFloat(fv)
        i = parseFloat(i)
    
        if (n===0) n = 1
        if (i === 0) return -(pv + fv)/n;
    
        pvif = Math.pow(1 + (i/100), n);
        //console.log('===> n', n, '- i', i, ' - pv', pv, ' - pvif', pvif, ' - fv', fv )
        pmt = (i/100) / (pvif - 1) * -(pv * pvif + fv);        
        
        //pmt = i * pv * (pvif + fv) / (pvif - 1);
    
        if (type === 1)
            pmt /= (1 + (i/100));
            
        return (pmt * -1);
    },    

    /*float_to_string(num) {    
        //num = num.toFixed(2)
        return String(String(num).replace('.',',')).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")
    },*/

    valor_to_string_formatado(num, casasDecimais, incluiCifrao, fromWeb) {
        let numFormatado = parseFloat(parseFloat(num).toFixed(casasDecimais)) //arruma qqr forma que entrar
        if (incluiCifrao) {
            numFormatado = numFormatado.toLocaleString('pt-BR', {minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais, style: 'currency', currency: 'BRL'});
        } else {
            numFormatado = numFormatado.toLocaleString('pt-BR', {minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais});
        }
        if (!fromWeb) {
            numFormatado = numFormatado.replace(/,/g,'#')
            numFormatado = numFormatado.replace('.',',')
            numFormatado = numFormatado.replace(/#/g,'.')
        }
        return numFormatado
    },

    calculaReservaFutura (reservaTotal, taxaAnual, contribParticipante, contribParticipantePlanoPatrocinado, contribPatronal, dataInicioRenda, tipoPlano) {
        //let qtdMeses = this.calculaQuantidadeMeses(dataInicioRenda)
        let qtdMeses = utils.diffDatasEmMeses(new Date(), dataInicioRenda)

        //console.log('===> qtdMeses, dataInicioRenda', qtdMeses, dataInicioRenda)

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
                taxaAnual, 
                Math.trunc(qtdMeses / 12), //incluído por Leandro: garantir somente anos completos 
                (contribParticipantePlanoPatrocinado + contribPatronal).toFixed(2)
            )
            //console.log('decimoTerceiro',decimoTerceiro)
            //console.log('reservaFutura antes',reservaFutura)
            reservaFutura += decimoTerceiro
            //console.log('reservaFutura depois',reservaFutura)
        }
                                                    
        return reservaFutura.toFixed(2)
    },

    /*calculaQuantidadeMeses(dataInicioRenda) {
        let dateNow = new Date()
        let qtdMeses = (dataInicioRenda.getFullYear() - dateNow.getFullYear()) * 12;
        qtdMeses -= dateNow.getMonth();
        qtdMeses += dataInicioRenda.getMonth();
        return qtdMeses <= 0 ? 0 : qtdMeses;
    },*/

    calculaRendaFutura(reservaTotalFutura, taxaAnual, qtdAnosRenda, tipoPlano) {
        //let taxaMensal = this.calculaTaxaMensal(taxaAnual)
        //console.log('===> taxaMensal', taxaMensal)
        //rendaMensal = this.pgto(reservaTotalFutura, taxaMensal, (qtdAnosRenda*12))      

        let rendaMensal = this.pgtoMaisFuturo(reservaTotalFutura, taxaAnual, qtdAnosRenda * 12, tipoPlano==='jmalucelli')

        return rendaMensal
    },

    calculaContribProjetada(taxaAnual, qtdMesesAteHoje, reservaHoje, reservaTotalFutura) {
        //console.log('===> taxaAnual, qtdMesesAteHoje, reservaHoje, reservaTotalFutura', taxaAnual, qtdMesesAteHoje, reservaHoje, reservaTotalFutura)
        let taxaMensal = this.calculaTaxaMensal(taxaAnual)
        //console.log('===> taxa mensal', taxaMensal)
        let contribMensal = this.pgto_com_Pv(taxaMensal, qtdMesesAteHoje, reservaHoje, reservaTotalFutura, 1)
        return contribMensal
    },

    calculaTaxaMensal(taxaAnual) {
        return (Math.pow(taxaAnual/100+1, 1/12)-1) * 100
    },

    calculaDataInicioRenda(dataNasc, idadeApos) {
        //garante que a data estará no formato dd/mm/aaaa
        dataNasc = utils.dateFormat(dataNasc, false, false, true)
        let dateParts = dataNasc.split('/')
        return new Date(Number(dateParts[2]) + Number(idadeApos), dateParts[1] - 1, dateParts[0])
    },

    calculaCrescimentoRealAnual(valorContribuicaoHoje, valorReservaHoje, qtdMesesDesdeAdesao) {
        let percCresc = valorReservaHoje / (valorContribuicaoHoje * qtdMesesDesdeAdesao)
        let percCrescAnualizado = (Math.pow(Math.pow(percCresc, (1/qtdMesesDesdeAdesao)), 12) - 1) * 100
        return percCrescAnualizado < 0 ? 0 : percCrescAnualizado
    },

    valorFormatoDesc(num) {
        let ret = ''
        if (Math.abs(num) > 999999) {
            ret = this.valor_to_string_formatado(Math.sign(num)*((Math.abs(num)/1000000)), 1, true, false) 
            if (ret.indexOf(',0') >= 0) { //se o final do valor for ",0" retira...
                ret = this.valor_to_string_formatado(Math.sign(num)*((Math.abs(num)/1000000)), 0, true, false) 
            }
            ret = ret + ' Mi'
        } else if (Math.abs(num) > 999) {
            ret = this.valor_to_string_formatado(Math.sign(num)*((Math.abs(num)/1000)), 3, true, false) 
            if (ret.indexOf(',0') >= 0) { //se o final do valor for ",0" retira...
                ret = this.valor_to_string_formatado(Math.sign(num)*((Math.abs(num)/1000)), 0, true, false) 
            }
            ret = ret + ' mil'
        } else {
            ret = this.valor_to_string_formatado(num, 2, true, false)
            if (ret.indexOf(',0') >= 0) { //se o final do valor for ",0" retira...
                ret = this.valor_to_string_formatado(num, 0, true, false) 
            }
        }
        return ret
    }

}