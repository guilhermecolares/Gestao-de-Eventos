import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv()

async function conectarDB() {
    try {
        await mongoose.connect('mongodb://localhost/eventos')
        console.log('MongoDB Conectado...')
    } catch(err) {
        console.error(`Erro ao conectar ao banco de dados: ${err.message}`)
        process.exit(1)
    }
}

export default conectarDB