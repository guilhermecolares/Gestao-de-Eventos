import express from 'express'
import mongoose from 'mongoose'
import Categoria from '../models/Categoria.js'
import Evento from '../models/Evento.js'
import Usuario from '../models/Usuario.js'
import { eADM } from '../helpers/eAdmin.js'
import slugify from 'slugify'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import validator from 'validator'
import { parse, isValid } from 'date-fns'
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

    const dataObj = new Date(data);
    
    if (isNaN(dataObj.getTime())) return "Data inválida";

    return dataObj.toLocaleDateString('pt-BR');
})


router.get('/painel', eADM, async (req, res) => {
    try {
        const totalUsuarios = await Usuario.countDocuments();
        const totalEventos = await Evento.countDocuments();
        const eventosFuturos = await Evento.countDocuments({ data: { $gte: new Date() } });

        const ultimosEventos = await Evento.find()
            .sort({ criadoEm: -1 })
            .limit(5)
            .lean();

        console.log('Dashboard carregado com sucesso!');

        res.render('admin/painel', {
            user: req.user,
            totalUsuarios,
            totalEventos,
            eventosFuturos,
            ultimosEventos
        });
    } catch (error) {
        req.flash('error_msg', 'Erro ao carregar dashboard');
        res.redirect('/');
    }
});

router.get('/categorias', eADM, async (req, res) => {
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

router.get('/categorias/edit/:id', eADM, async (req, res) => {
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

router.post('/categorias/edit', eADM, async (req, res) => {
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

router.post('/categorias/delete/:id', eADM, async (req, res) => {
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

router.get('/usuarios', eADM, async (req, res) => {
    try {
        const usuarios = await Usuario.find().lean()
        res.render('admin/usuarios', { usuarios } )
    } catch {
        req.flash('error_msg', 'Erro ao carregar usuarios, tente novamente!')
        res.redirect('/admin')
    }
})

router.get('/usuarios/edit/:id', eADM, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findById(id).lean();

        if (!usuario) {
            req.flash('error_msg', 'Usuário não encontrado!');
            return res.redirect('/admin/usuarios');
        }

        res.render('admin/editusuario', { usuario });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao carregar usuário para edição!');
        res.redirect('/admin/usuarios');
    }
});

router.post('/usuarios/edit/:id', eADM, async (req, res) => {
    try {
        console.log('Recebido POST para editar usuário:', req.body)
        const { id } = req.params
        const {
            nomeDeUsuario, senha, email, nome, sobrenome,
            telefone, cpf, eAdmin, saldo, dataDeNascimento
        } = req.body

        const usuario = await Usuario.findById(id)
        let erros = []

        if (!usuario) {
            req.flash('error_msg', 'Usuário não encontrado, tente novamente!')
        }

        // Validações
        if (!nomeDeUsuario || nomeDeUsuario.trim() === '') {
            erros.push({ texto: 'Campo "Nome de Usuário" vazio!' })

        } else if (nomeDeUsuario.length > 28) {
            erros.push({ texto: 'Nome de usuário muito longo! (máx. 28 caracteres)' })
        }

        if (!email || !validator.isEmail(email)) {
            erros.push({ texto: 'Email inválido!' })
        }

        if (!nome || nome.trim() === '') erros.push({ texto: 'Campo "Nome" vazio!' })
        if (!sobrenome || sobrenome.trim() === '') erros.push({ texto: 'Campo "Sobrenome" vazio!' })

        const phoneParsed = parsePhoneNumberFromString(telefone, 'BR')
        if (!telefone || !phoneParsed || !phoneParsed.isValid()) {
            erros.push({ texto: 'Telefone inválido!' })
        }

        if (!cpf || cpf.trim() === '') {
            erros.push({ texto: 'CPF é obrigatório!' })
        }

        if (!dataDeNascimento) {
            erros.push({ texto: 'Data de nascimento é obrigatória!' })
        } else {
            const dataFormatada = parse(dataDeNascimento, 'yyyy-MM-dd', new Date())
            if (!isValid(dataFormatada)) {
                erros.push({ texto: 'Data de nascimento inválida!' })
            } else {
                usuario.dataDeNascimento = dataFormatada
            }
        }

        if (senha && senha.trim().length > 0 && senha.trim().length < 6) {
            erros.push({ texto: 'A senha deve ter pelo menos 6 caracteres!' })
        }

        if (erros.length > 0) {
            return res.render('admin/editusuario', {
                erros,
                usuario: {
                    _id: id,
                    nomeDeUsuario,
                    email,
                    nome,
                    sobrenome,
                    telefone,
                    cpf,
                    eAdmin,
                    saldo,
                    dataDeNascimento
                }
            })
        }

        // Atualizações
        usuario.nomeDeUsuario = nomeDeUsuario
        if (senha && senha.trim() !== '') {
            usuario.senha = senha
        }
        usuario.email = email
        usuario.nome = nome
        usuario.sobrenome = sobrenome
        usuario.telefone = telefone
        usuario.cpf = cpf
        usuario.eAdmin = eAdmin
        usuario.saldo = saldo

        await usuario.save()

        req.flash('success_msg', 'Usuário editado com sucesso!')
        res.redirect('/admin/usuarios')

    } catch (error) {
        console.error(error)
        req.flash('error_msg', 'Erro ao editar usuário, tente novamente!')
        res.redirect('/admin/usuarios')
    }
})

router.get('/usuarios/delete/:id', eADM, async (req, res) => {
    try {
        const { id } = req.params;
        await Usuario.findByIdAndDelete(id);
        req.flash('success_msg', 'Usuário removido com sucesso!');
        res.redirect('/admin/usuarios');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erro ao remover usuário, tente novamente!');
        res.redirect('/admin/usuarios');
    }
});

router.get('/eventos', eADM, async (req, res) => {
    try {
        const eventos = await Evento.find()
            .populate('criador', 'nomeDeUsuario')
            .populate('categoria', 'nome')
            .sort({ data: 1 })
            .lean();

        res.render('admin/eventos', { eventos });
    } catch (error) {
        console.error('Erro ao buscar eventos para admin:', error);
        req.flash('error_msg', 'Erro ao carregar eventos.');
        res.redirect('/index');
    }
});

export default router