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

// Rota /index (Página inicial após login)
router.get('/index', verificarAutenticacao, async (req, res) => {
    try {
        // Buscar o usuário pelo ID armazenado em req.user
        const usuario = await Usuario.findById(req.user._id);

        // Buscar os eventos do usuário
        const seusEventos = await Evento.find({ usuarioId: usuario._id }).sort({ data: 1 }).limit(4).populate('criador', 'nomeDeUsuario').lean();

        // Buscar os próximos eventos gerais
        const proximosEventos = await Evento.find({ data: { $gte: new Date() } }).sort({ data: 1 }).limit(4).populate('criador', 'nomeDeUsuario').lean()

        // Passar os dados para o template
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
