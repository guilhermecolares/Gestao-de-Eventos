import mongoose from "mongoose";
import slugify from "slugify";
const Schema = mongoose.Schema;

const Evento = new Schema({
    titulo: {
        type: String,
        required: true
    },
    descricao: {
        type: String,
        required: true
    },
    inscritos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios'
    }],
    data: {
        type: Date,
        required: true
    },
    preco: {
        type: Number,
        required: false
    },
    local: {
        type: String,
        required: true
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorias',
        required: true
    },
    slug: {
        type: String,
        required: false
    },
    imagem: {
        type: String,
    },
    criador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios',
        required: true
    },
    criadoEm: {
        type: Date,
        default: Date.now
    },
    atualizadoEm: {
        type: Date,
        default: Date.now
    }
})

Evento.pre('save', function (next) {
    this.atualizadoEm = Date.now();
    if (!this.slug) {
        this.slug = slugify(this.titulo, { lower: true, strict: true });
    }
    next();
});

Evento.pre('save', function() {
    if (this.isModified('titulo') || this.isNew) {
        this.slug = slugify(this.titulo, { lower: true, strict: true })
        next()
    }
})

export default mongoose.model('evento', Evento)