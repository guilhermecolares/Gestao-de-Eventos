import express from 'express';
import usuario from './usuario.js';
import evento from './evento.js';
import Usuario from '../models/Usuario.js';
import Evento from '../models/Evento.js';
import verificarAutenticacao  from '../helpers/vefAuth.js';

const app = express();

const router = express.Router();

// Rotas de usuário
router.use('/usuarios', usuario);

// Rotas de evento
router.use('/eventos', evento);

router.get('/', (req, res) => {
    res.redirect('/index');
});

// Rota /index (Página inicial após login)
router.get('/index', verificarAutenticacao, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user._id);
        const usuarioId = usuario._id.toString();

        // Buscar os eventos onde o usuário está inscrito
        const seusEventos = await Evento.find({ inscritos: usuario._id })
            .sort({ data: 1 })
            .limit(4)
            .populate('criador', 'nomeDeUsuario')
            .lean();

        // Buscar eventos futuros e garantir que os inscritos sejam carregados
        const proximosEventos = await Evento.find({ data: { $gte: new Date() } })
            .sort({ data: 1 })
            .limit(4)
            .populate('criador', 'nomeDeUsuario')
            .populate('inscritos') // Adiciona os inscritos
            .lean();

        // Adiciona a propriedade 'estaInscrito' nos eventos futuros
        proximosEventos.forEach(evento => {
            evento.estaInscrito = evento.inscritos.some(inscrito => inscrito._id.toString() === usuarioId);
        });

        res.render('index', {
            user: usuario,
            seusEventos,
            proximosEventos
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao carregar os eventos!');
        res.redirect('/index');
    }
});

export default router;
