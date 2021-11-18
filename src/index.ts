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

app.listen(port, () => {
  console.log(`started server on PORT:${port} `);
});

app.use(cors());
app.use(express.json());

app.get('/pagina/:inicial/:final', (req: Request, res: Response, next: NextFunction) => {

  const PerIni:number = Number(req.params.inicial)
  const PerFin:number =Number(req.params.final)
  const Intervalo:number = PerFin - PerIni

  const ts = new Date().getTime().toString();
  const hash = md5(ts + privateKey + publicKey);

  axios.get(`${apiUrl}/characters`, {
    params: {
      ts: ts,
      apikey: publicKey,
      hash: hash,
      orderBy: 'name',
      limit: Intervalo,
      offset: PerIni
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
    res.json(objRetorno);
  })).catch( err => {
    console.log(err);
    res.status(500).send("Internal error");
  })
})

app.get('/personagem/:id', (req: Request, res: Response, next: NextFunction) => {

})
