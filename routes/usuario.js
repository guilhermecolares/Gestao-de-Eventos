import express from 'express'
import mongoose from 'mongoose'
import Usuario from '../models/Usuario.js'
import bcrypt from 'bcryptjs'
import passport from 'passport'
import { cpf } from 'cpf-cnpj-validator'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { parse, isValid } from 'date-fns'

const router = express.Router()
const Usuarios = mongoose.model('usuarios')

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

    // VALIDAÇÕES PARA O CAMPO TELEFONE

    try {
        const telefoneExistente = await Usuarios.findOne({ telefone })

        if (telefoneExistente) {
            erros.push({ texto: 'Telefone já cadastrado!' })
        }
    } catch (err) {
        console.log(err)
        req.flash('error_msg', 'Erro ao validar telefone, tente novamente!')
    }

    const numeroTelefone = parsePhoneNumberFromString(telefone, 'BR')

    if (!numeroTelefone || !numeroTelefone.isValid()) {
        erros.push({ texto: 'Telefone inválido!' })
    }

    // VALIDAÇÕES PARA O CAMPO CPF
    
    try {
        const cpfExistente = await Usuarios.findOne({ cpf })

        if (cpfExistente) {
            erros.push({ texto: 'CPF já cadastrado!' })
        }
    } catch (err) {
        console.log(err)
        req.flash('error_msg', 'Erro ao validar CPF, tente novamente!')
    }

    if (!cpf.isValid(cpf)) {
        erros.push({ texto: 'CPF inválido!' })
    }

    // VALIDAÇÕES PARA O CAMPO DATA DE NASCIMENTO

    if (!dataDeNascimento || dataDeNascimento.trim() === '') {
        erros.push({ texto: 'Campo "Data de Nascimento" vazio!' })
    }

    const dataFormatada = parse(dataDeNascimento, 'yyyy-MM-dd', new Date())

    if (!isValid(dataFormatada)) {
        erros.push({ texto: 'Data de Nascimento inválida!' })
    }
})

export default router