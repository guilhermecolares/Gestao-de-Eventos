import express from 'express'
import mongoose from 'mongoose'
import Evento from '../models/Evento.js'
import { eADM } from '../helpers/eAdmin.js'
import verificarAutenticado from '../helpers/vefAuth.js'
import Categoria from '../models/Categoria.js'
import ExpressHandlebars from 'express-handlebars'
import Handlebars from 'handlebars'


const router = express.Router()

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

Handlebars.registerHelper('formatarData', (data) => {
    return data.toLocaleDateString('pt-BR');
});

Handlebars.registerHelper('formatarMoeda', function (value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
});


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
            return res.render('eventos/edit', { erros, evento });
        }

        const eventoAtualizado = await Evento.findByIdAndUpdate(
            id,
            {
                titulo,
                descricao,
                data: new Date(data),
                preco: preco ? parseFloat(preco) : undefined,
                categoria,
                local,
                capacidade: parseInt(capacidade),
                criador: req.user._id,
            },
            { new: true } // Retorna o documento atualizado
        );

        req.flash('success_msg', 'Evento editado com sucesso!');
        res.redirect('/index');

    } catch (error) {
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

router.post('/inscrever/:id', verificarAutenticado, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id; // Pegando o ID do usuário autenticado

        // Verifica se o ID é válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error_msg', 'ID inválido!');
            return res.redirect('/index');
        }

        const evento = await Evento.findById(id);
        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado!');
            return res.redirect('/index');
        }

        // Se o usuário já estiver inscrito, remove ele
        if (evento.inscritos.includes(usuarioId)) {
            evento.inscritos = evento.inscritos.filter(inscrito => inscrito.toString() !== usuarioId);
            await evento.save();
            req.flash('success_msg', 'Você se desinscreveu do evento.');
        } else {
            evento.inscritos.push(usuarioId);
            await evento.save();
            req.flash('success_msg', 'Inscrição realizada com sucesso!');
        }

        res.redirect('/index');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao processar a inscrição!');
        res.redirect('/index');
    }
});

router.get('/proximos', async (req, res) => {
    try {
        const hoje = new Date();
        const proximosEventos = await Evento.find({ data: { $gte: hoje } }).populate('criador', 'nomeDeUsuario');

        res.render('eventos/proxeventos', { proximosEventos });
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        req.flash('error_msg', 'Erro ao carregar eventos.');
        res.redirect('/index');
    }
});

export default router