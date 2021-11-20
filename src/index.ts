import express, { Request, Response, NextFunction } from "express";
import axios from 'axios';
import cors from 'cors';
import md5 from 'md5';

import 'dotenv/config'

const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const apiUrl = 'http://gateway.marvel.com/v1/public'
const app = express();
const port = process.env.PORT

var urls_capas_final:string[] = [""]

function ts_hash() {
  const ts = new Date().getTime().toString();
  const hash = md5(ts + privateKey + publicKey);
  return [ts, hash]
}

app.listen(port, () => {
  console.log(`started server on PORT:${port} `);
});

app.use(cors());
app.use(express.json());

app.get('/pagina/:inicial/:final', (req: Request, res: Response, next: NextFunction) => {

  const PerIni:number = Number(req.params.inicial)
  const PerFin:number = Number(req.params.final)
  const Intervalo:number = PerFin - PerIni;

  let ts, hash:string
  [ ts, hash ] = ts_hash()

  axios.get(`${apiUrl}/characters`, {
    params: {
      limit: Intervalo,
      offset: PerIni,
      ts: ts,
      apikey: publicKey,
      hash: hash,
      orderBy: 'name'
    }
  }).then((response => {
    const personagens: Array<any> = response.data.data.results;
    const nomes: Array<any> = personagens.map(personagem => {
      return {
        nome: personagem.name,
        id: personagem.id,
        imagem: personagem.thumbnail.path + "." +personagem.thumbnail.extension
      }
    });
    const pagina:number = PerFin / Intervalo
    const objRetorno = {
      pagina: pagina,
      quantidade: nomes.length,
      totalPaginas: Math.floor((response.data.data.total/Intervalo)),
      personagens: [...nomes]
    };

    res.status(200).json(objRetorno);

  })).catch( err => {
    console.log(err);
    res.status(500).send("Internal error");
  })
})

app.get('/nome/:nome', (req: Request, res: Response, next: NextFunction) => {
  const nome:string = String(req.params.nome)
  let ts, hash:string
  [ ts, hash ] = ts_hash()

  const urlAPI = `http://gateway.marvel.com/v1/public/characters?name=${nome}&ts=${ts}&apikey=${publicKey}&hash=${hash}`

  axios.get(`${urlAPI}`)
    .then(function (response) {

      const Resp = response.data;
      return res.status(200).json(Resp);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).send("Internal error");
    })
})

app.get('/pid/:pid', (req: Request, res: Response, next: NextFunction) => {
  const PerID = Number(req.params.pid)
  let ts: string
  let hash:string
  [ ts, hash ] = ts_hash()

  const urlAPI = `http://gateway.marvel.com/v1/public/characters?id=${PerID}&ts=${ts}&apikey=${publicKey}&hash=${hash}`

  axios.get(`${urlAPI}`)
    .then( function(response) {

      const nome:any = response.data.data.results[0].name
      const descricao:any = response.data.data.results[0].description
      const imagem:any = response.data.data.results[0].thumbnail.path + "." + response.data.data.results[0].thumbnail.extension
      const HQs:Array<any> = response.data.data.results[0].comics.items
      const HQnomes: Array<any> = HQs.map((elem) =>  { return elem.name })

      let lista_urls:string[] = []
      let so_o_titulo:string[] = []
      let listaCapas:string[] = []
      let Final_URLs_Capas:string[]=[]

      HQnomes.forEach((elm) => {
        const parentesis:number = elm.indexOf("(")
        const titulo:string = elm.substring(0, parentesis-1);
        so_o_titulo.push(titulo)
      })
      // so_o_titulo é a lista de títulos com cacteres aa esquerda do primeiro "("

      // remove os titulos repetidos
      const titulos_unicos = [...new Set(so_o_titulo)];

      TodasCapas(PerID, titulos_unicos, listaCapas).then(response => {
        Final_URLs_Capas = response
        const objRetorno = {
          nome: nome,
          descricao: descricao,
          imagem: imagem,
          titulos: [...HQnomes],
          urls_capas: [...Final_URLs_Capas]
        };
        return res.status(200).json(objRetorno);
      })
    })
    .catch( (error) =>{
      console.log(error);
      res.status(500).send("Internal error");
    })
})

async function TodasCapas(PerID:number, titulos:Array<string>, listaCapas:Array<string>){
  let ts: string
  let hash:string
  [ ts, hash ] = ts_hash()

  for (let tit of titulos) {
    const urlAPI = `http://gateway.marvel.com/v1/public/comics?title=${tit}&characters=${PerID}   &ts=${ts}&apikey=${publicKey}&hash=${hash}`

    await capas(encodeURI(urlAPI)).then(response => {
      response.forEach(function (el) {
        listaCapas.push(el)
      })
    })
  }
  return listaCapas
}

async function capas (urlAPI:string) {
  return await axios.get(`${urlAPI}`)

  .then(response => {
    let URLs:string[] = []
    const capas:Array<any> = response.data.data.results
    const capas_urls = capas.map((elem) => {return (elem.thumbnail.path + "." + elem.thumbnail.extension) })

    //capas_urls é um array de URLs de capas de UM dos títulos de comics

    let tem_not:number

    // verifica se a URl da image é ...not_available...
    capas_urls.forEach(function (elm2, ind2) {
      tem_not = elm2.indexOf('not');  // o indice ou -1
      if (tem_not >= 0) capas_urls[ind2] = "../marvel.png"
      URLs.push(capas_urls[ind2])
    })
    return URLs
  })
}
