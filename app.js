import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import flash from 'connect-flash'
import passport from 'passport'
import localAuth from 'passport-local'
import bcrypt from 'bcryptjs'
import { engine } from 'express-handlebars'
import Handlebars from 'handlebars'
import conectarDB from './config/db.js'
import indexRotas from './routes/index.js'
import Usuario from './models/Usuario.js'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import MongoStore from 'connect-mongo'
import methodOverride from 'method-override'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(methodOverride('_method'))

const secret = crypto.randomBytes(64).toString('hex')

// Configuração da sessão
app.use(session({
    secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/eventos' }),
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

// Inicialização do Passport.js
app.use(passport.initialize())
app.use(passport.session())

// Configuração do flash
app.use(flash())

// Middlewares globais
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    res.locals.user = req.user || null
    next()
})

app.use((req, res, next) => {
    const agora = new Date().toISOString()
    console.log(`${agora} ${req.method} ${req.url}`)
    next()
})

// Configuração do Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true
    }
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

// Middlewares para parsing de dados
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Configuração de rotas estáticas
app.use(express.static(path.join(__dirname, 'public')))

// Conexão com o banco de dados
conectarDB()

// Configuração do Passport.js local
passport.use(new localAuth({
    usernameField: 'email',
    passwordField: 'senha'
}, async (email, senha, done) => {
    try {
        const usuarioConta = await Usuario.findOne({ email })

        if (!usuarioConta) {
            console.log('Conta não encontrada:', email)
            return done(null, false, { message: 'Essa conta não existe!' })
        }

        const senhaCorreta = await bcrypt.compare(senha, usuarioConta.senha)

        if (!senhaCorreta) {
            console.log('Senha incorreta:', email)
            return done(null, false, { message: 'Senha incorreta!' })
        }

        console.log('Login bem-sucedido:', email)
        return done(null, usuarioConta)
    } catch (err) {
        console.error('Erro na autenticação:', err)
        return done(err)
    }
}))

passport.serializeUser((usuario, done) => {
    console.log('serializeUser: Serializando o usuário com ID:', usuario._id, 'e email:', usuario.email)
    done(null, usuario._id)
})

passport.deserializeUser(async (id, done) => {
    console.log('deserializeUser: Deserializando com ID:', id)
    try {
        console.log('deserializeUser: Buscando usuário no banco...')
        const usuario = await Usuario.findById(id)
        console.log('deserializeUser: Resultado da busca:', usuario ? usuario.email : 'Usuário não encontrado')
        if (!usuario) {
            console.log('deserializeUser: Usuário não encontrado com ID:', id)
            return done(null, false)
        }
        console.log('deserializeUser: Usuário encontrado:', usuario.email)
        done(null, usuario)
    } catch (err) {
        console.error('deserializeUser: Erro ao deserializar o usuário:', err)
        done(err)
    }
})

// Configuração das rotas
app.use('/', indexRotas)

// Inicialização do servidor
const PORT = 9091
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})

