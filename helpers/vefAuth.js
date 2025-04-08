import passport from 'passport'
import Usuario from '../models/Usuario.js'

const verificarAutenticacao = (req, res, next) => {
     console.log('Middleware verificarAutenticacao: ID da sessão:', req.sessionID)
     if (req.isAuthenticated()) {
     console.log('Middleware verificarAutenticacao: Usuário autenticado:', req.user.email)
     return next()
     }
     console.log('Middleware verificarAutenticacao: Usuário não autenticado.')
     req.flash('error_msg', 'Faça login para acessar esta página!')
     res.redirect('/usuarios/login')
    }

export default verificarAutenticacao