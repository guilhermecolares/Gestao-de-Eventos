import passport from 'passport'
import localAuth from 'passport-local'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Usuario from '../models/Usuario.js'

const Usuarios = mongoose.model('usuarios')

passport.use(new localAuth({
    usernameField: 'email',
    passwordField: 'senha'
}, async (email, senha, done) => {
    try {
        const usuarioConta = await Usuarios.findOne({email: email})

        if(!usuarioConta) {
            return done(null, false, {message: 'Essa conta não existe!'})
        }

        const senhaCorreta = await bcrypt.compare(senha, usuarioConta.senha)

        if(!senhaCorreta) {
            return done(null, false,
            {message: 'Senha incorreta!'}
            )
        }

        return done(null, usuarioConta)
    } catch (err) {
        return done(err)
    }
}
))

passport.serializeUser((usuario, done) => {
    done(null, usuario.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const usuario = await Usuarios.findById(id)
        done(null, usuario)
    } catch (err) {
        done(err)
    }
})

export default passport