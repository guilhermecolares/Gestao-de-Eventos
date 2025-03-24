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

export default router