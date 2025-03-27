import express from 'express'
import mongoose from 'mongoose'
import Evento from '../models/Evento.js'
import { eAdmin } from '../helpers/eAdmin.js'

const router = express.Router()

router.get('/', (_req, res) => {
    res.render('eventos/addeventos')
})

router.post('/', async(req, res) => {
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

    if (!categoria) {
        erros.push({ texto: 'Campo "Categoria" vazio!' })
    }

    if (!local || local.trim() === '') {
        erros.push({ texto: 'Campo "Local" vazio!' })
    }

    if (erros.length > 0) {
        return res.render('eventos/addeventos', { erros, titulo, descricao, data, preco, categoria, local })
    }

    try {
        const novoEvento = new Evento({
            titulo,
            descricao,
            data: new Date(data),
            preco: preco ? parseFloat(preco) : undefined,
            categoria,
            local
        });

        await novoEvento.save();

        req.flash('success_msg', 'Evento criado com sucesso!')
        res.redirect('/')
    } catch (err) {
        req.flash('error_msg', 'Erro ao criar evento, tente novamente!')
        res.redirect('/')
    }
})

router.put('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params

        const evento = await Evento.findById(id)

        if (!evento) {
            req.flash('error_msg', 'Evento não encontrado!')
            return res.redirect('/')
        }

        if (evento.criador.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Você não tem permissão para editar esse     evento!')
            return res.redirect('/')
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

        if (!categoria) {
            erros.push({ texto: 'Campo "Categoria" vazio!' })
        }

        if (!local || local.trim() === '') {
            erros.push({ texto: 'Campo "Local" vazio!' })
        }

        if (erros.length > 0) {
            return res.render('eventos/edit', { erros, evento })
        }

        evento.titulo = titulo
        evento.descricao = descricao
        evento.data = new Date(data)
        evento.preco = preco ? parseFloat(preco) : undefined
        evento.categoria = categoria
        evento.local = local

        await evento.save()

        req.flash('success_msg', 'Evento editado com sucesso!')
        res.redirect('/')


    } catch (error) {
        req.flash('error_msg', 'Erro ao editar evento, tente novamente!')
        res.redirect('/')
    }
})

router.delete('/delete/:id', async (req, res) => {
    
})


export default router