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
    const { titulo, descricao, data, preco, categoria, local } = req.body;

    let erros = [];

    if (!req.user) {
        req.flash('error_msg', 'Você precisa estar logado para criar um evento.');
        return res.redirect('/usuarios/login'); // ou redirecionar para outra página
    }

    if (!titulo || titulo.trim() === '') {
        erros.push({ texto: 'Campo "Título" vazio!' });
    }

    if (erros.length > 0) {
        return res.render('eventos/addeventos', { erros, titulo, descricao, data, preco, categoria, local });
    }

    try {
        const novoEvento = new Evento({
            titulo,
            descricao,
            data: new Date(data),
            preco: preco ? parseFloat(preco) : undefined,
            categoria,
            local,
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
        const { id } = req.params

        const evento = await Evento.findById(id)

        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado!')
            return res.redirect('/index')
        }

        if (evento.criador.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Você não tem permissão para editar esse     evento!')
            return res.redirect('/index')
        }

        const { titulo, descricao, data, preco, categoria, local } = req.body

        let erros = []

        if (!titulo || titulo.trim() === '') {
            erros.push({ texto: 'Campo "Titulo" vazio!' })
        }

        if (titulo.length < 3 || titulo.length > 50) {
            erros.push({ texto: 'Titulo muito curto! (de 3 até 50 Caracteres)' })
        }

        if (!descricao || descricao.trim() === '') {
            erros.push({ texto: 'Campo "Descricao" vazio!' })
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
            erros.push({ texto: 'Preço inválido!' })
        } else if (preco && parseFloat(preco) < 0) {
            erros.push({ texto: 'O preço não pode ser negativo!' })
        }

        if (!categoria) {
            erros.push({ texto: 'Campo "Categoria" vazio!' })
        }

        if (!local || local.trim() === '') {
            erros.push({ texto: 'Campo "Local" vazio!' })
        }

        if (erros.length > 0) {
            return res.render('eventos/edit', { erros, evento })
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
                criador: req.user._id,
            },
            { new: true } // Retorna o documento atualizado
        )

        req.flash('success_msg', 'Evento editado com sucesso!')
        res.redirect('/index')


    } catch (error) {
        req.flash('error_msg', 'Erro ao editar evento, tente novamente!')
        res.redirect('/index')
    }
})

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

export default router
