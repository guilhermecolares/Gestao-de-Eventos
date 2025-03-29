import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Definindo o esquema do usuário
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
    eAdmin: {
        type: Boolean,
        default: false, // Por padrão, o usuário NÃO é administrador
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash da senha antes de salvar
UsuarioDB.pre('save', async function (next) {
    if (!this.isModified('senha')) return next();
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Método para comparar a senha
UsuarioDB.methods.compareSenha = function (senha) {
    return bcrypt.compare(senha, this.senha);
};

// Criar o modelo
const Usuario = mongoose.model('Usuario', UsuarioDB);

export default Usuario;