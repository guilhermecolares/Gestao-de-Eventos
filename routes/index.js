import express from 'express';
import usuario from './usuario.js';
import evento from './evento.js';
import Usuario from '../models/Usuario.js';
import Evento from '../models/Evento.js';

const router = express.Router();

// Rotas de usuário
router.use('/usuarios', usuario);

// Rotas de evento
router.use('/evento', evento);

// Rota principal (página inicial)
router.get('/', (req, res) => {
    res.render('index'); // Renderiza a página inicial com EJS
});

// Rota /index (Página inicial após login)
router.get('/index', async (req, res) => {
    if (!req.session.usuarioEmail) {
        return res.redirect('/usuarios/login'); // Redireciona se o usuário não estiver logado
    }

    try {
        // Buscar o usuário pelo e-mail armazenado na sessão
        const usuario = await Usuario.findOne({ email: req.session.usuarioEmail });

        // Buscar os eventos do usuário
        const seusEventos = await Evento.find({ usuarioId: usuario._id });

        // Buscar os próximos eventos gerais
        const proximosEventos = await Evento.find({ data: { $gte: new Date() } }).sort({ data: 1 });

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
