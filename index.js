const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app=express();
const port = process.env.PORT || 5000;

// MIDDLE WARE
app.use(cors())
app.use(express.json())


app.get('/',(req,res)=>{
    res.send('cars doctor server')
})
app.listen(port, ()=>{
    console.log(`cars doctor server running on port : ${port}`);
})