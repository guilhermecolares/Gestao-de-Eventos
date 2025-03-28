import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Definindo o esquema do usuário
const UsuarioSchema = new mongoose.Schema({
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
    },
    // Outros campos...
});

// Método para comparar a senha
UsuarioSchema.methods.compareSenha = function(senha) {
    return bcrypt.compare(senha, this.senha);
};

// Criar o modelo
const Usuario = mongoose.model('Usuario', UsuarioSchema);

export default Usuario;