const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const BodyParser = require('body-parser');
const cors = require('cors');
const port = 3001;

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

app.use(cors({origin: '*'}));
app.use(BodyParser.json());

app.get('/', (req, res) => {
    res.send("Hello world!")});

app.post('/usuarios', async (req, res) => {
    try {
        if (req.body.usuario && req.body.senha) {
            const hash = bcrypt.hashSync(req.body.senha);

            await client.connect();
            const usuarios = client.db('QUIS').collection('Usuarios');
            await usuarios.insertOne(
                {
                    usuario: req.body.usuario,
                    senha: hash 
                }
            );
            await client.close();

            return res.status(201).json({ msg: 'O usuario foi criado com sucesso.' })
        }

        return res.status(422).json({ msg: 'Os dados não foram enviados corretamente.' })

    } catch (e) {
        console.log(e);
        if (e.name === 'MongoServerError' && e.code === 11000){
            return res.status(400).json({ msg: 'O usuario já existe.'})
        }
    }
});

app.post('/usuarios/login', async (req, res) => {
    try {
        if (req.body.usuario && req.body.senha) {
            await client.connect();
            const usuarios = client.db('QUIS').collection('Usuarios');
            const usuario = await usuarios.findOne({ usuario: req.body.usuario });

            if (usuario) {
                const ehIgual = bcrypt.compareSync(req.body.senha, usuario.senha);
                if (ehIgual) {
                    res.json({ msg: 'O usuário está autenticado.' });
                } else {
                    res.status(401).json({ msg: 'O usuário ou senha estão errados.' })
                }
            } else {
                res.status(404).json({ msg: 'O usuário não foi encontrado.' });
            }

            return await client.close();
        }

        return res.status(400).json({ msg: 'Os dados não foram enviados corretamente.' });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ msg: 'Deu problema. F' });
    }
});

app.listen(port, async () => {
    try {
        await client.connect();
        await client.db("QUIS").command({ ping: 1 });
        console.log("Base de dados STIM conectada com sucesso.");
        await client.close();
    } catch {
        console.log("Não foi possivel conectar a base de dados.");
    }
});