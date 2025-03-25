// CONFIGS

    // IMPORT DE BIBLIOTECAS
    import express from 'express'
    import mongoose from 'mongoose'
    import session from 'express-session'
    import flash from 'connect-flash'
    import passport from 'passport'
    import auth from './config/auth.js'
    import { engine } from 'express-handlebars'
    import Handlebars from 'handlebars'
    import conectarDB from './config/db.js'

    // CONFIGS DE BIBLIOTECAS
    const app = express()

    // PATH
        import path from 'path'
        import { fileURLToPath } from 'url'
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)

    // SESSION
        app.use((session({
            secret: '44792',
            resave: true,
            saveUninitialized: true,
        })))

        app.use(passport.initialize())
        app.use(passport.session())

        app.use(flash())

    // MIDDLEWARES
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg')
            res.locals.error_msg = req.flash('error_msg')
            res.locals.error = req.flash('error')
            res.locals.user = req.user || null
            next()
        })

    // MIDDLEWARES DE LOGS
        app.use((req, res, next) => {
            const agora = new Date().toISOString()
            console.log(`${agora} ${req.method} ${req.url}`)
            next()
        })

    // HANDLEBARS
        app.engine('handlebars', engine({ 
            defaultLayout: 'main',
            runtimeOptions: {
                allowProtoPropertiesByDefault: true
            }
        }))
        app.set('view engine', 'handlebars')
        app.set('views', path.join(__dirname, 'views'))
    
    // BODY PARSER
        app.use(express.urlencoded({extended: true}))
        app.use(express.json())

    // PUBLIC
        app.use(express.static(path.join(__dirname, 'public')))

    // MONGOOSE
    

    conectarDB()

// ROTAS

    // MODELS
        
    // ROUTES
        import admin from './routes/admin.js'
        import usuarios from './routes/usuario.js'
        import index from './routes/index.js'

        app.use('/admin', admin)
        app.use('/usuario', usuarios)
        app.use('/', index)

// OUTROS
    const PORT = 9091
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`)
    })
