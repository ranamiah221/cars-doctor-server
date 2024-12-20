const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port = process.env.PORT || 5000;

// MIDDLE WARE
app.use(cors({
  origin:[
    'http://localhost:5173'
  ],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())


// verify token middleware...
const verifyToken= async(req, res, next)=>{
 const token = req.cookies?.token;
 if(!token){
  return res.status(401).send({message: 'unauthorized access'})
 }
 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
  if(err){
    return res.status(401).send({message: "unauthorized access"})
  }
  req.user = decoded;
  next();
 })
}


 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ungcn7e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri ="mongodb://localhost:27017"
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const servicesCollection = client.db('carsDB').collection('services');
    const bookingCollection = client.db('carsDB').collection('booking');


  //  services api
    app.get('/services', async(req, res)=>{
        const cursor = servicesCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/services/:id', async(req, res)=>{
      const id= req.params.id;
      const query={_id : new ObjectId(id)}
      const result = await servicesCollection.findOne(query)
      res.send(result)
    })

    // booking collection operation...
    app.get('/booking',verifyToken, async(req, res)=>{
      console.log(req.query?.email);
      console.log("token owner info", req?.user)
      if(req.query?.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query={};
      if(req.query?.email){
        query= {
          email : req.query?.email
        }
      }
      const result= await bookingCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/booking/:id', async(req, res)=>{
      const id= req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result);
    })

    app.patch('/booking/:id', async(req, res)=>{
      const id= req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updateRequest=req.body;
      const updateDoc = {
        $set: {
          status: updateRequest?.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result)
    })


   app.post('/booking', async(req, res)=>{
    const booking = req.body;
    const result = await bookingCollection.insertOne(booking);
    res.send(result)
   })


    // auth verify api
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' })
      res
      .cookie('token', token , {
        httpOnly: true,
        secure: false,
      })
      .send({success: true})
     })
    //  cookie remove for user logout
    app.post('/logout', async(req, res)=>{
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 }).send({success: true})
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
    res.send('cars doctor server')
})
app.listen(port, ()=>{
    console.log(`cars doctor server running on port : ${port}`);
})