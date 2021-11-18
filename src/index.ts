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
  const PerFin:number =Number(req.params.final)
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
        id: personagem.id
      }
    });
    const pagina:number = PerFin / Intervalo
    const objRetorno = {
      page: pagina,
      count: nomes.length,
      totalPages: Math.floor((response.data.data.total/Intervalo)),
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
  let ts, hash:string
  [ ts, hash ] = ts_hash()

  console.log(PerID)

  const urlAPI = `http://gateway.marvel.com/v1/public/characters?id=${PerID}&ts=${ts}&apikey=${publicKey}&hash=${hash}`

  console.log(urlAPI)

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




// ID
// `http://gateway.marvel.com/v1/public/characters?id=1009351&ts=${timeStamp}&apikey=${publicKey}&hash=${hash}`

// Pagina
//`http://gateway.marvel.com/v1/public/characters?limit=5&offset=${offset}&ts=${timeStamp}&apikey=${publicKey}&hash=${hash}`

// Nome
// `http://gateway.marvel.com/v1/public/characters?name=Hulk&ts=${timeStamp}&apikey=${publicKey}&hash=${hash}`



//https://gateway.marvel.com:443/v1/public/characters/1009351?apikey=cea87fced5b0ce1d5d455fced61c7dbc
