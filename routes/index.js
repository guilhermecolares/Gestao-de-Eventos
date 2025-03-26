import express from "express";
import mongoose from "mongoose";
import admin from './admin.js'
import usuario from './usuario.js'

const app = express();


const router = express.Router();

router.use('/admin', admin)
router.use('/usuario', usuario)

router.get('/', (req, res) => {
    res.render('index');
});

export default router;
