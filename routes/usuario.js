import express from 'express'
import mongoose from 'mongoose'
//import Usuario from '../models/Usuario.js'
import bcrypt from 'bcryptjs'
import passport from 'passport'

const router = express.Router()

router.get('/registro', (req, res) => {
    res.send('Página de Registro')
    //res.render('usuarios/registro')
})

router.post('/registro', (req, res) => {

})

router.get('/registro/pessoal', (req, res) => {
    res.send('Página de Registro Pessoal')
    //res.render('usuarios/registro-pessoal')
})

router.post('/registro/pessoal', (req, res) => {

})

export default router