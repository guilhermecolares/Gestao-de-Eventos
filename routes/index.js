import express from 'express'
import usuario from './usuario.js'
import evento from './evento.js'
import admin from './admin.js'
import Usuario from '../models/Usuario.js'
import Evento from '../models/Evento.js'
import verificarAutenticacao  from '../helpers/vefAuth.js'

const app = express()

const router = express.Router()

// Rotas de usuário
router.use('/usuarios', usuario)

// Rotas de evento
router.use('/eventos', evento)

// Rotas de admin
router.use('/admin', admin)

router.get('/', (req, res) => {
    res.redirect('/index')
})

router.get('/index', verificarAutenticacao, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user._id).lean()
        const usuarioId = usuario._id.toString()

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const seusEventos = await Evento.find({ inscritos: usuario._id })
            .sort({ data: 1 })
            .limit(4)
            .populate('criador', 'nomeDeUsuario')
            .lean()

        const proximosEventos = await Evento.find({ data: { $gte: hoje } })
            .sort({ data: 1 })
            .limit(4)
            .populate('criador', 'nomeDeUsuario')
            .lean()

        proximosEventos.forEach(evento => {
            evento.estaInscrito = evento.inscritos.some(inscrito => inscrito.toString() === usuarioId)
        })

        res.render('index', {
            user: usuario,
            saldo: usuario.saldo.toFixed(2),
            seusEventos,
            proximosEventos,
            exibirSaldo: true
        })
    } catch (err) {
        console.error(err)
        req.flash('error_msg', 'Erro ao carregar os eventos!')
        res.redirect('/index')
    }
})

export default router
