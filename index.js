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
    ServerApiVersion,
    ObjectId
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
        const volunteersRequestsCollection = client.db("volunteerNeed_db").collection("requestedVolunteers");

        app.get('/addVolunteerNeedPost', async (req, res) => {
            const {
                searchParams
            } = req.query;

            let query = {};

            if (searchParams) {
                query = {
                    title: {
                        $regex: searchParams,
                        $options: "i"
                    }
                };
            }

            const result = await volunteersNeedCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/addVolunteerNeedPost/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await volunteersNeedCollection.findOne(query);
            res.send(result);
        })

        app.post('/addVolunteerNeedPost', async (req, res) => {
            const newVolunteerNeedData = req.body;
            const result = await volunteersNeedCollection.insertOne(newVolunteerNeedData);
            res.send(result);
        })

        //my volunteer need post
        app.get('/myVolunteerNeedPost', async (req, res) => {
            const email = req.query.email;
            const query = {
                oemail: email
            };
            const result = await volunteersNeedCollection.find(query).toArray();
            res.send(result);
        })

        //my volunteer request post
        app.get('/myVolunteerRequests', async (req, res) => {
            const email = req.query.email;
            const query = {
                vemail: email
            }
            const result = await volunteersRequestsCollection.find(query).toArray();
            res.send(result);
        })

        //req to be a volunteer
        app.post('/volunteerRequest/:postId', async (req, res) => {
            const id = req.params.postId;
            const newVolunteerInfo = req.body;
            const result = await volunteersRequestsCollection.insertOne(newVolunteerInfo);
            if (result.acknowledged) {
                await volunteersNeedCollection.updateOne({
                    _id: new ObjectId(id)
                }, {
                    $inc: {
                        noOfVolunteers: -1,
                    },
                })
            }
            res.send(result);
        })

        //

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