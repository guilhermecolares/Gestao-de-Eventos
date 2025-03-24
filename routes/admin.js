import express from 'express'
import mongoose from 'mongoose'
//import Categoria from '../models/Categoria.js'
//import Evento from '../models/Evento.js'
//import { eAdmin } from '../helpers/eAdmin.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.render('admin/dashboard')
})

export default router