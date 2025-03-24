import mongoose from "mongoose";
import slugify from "slugify";
const Schema = mongoose.Schema;

const CategoriaEvento = new Schema({
    nome: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: false
    }
})

CategoriaEvento.pre('save', function() {
    if (this.isModified('nome') || this.isNew) {
    this.slug = slugify(this.nome, { lower: true, strict: true })
    }
    next()
})

export default mongoose.model('categoria', CategoriaEvento)