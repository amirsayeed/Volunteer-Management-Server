const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express();
const port =
    process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const {
    MongoClient,
    ServerApiVersion
} = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tnmpmcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        // await client.connect();

        // await client.db("admin").command({
        //     ping: 1
        // });
        const volunteersNeedCollection = client.db("volunteerNeed_db").collection("volunteers");

        app.post('/addVolunteerNeedPost', async (req, res) => {
            const newVolunteerNeedData = req.body;
            const result = await volunteersNeedCollection.insertOne(newVolunteerNeedData);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Volunteer Management is running')
})

app.listen(port, () => {
    console.log(`Volunteer Management is running on port: ${port}`)
})