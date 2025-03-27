import express from "express";
import mongoose from "mongoose";
import admin from './admin.js'
import usuario from './usuario.js'
import evento from './evento.js'

const app = express();


const router = express.Router();

router.use('/usuario', usuario)
router.use('/evento', evento)

router.get('/', (req, res) => {
    res.render('index');
});

export default router;
