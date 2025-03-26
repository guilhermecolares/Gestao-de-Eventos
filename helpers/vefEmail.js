export const emailVerificado = (req, res, next) => {
    if (req.isAuthenticated() && req.user.statusDeCadastro === 'completo') {
        return next()
    }
    req.flash('error_msg', 'Finalize seu cadastro!')
    return res.redirect('/usuarios/registro/pessoal')
}