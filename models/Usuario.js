import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UsuarioDB = new mongoose.Schema({
    nomeDeUsuario: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    senha: {
        type: String,
        required: true,
    },
    statusDeCadastro: {
        type: String,
        required: true,
        enum: ['incompleto', 'completo'],
    },
    nome: {
        type: String,
        trim: true,
    },
    sobrenome: {
        type: String,
        trim: true,
    },
    telefone: {
        type: String,
        trim: true,
    },
    cpf: {
        type: String,
        unique: true,
        sparse: true,
    },
    dataDeNascimento: {
        type: Date,
    },
    saldo: {
        type: Number,
        default: 0,
        min: 0,
        max: 10000
    },
    eAdmin: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

UsuarioDB.pre('save', async function (next) {
    if (!this.isModified('senha')) return next()
    const salt = await bcrypt.genSalt(10)
    this.senha = await bcrypt.hash(this.senha, salt)
    next()
})

UsuarioDB.methods.compareSenha = function (senha) {
    return bcrypt.compare(senha, this.senha)
};

const Usuario = mongoose.model('usuario', UsuarioDB)

export default Usuario