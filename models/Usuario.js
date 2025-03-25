import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { parseISO } from "date-fns";
const Schema = mongoose.Schema;

const Usuario = new Schema({
    nomeDeUsuario: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'O email está inválido']
    },
    senha: {
        type: String,
        required: true,
        match: [/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, 'A senha deve ter pelo menos 6 caracteres, uma letra maiúscula, um número e um caractere especial (@$!%*?&)!']
    },
    nome: {
        type: String,
        required: true
    },
    sobrenome: {
        type: String,
        required: true
    },
    telefone: {
        type: String,
        required: false,
        match: [/^\d{11}$/, 'O telefone deve ter 11 dígitos']
    },
    cpf: {
        type: String,
        required: true,
        match: [/^\d{11}$/, 'O CPF deve ter 11 dígitos']
    },
    dataDeNascimento: {
        type: Date,
        required: true
    },
    eAdmin: {
        type: Number,
        default: 0
    },
    statusDeCadastro: {
        type: String,
        default: 'incompleto'
    },
    codigoDeVerificaçãoDeEmail: {
        type: String,
        required: true
    }
})

Usuario.pre('save', async function(next) {
    if(!this.isModified('senha')) return next()
        try {
            this.senha = await bcrypt.hash(this.senha, 12)
            next()
    } catch (err) {
        next(err)
    }
})

Usuario.pre('save', function(next) {
    if(!this.isModified('dataDeNascimento')) return next()
    this.dataDeNascimento = parseISO(this.dataDeNascimento)
    next()
})

export default mongoose.model('usuarios', Usuario)