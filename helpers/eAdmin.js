export const eADM = (req, res, next) => {
    if (req.isAuthenticated() && req.user.eAdmin == true) {
        return next()
    }
    req.flash('error_msg', 'Voce não tem permissao para isso!')
    return res.redirect('/')
}