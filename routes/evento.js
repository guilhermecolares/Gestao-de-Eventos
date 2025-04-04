import express from 'express'
import mongoose from 'mongoose'
import Evento from '../models/Evento.js'
import { eADM } from '../helpers/eAdmin.js'
import verificarAutenticado from '../helpers/vefAuth.js'
import Categoria from '../models/Categoria.js'
import Usuario from '../models/Usuario.js'
import ExpressHandlebars from 'express-handlebars'
import Handlebars from 'handlebars'


const router = express.Router()

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
})

Handlebars.registerHelper('formatarData', (data) => {
    return data.toLocaleDateString('pt-BR');
})

Handlebars.registerHelper('formatarMoeda', function (value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
})

Handlebars.registerHelper('formatarData', (data) => {
    if (!data) return "Data não disponível";

    // Converter para objeto Date, caso ainda seja uma string
    const dataObj = new Date(data);
    
    if (isNaN(dataObj.getTime())) return "Data inválida";

    return dataObj.toLocaleDateString('pt-BR');
})


router.get('/', verificarAutenticado, async (req, res) => {
    try {
        const categorias = await Categoria.find().lean();
        res.render('eventos/addeventos', { categorias, hideFooter: true }); 
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao carregar categorias');
        res.redirect('/index');
    }
});

router.post('/', async (req, res) => {
    console.log('req.user:', req.user);
    const { titulo, descricao, data, preco, categoria, local, capacidade } = req.body;

    let erros = [];

    // Verifica se o usuário está autenticado
    if (!req.user) {
        req.flash('error_msg', 'Você precisa estar logado para criar um evento.');
        return res.redirect('/usuarios/login');
    }

    // Validações dos campos obrigatórios
    if (!titulo || titulo.trim() === '') {
        erros.push({ texto: 'Campo "Título" vazio!' });
    }
    if (!data) {
        erros.push({ texto: 'Campo "Data" é obrigatório!' });
    }
    if (preco && isNaN(preco)) {
        erros.push({ texto: 'O preço deve ser um número válido!' });
    }
    if (!capacidade || isNaN(capacidade) || capacidade <= 0) {
        erros.push({ texto: 'A capacidade deve ser um número maior que zero!' });
    }

    if (erros.length > 0) {
        return res.render('eventos/addeventos', { 
            erros, titulo, descricao, data, preco, categoria, local, capacidade 
        });
    }

    try {
        const novoEvento = new Evento({
            titulo,
            descricao,
            data: new Date(data),
            preco: preco ? parseFloat(preco) : undefined,
            categoria,
            local,
            capacidade: parseInt(capacidade),
            criador: req.user._id // Adiciona o criador do evento
        });

        await novoEvento.save();

        req.flash('success_msg', 'Evento criado com sucesso!');
        res.redirect('/index');
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        req.flash('error_msg', 'Erro ao criar evento, tente novamente!');
        res.redirect('/index');
    }
});

router.get('/edit/:id', async (req, res) => {
    try {
        const categorias = await Categoria.find().lean();
        const evento = await Evento.findById(req.params.id).lean()

        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado!');
            return res.redirect('/index')
        }

        res.render('eventos/editeventos', { categorias, evento })
    } catch (err) {
        console.error(err)
        req.flash('error_msg', 'Erro ao carregar evento, tente novamente!')
        res.redirect('/index')
    }
})

router.put('/edit/:id', async (req, res) => {
    console.log('Método:', req.method);
    console.log('Corpo:', req.body);
    
    try {
        const { id } = req.params;
        const evento = await Evento.findById(id);

        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado!');
            return res.redirect('/index');
        }

        if (evento.criador.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Você não tem permissão para editar esse evento!');
            return res.redirect('/index');
        }

        const { titulo, descricao, data, preco, categoria, local, capacidade } = req.body;

        let erros = [];

        if (!titulo || titulo.trim() === '') {
            erros.push({ texto: 'Campo "Título" vazio!' });
        }

        if (titulo.length < 3 || titulo.length > 50) {
            erros.push({ texto: 'Título muito curto! (de 3 até 50 caracteres)' });
        }

        if (!descricao || descricao.trim() === '') {
            erros.push({ texto: 'Campo "Descrição" vazio!' });
        }

        if (!data || data.trim() === '') {
            erros.push({ texto: 'Campo "Data" vazio!' });
        } else {
            const dataEvento = new Date(data);
            if (isNaN(dataEvento.getTime())) {
                erros.push({ texto: 'Data inválida!' });
            } else if (dataEvento < new Date()) {
                erros.push({ texto: 'A data do evento não pode ser no passado!' });
            }
        }

        if (preco && isNaN(parseFloat(preco))) {
            erros.push({ texto: 'Preço inválido!' });
        } else if (preco && parseFloat(preco) < 0) {
            erros.push({ texto: 'O preço não pode ser negativo!' });
        }

        if (!categoria) {
            erros.push({ texto: 'Campo "Categoria" vazio!' });
        }

        if (!local || local.trim() === '') {
            erros.push({ texto: 'Campo "Local" vazio!' });
        }

        if (!capacidade || isNaN(capacidade) || capacidade <= 0) {
            erros.push({ texto: 'A capacidade deve ser um número maior que zero!' });
        }

        if (erros.length > 0) {
            return res.render('eventos/edit', { erros, evento: req.body });
        }

        const eventoAtualizado = await Evento.findByIdAndUpdate(
            id,
            {
                titulo: titulo.toUpperCase(),
                descricao,
                data: new Date(data),
                preco: preco ? parseFloat(preco) : 0,
                categoria,
                local,
                capacidade: parseInt(capacidade),
                criador: req.user._id,
            },
            { new: true, runValidators: true }
        );

        req.flash('success_msg', 'Evento editado com sucesso!');
        res.redirect('/index');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao editar evento, tente novamente!');
        res.redirect('/index');
    }
});

router.delete('/delete/:id', verificarAutenticado, async (req, res) => {
    try {
        const { id } = req.params;
        await Evento.findByIdAndDelete(id);
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.get('/meuseventos', verificarAutenticado, async (req, res) => {
    try {
        const eventos = await Evento.find({ criador: req.user._id }).lean()

        res.render('eventos/meuseventos', { eventos, hideFooter: true })
    } catch (error) {
        console.error(error)
        req.flash('error_msg', 'Erro ao carregar seus eventos, tente novamente!')
        res.redirect('/index')
    }
})

router.get('/eventos/:id', verificarAutenticado, async (req, res) => {
    try {
        const evento = await Evento.findById(req.params.id).lean();
        const usuarioId = req.user._id.toString(); // ID do usuário autenticado

        // Verifica se o usuário já está na lista de inscritos
        const estaInscrito = evento.inscritos.some(inscrito => inscrito.toString() === usuarioId);

        res.render('evento', { evento, estaInscrito }); // Passando a variável para a view
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        res.status(500).send('Erro interno');
    }
});

router.post('/inscrever/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id); // Obtendo usuário autenticado
        const evento = await Evento.findById(req.params.id); // Obtendo evento

        if (!usuario || !evento) {
            req.flash("error_msg", "Usuário ou evento não encontrado.");
            return res.redirect('/index');
        }

        // Converter valores para garantir que são números
        usuario.saldo = Number(usuario.saldo) || 0;
        evento.preco = Number(evento.preco) || 0;

        // Se o evento for gratuito, apenas adiciona o usuário à lista de inscritos
        if (evento.preco === 0) {
            evento.inscritos.push(usuario._id);
            await evento.save();

            req.flash("success_msg", "Inscrição realizada com sucesso!");
            return res.redirect('/index');
        }

        // Se o evento for pago, verifica se o usuário tem saldo suficiente
        if (usuario.saldo >= evento.preco) {
            usuario.saldo -= evento.preco; // Deduz o saldo
            evento.inscritos.push(usuario._id); // Adiciona inscrição
            await usuario.save();
            await evento.save();

            req.flash("success_msg", "Inscrição confirmada!");
        } else {
            req.flash("error_msg", "Saldo insuficiente para inscrição.");
        }

        res.redirect('/index');
    } catch (error) {
        console.error("Erro ao inscrever no evento:", error);
        req.flash("error_msg", "Ocorreu um erro ao se inscrever no evento.");
        res.redirect('/index');
    }
});

router.post('/desinscrever/:id', verificarAutenticado, async (req, res) => {
    try {
        const usuarioId = req.user._id;
        const evento = await Evento.findById(req.params.id);

        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado.');
            return res.redirect('/index');
        }

        // Verifica se o usuário está inscrito
        if (!evento.inscritos.includes(usuarioId)) {
            req.flash('error_msg', 'Você não está inscrito neste evento.');
            return res.redirect('/index');
        }

        // Remove o usuário da lista de inscritos
        await Evento.findByIdAndUpdate(evento._id, {
            $pull: { inscritos: usuarioId }
        });

        // Se o evento for pago, reembolsar o saldo do usuário
        if (evento.preco) {
            await Usuario.findByIdAndUpdate(usuarioId, {
                $inc: { saldo: evento.preco }
            });
        }

        req.flash('success_msg', 'Você foi desinscrito do evento e seu saldo foi reembolsado.');
        res.redirect('/index');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao desinscrever do evento.');
        res.redirect('/index');
    }
});

router.get('/vermais/:id', verificarAutenticado, async (req, res) => {
    try {
        const { id } = req.params;
        const evento = await Evento.findById(id).populate('criador', 'nomeDeUsuario').lean();

        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado!');
            return res.redirect('/index');
        }

        const usuarioId = req.user._id.toString();
        const estaInscrito = evento.inscritos.some(inscrito => inscrito.toString() === usuarioId);

        res.render('eventos/vermais', { evento, estaInscrito });
    } catch (error) {
        console.error("Erro ao buscar evento:", error);
        req.flash('error_msg', 'Erro ao carregar evento.');
        res.redirect('/index');
    }
});

router.get('/proximos', async (req, res) => {
    try {
        const eventos = await Evento.find({ data: { $gte: new Date() } }).sort({ data: 1 }).lean();

        const usuario = req.user;
        const proximosEventos = eventos.map(evento => ({
            ...evento,
            estaInscrito: usuario ? evento.inscritos.includes(usuario._id) : false
        }));

        res.render('eventos/proxeventos', { proximosEventos });
    } catch (err) {
        console.error('Erro ao buscar próximos eventos:', err);
        res.status(500).send('Erro ao buscar próximos eventos');
    }
});

router.get('/eventosinscritos', verificarAutenticado, async (req, res) => {
    try {
        const eventosInscritos = await Evento.find({ inscritos: req.user._id }).populate('criador', 'nomeDeUsuario').lean();
        res.render('eventos/eventosinscritos', { eventosInscritos });
    } catch (error) {
        console.error("Erro ao buscar eventos inscritos:", error);
        req.flash('error_msg', 'Erro ao carregar eventos inscritos.');
        res.redirect('/index');
    }
})

export default router