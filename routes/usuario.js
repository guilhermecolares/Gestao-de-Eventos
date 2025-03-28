import express from 'express';
import Usuario from '../models/Usuario.js';
import pkg from 'cpf-cnpj-validator';
const { isValidCPF } = pkg;
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import validator from 'validator';
import { parse, isValid } from 'date-fns';
import passport from 'passport';

const router = express.Router();

// Rota de registro (primeira parte)
router.get('/registro', (req, res) => {
    res.render('usuarios/registro');
});

// Rota para processar o registro
router.post('/registro', async (req, res) => {
    const { nomeDeUsuario, email, senha, senha2 } = req.body;
    let erros = [];

    // Validações
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

    if (erros.length > 0) {
        return res.render('usuarios/registro', { erros });
    }

    try {
        // Verifica se o email já está cadastrado
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            erros.push({ texto: 'Email já cadastrado!' });
            return res.render('usuarios/registro', { erros });
        }

        const novoUsuario = new Usuario({
            nomeDeUsuario,
            email,
            senha,  // A senha será criptografada automaticamente
            statusDeCadastro: 'incompleto',
        });

        await novoUsuario.save();

        req.session.usuarioEmail = email;
        req.flash('success_msg', 'Cadastro inicial concluído!');

        res.redirect('/usuarios/registro/pessoal');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao registrar usuário, tente novamente!');
        res.redirect('/usuarios/registro');
    }
});


// Rota para cadastro de dados pessoais
router.get('/registro/pessoal', (req, res) => {
    res.render('usuarios/registro-pessoal'); // Página de registro pessoal
});

// Rota de registro pessoal POST
router.post('/registro/pessoal', async (req, res) => {
    const { nome, sobrenome, telefone, cpfValue, dataDeNascimento } = req.body;
    let erros = [];

    // Validações
    if (!nome || nome.trim() === '') erros.push({ texto: 'Campo "Nome" vazio!' });
    if (!sobrenome || sobrenome.trim() === '') erros.push({ texto: 'Campo "Sobrenome" vazio!' });

    // Verificação do telefone
    if (!telefone || !parsePhoneNumberFromString(telefone, 'BR').isValid()) {
        erros.push({ texto: 'Telefone inválido!' });
    }

    if (!cpfValue || !isValidCPF(cpfValue)) {
        erros.push({ texto: 'CPF inválido!' });
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
        return res.render('usuarios/registro-pessoal', { erros });
    }

    try {
        const usuario = await Usuario.findOne({ email: req.session.usuarioEmail });
        if (!usuario) {
            console.error('Usuário não encontrado!');
            req.flash('error_msg', 'Usuário não encontrado!');
            return res.redirect('/usuarios/registro');
        }

        usuario.nome = nome;
        usuario.sobrenome = sobrenome;
        usuario.telefone = telefone;
        usuario.cpf = cpfValue;
        usuario.dataDeNascimento = dataDeNascimento;
        usuario.statusDeCadastro = 'completo';

        await usuario.save();
        console.log('Cadastro completo para:', usuario.email);
        req.flash('success_msg', 'Cadastro completo! Você pode fazer login.');
        res.redirect('/usuarios/login');
    } catch (error) {
        console.error('Erro ao completar cadastro:', error);
        req.flash('error_msg', 'Erro ao completar cadastro, tente novamente!');
        res.redirect('/usuarios/registro/pessoal');
    }
});
// Rota de login
router.get('/login', (req, res) => {
    res.render('usuarios/login');
});

// Processar login
router.post('/login', async (req, res, next) => {
    const { email, senha } = req.body;
    let erros = [];

    if (!email || !senha) {
        erros.push({ texto: 'Por favor, preencha todos os campos.' });
        return res.render('usuarios/login', { erros });
    }

    // Verifique o usuário manualmente
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            erros.push({ texto: 'Usuário não encontrado!' });
            return res.render('usuarios/login', { erros });
        }

        // Verifique a senha manualmente, usando bcrypt para comparar a senha com o hash
        const senhaCorreta = await usuario.compareSenha(senha);
        if (!senhaCorreta) {
            erros.push({ texto: 'Senha incorreta!' });
            return res.render('usuarios/login', { erros });
        }

        // Crie a sessão com email e nome de usuário
        req.session.usuarioEmail = email;
        req.session.usuarioNome = usuario.nomeDeUsuario; // Aqui, você armazena o nome do usuário na sessão

        req.flash('success_msg', 'Login realizado com sucesso!');
        res.redirect('/index');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao fazer login, tente novamente!');
        res.redirect('/usuarios/login');
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/index');
        }

        res.clearCookie('connect.sid'); // Limpa o cookie de sessão
        res.redirect('/usuarios/login'); // Redireciona para a página de login
    });
});
export default router;