export const vefiricarAutenticado = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }  
    req.flash('error_msg', 'Por favor, faca login para acessar essa pagina!')
    return res.redirect('/usuarios/login')
}
