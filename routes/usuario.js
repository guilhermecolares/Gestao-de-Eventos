import express from 'express'
import mongoose from 'mongoose'
import Usuario from '../models/Usuario.js'
import bcrypt from 'bcryptjs'
import passport from 'passport'
import { cpf } from 'cpf-cnpj-validator'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { parse, isValid } from 'date-fns'
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'
import Dotenv from 'dotenv'
import { clampWithOptions } from 'date-fns/fp'

const router = express.Router()
const Usuarios = mongoose.model('usuarios')

Dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
}
})

const gerarTokenVerif = (email, token, req, res) => {
    const opçoesEmail = {
        from: 'scrgui01@gmail.com',
        to: req.session.usuarioEmail,
        subject: 'Codigo de Verificação de Email',
        text: `Seu codigo de verificação de email é: ${token}`
    }

    transporter.sendMail(opçoesEmail, (error, info) => {
        if (error) {
            console.error(error)
            req.flash('error_msg', 'Erro ao enviar email, tente novamente!')
            return res.redirect('/usuarios/verificacao')
        } else {
            console.log(`Email enviado: ${info.response} ${info.envelope}`)
            req.flash('success_msg', 'Email enviado com sucesso!')
            return res.redirect('/usuarios/verificacao')
        }
    })
}

router.get('/registro', (req, res) => {
    res.render('usuarios/registro')
  })

router.post('/registro', async (req, res) => {
    const { nomeDeUsuario, email, senha, senha2 } = req.body

    let erros = []

    // VALIDAÇÕES PARA O CAMPO NOME DE USUARIO
    if (!nomeDeUsuario || nomeDeUsuario.trim() === '') {
        erros.push({ texto: 'Campo "Nome de Usuário" vazio!' })
    }

    if (nomeDeUsuario.length > 28) {
        erros.push({ texto: 'Nome muito longo! (28 caracteres ou menos)' })
    }

    // VALIDAÇÕES PARA O CAMPO EMAIL

    try {
        const emailExistente = await Usuarios.findOne({ email })

        if (emailExistente) {
            erros.push({ texto: 'Email ja cadastrado!' })
        }

        const usuarioExistente = await Usuarios.findOne({ nomeDeUsuario })

        if (usuarioExistente) {
            erros.push({ texto: 'Nome de usuário ja cadastrado!' })
        }
    } catch (err) {
        console.log(err)
        req.flash('error_msg', 'Erro ao validar cadastro, tente novamente!')
    }
    

    // VALIDAÇÕES PARA O CAMPO SENHA
    if (!senha || senha.trim() === '') {
        erros.push({ texto: 'Campo "Senha" vazio!' })
    }

    if (!senha2 || senha2.trim() === '') {
        erros.push({ texto: 'Campo "Confirmação de Senha" vazio!' })
    }

    if (senha != senha2) {
        erros.push({ texto: 'Senhas não conferem, tente novamente!' })
    } 

    if (erros.length > 0) {
        res.render('usuarios/registro', { erros: erros, nomeDeUsuario: nomeDeUsuario, email: email })
    } 

    // CRIA O USUARIO NO BANCO DE DADOS

    try {
        const usuario = await Usuarios.findOne({ email })

        if (usuario && usuario.statusDeCadastro === 'incompleto') {
            req.flash('error_msg', 'Finalize seu cadastro!')
            res.redirect('/usuarios/registro/pessoal')
        }

        req.session.usuarioEmail = email

        const novoUsuario = new Usuarios({
            nomeDeUsuario,
            email,
            senha,
            statusDeCadastro: 'incompleto'
        })

        await novoUsuario.save()

        req.flash('success_msg', 'Primeira parte do cadastro concluida!')
        res.redirect('/usuarios/registro/pessoal')
    } catch (err) {
        console.log(err)
        req.flash('error_msg', 'Erro ao cadastrar informações, tente novamente!')
        res.redirect('/usuarios/registro')
    }
    })

router.get('/registro/pessoal', (req, res) => {
    res.render('usuarios/registro-pessoal')
})

router.post('/registro/pessoal', async (req, res) => {
    const { nome, sobrenome, telefone, cpf, dataDeNascimento } = req.body

    let erros = []

    // VALIDAÇÕES PARA O CAMPO NOME
    if (!nome || nome.trim() === '') {
        erros.push({ texto: 'Campo "Nome" vazio!' })
    }

    if (nome.length < 3) {
        erros.push({ texto: 'Nome muito curto! (3 caracteres ou mais)' })
    }

    if (nome > 20) {
        erros.push({ texto: 'Nome muito longo! (20 caracteres ou menos)' })
    }
    
    // VALIDAÇÕES PARA O CAMPO SOBRENOME
    if (!sobrenome || sobrenome.trim() === '') {
        erros.push({ texto: 'Campo "Sobrenome" vazio!' })
    }

    if (sobrenome.length < 3) {
        erros.push({ texto: 'Sobrenome muito curto! (3 caracteres ou mais)' })
    }

    if (sobrenome > 20) {
        erros.push({ texto: 'Sobrenome muito longo! (20 caracteres ou menos)' })
    }

    // VALIDAÇÃO MULTIPLA

    const verifExistencia = async (campo, valor, erroMSG) => {
        try {
            const existe = await Usuarios.findOne({ [campo]: valor })
            if (existe) {
                return erros.push({ texto: erroMSG })
            }
        } catch (err) {
            console.log(err)
            return req.flash('error_msg', 'Erro ao validar cadastro, tente novamente!')
        }
    }

    // VALIDAÇÕES PARA O CAMPO TELEFONE

    const numeroTelefone = parsePhoneNumberFromString(telefone, 'BR')

    if (!numeroTelefone || !numeroTelefone.isValid()) {
        erros.push({ texto: 'Telefone inválido!' })
    } else {
        await verifExistencia('telefone', numeroTelefone.number, 'Telefone ja cadastrado!')
    }

    // VALIDAÇÕES PARA O CAMPO CPF

    if (!cpf.isValid(cpf)) {
        erros.push({ texto: 'CPF inválido!' })
    } else {
        await verifExistencia('cpf', cpf, 'CPF ja cadastrado!')
    }

    // VALIDAÇÕES PARA O CAMPO DATA DE NASCIMENTO

    if (!dataDeNascimento || dataDeNascimento.trim() === '') {
        erros.push({ texto: 'Campo "Data de Nascimento" vazio!' })
    }

    const dataFormatada = parse(dataDeNascimento, 'yyyy-MM-dd', new Date())

    if (!isValid(dataFormatada)) {
        erros.push({ texto: 'Data de Nascimento inválida!' })
    }

    if (erros.length > 0) {
        return res.render('usuarios/registro-pessoal', { erros, nome, sobrenome, telefone, cpf, dataDeNascimento })
    }

    const usuario = await Usuarios.findOne({ email: req.session.usuarioEmail })

    if (!usuario) {
        req.flash('error_msg', 'Usuario não encontrado, tente novamente!')
        return res.redirect('/usuarios/registro')
    }

    const codigoDeVerif = uuidv4()

    usuario.nome = nome
    usuario.sobrenome = sobrenome
    usuario.telefone = telefone
    usuario.cpf = cpf
    usuario.dataDeNascimento = dataDeNascimento
    usuario.codigoDeVerif = codigoDeVerif

    await usuario.save()

    gerarTokenVerif(req.session.email, codigoDeVerif, req, res)

    req.flash('success_msg', 'Informações cadastradas com sucesso! Verifique seu email para finalizar o cadastro!')
    res.redirect('/usuarios/registro/verificacao')
})

router.get('/registro/verificacao', async (req, res) => {
    res.render('usuarios/verificacao')
})

router.post('/registro/verificacao', async (req, res) => {
    const { codigoDeVerificaçãoDeEmail } = req.body

    let erros = []

    try {
        const usuario = await Usuarios.findOne({ email: req.session.usuarioEmail })

        if (!usuario) {
            req.flash('error_msg', 'Usuario não encontrado, tente novamente!')
            return res.redirect('/usuarios/registro')
        }

        if (codigoDeVerificaçãoDeEmail !== usuario.codigoDeVerif) {
            erros.push({ texto: 'Codigo de Verificação de Email inválido!' })
            return res.render('usuarios/verificacao', { erros })
        }
        
        usuario.statusDeCadastro = 'completo'
        await usuario.save()

        req.flash('success_msg', 'Cadastro concluido com sucesso!')
        return res.redirect('/usuarios/login')
    } catch (err) {
        console.log(err)
        req.flash('error_msg', 'Erro ao verificar email, tente novamente!')
        return res.redirect('/usuarios/registro/verificacao')
    }
})

router.get('/login', (req, res) => {
    res.render('usuarios/login')
})

router.post('/login', async (req, res, next) => {
    const { email, senha } = req.body

    passport.authenticate('local', async(err, usuario, info) => {
        if (err) {
            return next(err)
        }
        if (!usuario) {
            req.flash('error_msg', 'Email ou senha incorretos!')
            return res.redirect('/usuarios/login')
        }

        if (usuario.statusDeCadastro === 'incompleto') {
            req.flash('error_msg', 'Finalize seu cadastro!')
            return res.redirect('/usuarios/registro/pessoal')
        }

        req.login(usuario, (err) => {
            if (err) {
                return next(err)
            }
            req.flash('success_msg', 'Logado com sucesso!')
            return res.redirect('/')
        })
    })(req, res, next)
})

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }
        req.flash('success_msg', 'Deslogado com sucesso!')
        res.redirect('/')
    })
})


export default router