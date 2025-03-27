import express from 'express'
import mongoose from 'mongoose'
import Categoria from '../models/Categoria.js'
import Evento from '../models/Evento.js'
import { eADM } from '../helpers/eAdmin.js'
import slugify from 'slugify'

const router = express.Router()

router.get('/', (req, res) => {
    res.render('admin/dashboard')
})

router.get('/categorias', async (req, res) => {
    const categorias = await Categoria.find().lean()
    res.render('admin/categorias', { categorias, hideFooter: true})
})

router.get('/categorias/nova', (req, res) => {
    res.render('admin/addcategorias' , { hideFooter: true})
})

router.post('/categorias/nova', async (req, res) => {
    const { nome } = req.body

    let erros = []

    if (!nome || nome.trim() === '') {
        erros.push({ texto: 'Campo "Nome" vazio!' })
    }

    if (nome.length < 3 || nome.length > 20) {
        erros.push({ texto: 'Numero de caracteres inválido! (3 a 20)'})
    }

    if (erros.length > 0) {
        return res.render('admin/addcategorias', { erros, nome })
    }

    try {
        const novaCategoria = new Categoria({ nome: nome })
        await novaCategoria.save()
        req.flash('success_msg', 'Categoria criada com sucesso!')
        res.redirect('/admin/categorias')
    } catch (error) {
        console.log(error)
        req.flash('error_msg', 'Erro ao cadastrar categoria, tente novamente!')
        return res.redirect('/admin/categorias')
    }
})

router.get('/categorias/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const categoria = await Categoria.findById(id).lean();

        if (!categoria) {
            req.flash('error_msg', 'Categoria não encontrada!');
            return res.redirect('/admin/categorias');
        }

        res.render('admin/editcategorias', { categoria, hideFooter: true });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao carregar categoria, tente novamente!');
        res.redirect('/admin/categorias');
    }
});

router.post('/categorias/edit', async (req, res) => {
    const { id, nome } = req.body

        let erros = []

        if (!id || id.trim() === '') {
            req.flash({ texto: 'ID inválido!' })
            return res.redirect('/admin/categorias')
        }

        if (!nome || nome.trim() === '') {
            erros.push({ texto: 'Campo "Nome" vazio!' })
        }

        if (nome.length < 3 || nome.length > 20) {
            erros.push({ texto: 'Numero de caracteres inválido! (3 a 20)'})
        }

        if (erros.length > 0) {
            return res.render('admin/editcategorias', { erros, nome })
        }

    try {
        const categoriaEdit = await Categoria.findByIdAndUpdate(id, {nome, slug: slugify(nome, { lower: true, strict: true })}, {new: true})

        if (!categoriaEdit) {
            req.flash('error_msg', 'Categoria nao encontrada, tente novamente!')
            return res.redirect('/admin/categorias')
        }

        req.flash('success_msg', 'Categoria editada com sucesso!')
        res.redirect('/admin/categorias')
    } catch (error) {
        console.log(error)
        req.flash('error_msg', 'Erro ao editar categoria, tente novamente!')
        return res.redirect('/admin/categorias')
    }
})

router.post('/categorias/delete/:id', async (req, res) => {
    try {
        const { id } = req.params

        const categoria = await Categoria.findById(id)

        if (!categoria) {
            req.flash('error_msg', 'Categoria nao encontrada, tente novamente!')
            return res.redirect('/admin/categorias')
        }

        await Categoria.findByIdAndDelete(id)
        req.flash('success_msg', 'Categoria deletada com sucesso!')
        res.redirect('/admin/categorias')
    } catch (error) {
        console.error(error)
        req.flash('error_msg', 'Erro ao deletar categoria, tente novamente!')
        res.redirect('/admin/categorias')
    }
})

export default router