import express from 'express'
import mongoose from 'mongoose'
import Usuario from '../models/Usuario.js'
import bcrypt from 'bcryptjs'
import passport from 'passport'

const router = express.Router()
const Usuarios = mongoose.model('usuarios')

router.get('/registro', (req, res) => {
    res.render('usuarios/registro')
})

router.post('/registro', (req, res) => {
    const { nome, email, senha, senha2 } = req.body

    let erros = []

    
})

router.get('/registro/pessoal', (req, res) => {
    res.send('Página de Registro Pessoal')
    //res.render('usuarios/registro-pessoal')
})

router.post('/registro/pessoal', (req, res) => {

})

export default router