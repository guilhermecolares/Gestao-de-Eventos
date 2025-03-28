import express from 'express';
import Usuario from '../models/Usuario.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import validator from 'validator';
import { parse, isValid } from 'date-fns';
import bcrypt from 'bcryptjs';


const router = express.Router();

// Rota de registro (única página para todo o processo)
router.get('/registro', (req, res) => {
    res.render('usuarios/registro', { hideFooter: true });
});

// Rota para processar o registro (única rota para todos os dados)
router.post('/registro', async (req, res) => {
    const { nomeDeUsuario, email, senha, senha2, nome, sobrenome, telefone, cpfValue, dataDeNascimento } = req.body;
    let erros = [];

    // Validações dos dados de registro
    if (!nomeDeUsuario || nomeDeUsuario.trim() === '') {
        erros.push({ texto: 'Campo "Nome de Usuário" vazio!' });
    }

    if (nomeDeUsuario.length > 28) {
        erros.push({ texto: 'Nome muito longo! (28 caracteres ou menos)' });
    }

    if (!email || !validator.isEmail(email)) {
        erros.push({ texto: 'Email inválido!' });
    }

    if (senha !== senha2) {
        erros.push({ texto: 'Senhas não conferem, tente novamente!' });
    }

    // Validações dos dados pessoais
    if (!nome || nome.trim() === '') erros.push({ texto: 'Campo "Nome" vazio!' });
    if (!sobrenome || sobrenome.trim() === '') erros.push({ texto: 'Campo "Sobrenome" vazio!' });

    // Verificação do telefone
    if (!telefone || !parsePhoneNumberFromString(telefone, 'BR').isValid()) {
        erros.push({ texto: 'Telefone inválido!' });
    }

    // Removido a validação de CPF
    if (!cpfValue) {
        erros.push({ texto: 'CPF é obrigatório!' });
    }

    // Validação da data de nascimento
    if (!dataDeNascimento) {
        erros.push({ texto: 'Data de nascimento é obrigatória!' });
    } else {
        const dataFormatada = parse(dataDeNascimento, 'yyyy-MM-dd', new Date());
        if (!isValid(dataFormatada)) {
            erros.push({ texto: 'Data de nascimento inválida!' });
        }
    }

    if (erros.length > 0) {
        return res.render('usuarios/registro', { erros, nomeDeUsuario, email, nome, sobrenome, telefone, cpfValue, dataDeNascimento });
    }

    try {
        // Verifica se o email já está cadastrado
        const usuarioExistente = await Usuario.findOne({ email });

        if (usuarioExistente) {
            erros.push({ texto: 'Email já cadastrado!' });
            return res.render('usuarios/registro', { erros, nomeDeUsuario, email });
        }

        // Cria um novo usuário com todos os dados
        const novoUsuario = new Usuario({
            nomeDeUsuario,
            email,
            senha,
            nome,
            sobrenome,
            telefone,
            cpf: cpfValue,
            dataDeNascimento,
            statusDeCadastro: 'completo', // Marca como cadastro completo
        });

        // Salva o novo usuário no banco de dados
        await novoUsuario.save();

        req.flash('success_msg', 'Cadastro completo! Você pode fazer login.');
        res.redirect('/usuarios/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao registrar usuário, tente novamente!');
        res.redirect('/usuarios/registro');
    }
});

// Rota de login
router.get('/login', (req, res) => {
    res.render('usuarios/login');
});

// Processar login sem passport
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    let erros = [];

    if (!email || !senha) {
        erros.push({ texto: 'Por favor, preencha todos os campos.' });
        return res.render('usuarios/login', { erros });
    }

    try {
        // Verifica se o usuário existe
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            erros.push({ texto: 'Email não encontrado.' });
            return res.render('usuarios/login', { erros });
        }

        // Compara a senha fornecida com a senha criptografada no banco
        const senhaCorreta = await usuario.compareSenha(senha);

        if (!senhaCorreta) {
            erros.push({ texto: 'Senha incorreta.' });
            return res.render('usuarios/login', { erros });
        }

        // Cria a sessão para o usuário logado
        req.session.usuarioId = usuario._id;
        req.session.usuarioNome = usuario.nomeDeUsuario;
        req.session.usuarioEmail = usuario.email;

        req.flash('success_msg', 'Login realizado com sucesso!');
        res.redirect('/index');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao tentar fazer login, tente novamente!');
        res.redirect('/usuarios/login');
    }
});

// Rota de logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.redirect('/index');
        }

        res.clearCookie('connect.sid');
        res.redirect('/usuarios/login');
    });
});

export default router;