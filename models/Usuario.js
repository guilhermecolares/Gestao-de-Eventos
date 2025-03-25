import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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
        required: true
    },
    cpf: {
        type: String,
        required: true
    },
    dataDeNascimento: {
        type: Date,
        required: true
    },
    eAdmin: {
        type: Number,
        default: 0
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

export default mongoose.model('usuario', Usuario)