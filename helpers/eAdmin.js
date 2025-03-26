export const eADM = (req, res, next) => {
    if (req.isAuthenticated() && req.user.eAdmin == 1) {
        return next()
    }
    req.flash('error_msg', 'Voce não tem permissao para isso!')
    return res.redirect('/')
}