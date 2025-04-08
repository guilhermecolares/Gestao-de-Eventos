import express from 'express'
import Usuario from '../models/Usuario.js'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import validator from 'validator'
import { parse, isValid } from 'date-fns'
import bcrypt from 'bcryptjs'
import passport from 'passport'

const app = express()

const router = express.Router()

router.get('/registro', (req, res) => {
    res.render('usuarios/registro', { hideFooter: true })
})

router.post('/registro', async (req, res) => {
    const { nomeDeUsuario, email, senha, senha2, nome, sobrenome, telefone, cpfValue, dataDeNascimento } = req.body
    let erros = []

    if (!nomeDeUsuario || nomeDeUsuario.trim() === '') {
        erros.push({ texto: 'Campo "Nome de Usuário" vazio!' })
    }

    if (nomeDeUsuario.length > 28) {
        erros.push({ texto: 'Nome muito longo! (28 caracteres ou menos)' })
    }

    if (!email || !validator.isEmail(email)) {
        erros.push({ texto: 'Email inválido!' })
    }

    if (senha !== senha2) {
        erros.push({ texto: 'Senhas não conferem, tente novamente!' })
    }

    if (!nome || nome.trim() === '') erros.push({ texto: 'Campo "Nome" vazio!' })
    if (!sobrenome || sobrenome.trim() === '') erros.push({ texto: 'Campo "Sobrenome" vazio!' })

    if (!telefone || !parsePhoneNumberFromString(telefone, 'BR').isValid()) {
        erros.push({ texto: 'Telefone inválido!' })
    }

    if (!cpfValue) {
        erros.push({ texto: 'CPF é obrigatório!' })
    }

    if (!dataDeNascimento) {
        erros.push({ texto: 'Data de nascimento é obrigatória!' })
    } else {
        const dataFormatada = parse(dataDeNascimento, 'yyyy-MM-dd', new Date())
        if (!isValid(dataFormatada)) {
            erros.push({ texto: 'Data de nascimento inválida!' })
        }
    }

    if (erros.length > 0) {
        return res.render('usuarios/registro', { erros, nomeDeUsuario, email, nome, sobrenome, telefone, cpfValue, dataDeNascimento })
    }

    try {
        const usuarioExistente = await Usuario.findOne({ email })

        if (usuarioExistente) {
            erros.push({ texto: 'Email já cadastrado!' })
            return res.render('usuarios/registro', { erros, nomeDeUsuario, email })
        }

        const novoUsuario = new Usuario({
            nomeDeUsuario,
            email,
            senha,
            nome,
            sobrenome,
            telefone,
            cpf: cpfValue,
            dataDeNascimento,
            statusDeCadastro: 'completo',
            saldo: 0
        })

        await novoUsuario.save()

        req.flash('success_msg', 'Cadastro completo! Você pode fazer login.')
        res.redirect('/usuarios/login')
    } catch (err) {
        console.error(err)
        req.flash('error_msg', 'Erro ao registrar usuário, tente novamente!')
        res.redirect('/usuarios/registro')
    }
})

router.get('/login', (req, res) => {
    res.render('usuarios/login')
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/index',
        failureRedirect: '/usuarios/login',
        failureFlash: true,
    })(req, res, next)
})

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err)
            return res.redirect('/index')
        }

        res.clearCookie('connect.sid')
        res.redirect('/usuarios/login')
    })
})

router.post('/adicionar-saldo', async (req, res) => {
    console.log("Usuário autenticado?", req.user)

    try {
        const { valor } = req.body
        const usuarioId = req.user._id

        if (!usuarioId) {
            return res.status(401).json({ erro: "Usuário não autenticado!" })
        }

        console.log(`Usuário ID: ${usuarioId}`)

        const usuario = await Usuario.findById(usuarioId)
        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado!" })
        }

        usuario.saldo += parseFloat(valor)
        await usuario.save()

        res.status(200).json({ mensagem: "Saldo adicionado com sucesso!", saldo: usuario.saldo })

    } catch (erro) {
        console.error("Erro ao adicionar saldo:", erro)
        res.status(500).json({ erro: "Erro interno no servidor!" })
    }
})
export default router
