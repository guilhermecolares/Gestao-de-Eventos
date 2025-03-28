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
    import indexRotas from './routes/index.js'

    // CONFIGS DE BIBLIOTECAS
    const app = express()

    // PATH
        import path from 'path'
        import { fileURLToPath } from 'url'
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)

    // SESSION
    app.use(session({
        secret: '44792', 
        resave: true,
        saveUninitialized: true,
        cookie: { secure: false } // Se for usar HTTPS, altere para 'secure: true'
    }));
    
    app.use(passport.initialize());
    app.use(passport.session()); // Certifique-se de que esta linha está após o middleware de sessão
    
    app.use(flash());
    
    // Verificação de logs da sessão
    app.use((req, res, next) => {
        console.log('Sessão:', req.session); // Log para verificar o conteúdo da sessão
        next();
    });

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
        
    // ROUTES
        app.use('/', indexRotas)

// OUTROS
    const PORT = 9091
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`)
    })
