import passport from 'passport';
import localAuth from 'passport-local';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';

passport.use(new localAuth({
    usernameField: 'email',
    passwordField: 'senha'
}, async (email, senha, done) => {
    try {
        const usuarioConta = await Usuario.findOne({ email });

        if (!usuarioConta) {
            return done(null, false, { message: 'Essa conta não existe!' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuarioConta.senha);

        if (!senhaCorreta) {
            return done(null, false, { message: 'Senha incorreta!' });
        }

        return done(null, usuarioConta);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((usuario, done) => {
    done(null, usuario._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const usuario = await Usuario.findById(id);
        done(null, usuario);
    } catch (err) {
        done(err);
    }
});

export default passport;
